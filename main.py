from flask import Flask, render_template, request, jsonify, send_from_directory, redirect, url_for, session, flash, \
	send_file
import os
import shutil
import time
import json
import re
import glob
import random
import string
import zipfile
import io
from PIL import Image
import numpy as np
from datetime import datetime, timedelta
from werkzeug.utils import secure_filename
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import logging
import base64
import requests
import secrets
import sys
import traceback
import uuid
import threading
import openai
from openai.types.chat import ChatCompletionSystemMessageParam, ChatCompletionUserMessageParam
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from flask_mail import Mail, Message
from authlib.integrations.flask_client import OAuth
from urllib.parse import urlparse, unquote
from threading import Thread
from openai import OpenAI
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import replicate
import hashlib
import mimetypes
from flask_migrate import Migrate

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'dev-key-for-sessions')

# Configure SQLAlchemy
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
# Default: absolute path to photogenic.db in the same folder
default_db_path = 'sqlite:///' + os.path.join(BASE_DIR, 'photogenic.db')
# Allow override via environment variable (e.g. on PythonAnywhere)
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', default_db_path)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)
migrate = Migrate(app, db)

# User model
class User(db.Model, UserMixin):
	__tablename__ = 'user'  # Explicitly set the table name
	id = db.Column(db.Integer, primary_key=True)
	username = db.Column(db.String(50), unique=True, nullable=False)
	email = db.Column(db.String(100), unique=True, nullable=False)
	password_hash = db.Column(db.String(128), nullable=False)
	created_at = db.Column(db.DateTime, default=datetime.utcnow)
	profile_image = db.Column(db.String(200), nullable=True, default='default_profile.jpg')
	bio = db.Column(db.String(500), nullable=True)
	api_keys = db.Column(db.String(1000), nullable=True, default='{}')  # Store user's API keys as JSON string
	reset_token = db.Column(db.String(32), nullable=True)
	reset_token_expiration = db.Column(db.DateTime, nullable=True)

	# Add relationship to Collection
	collections = db.relationship('Collection', backref='owner', lazy='dynamic')

	def set_password(self, password):
		self.password_hash = generate_password_hash(password)

	def check_password(self, password):
		return check_password_hash(self.password_hash, password)

	def get_api_key(self, service):
		if not self.api_keys:
			return None
		try:
			return json.loads(self.api_keys).get(service)
		except:
			return None

	def set_api_key(self, service, key):
		try:
			if not self.api_keys:
				self.api_keys = '{}'
			api_keys = json.loads(self.api_keys)
			api_keys[service] = key
			self.api_keys = json.dumps(api_keys)
			db.session.commit()
		except Exception as e:
			print(f"Error setting API key: {e}")


# Collection model to track file ownership
class Collection(db.Model):
	__tablename__ = 'collection'
	id = db.Column(db.Integer, primary_key=True)
	path = db.Column(db.String(255), nullable=False)
	name = db.Column(db.String(255), nullable=False)
	is_folder = db.Column(db.Boolean, default=False)
	size = db.Column(db.Integer, nullable=True)
	mime_type = db.Column(db.String(100), nullable=True)
	created_at = db.Column(db.DateTime, default=datetime.utcnow)
	modified_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
	owner_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

	def to_dict(self):
		item = {
			'id': self.id,
			'name': self.name,
			'path': self.path,
			'type': 'folder' if self.is_folder else 'file',
			'modified': self.modified_at.isoformat(),
			'created': self.created_at.isoformat(),
			'owner_id': self.owner_id
		}

		if not self.is_folder:
			item['size'] = self.size
			item['url'] = url_for('get_collection_file', path=self.path)

			# Add preview URL for images
			if is_image_file(self.name):
				item['preview'] = url_for('get_collection_thumbnail', path=self.path)
				item['isImage'] = True

		return item


# File Sharing model
class SharedFile(db.Model):
	__tablename__ = 'shared_file'
	id = db.Column(db.Integer, primary_key=True)
	path = db.Column(db.String(255), nullable=False)
	is_folder = db.Column(db.Boolean, default=False)
	owner_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
	shared_with_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
	created_at = db.Column(db.DateTime, default=datetime.utcnow)

	owner = db.relationship('User', foreign_keys=[owner_id], backref=db.backref('shared_by_me', lazy='dynamic'))
	shared_with = db.relationship('User', foreign_keys=[shared_with_id],
	                              backref=db.backref('shared_with_me', lazy='dynamic'))


# User Favorites model
class UserFavorites(db.Model):
	__tablename__ = 'user_favorites'
	id = db.Column(db.Integer, primary_key=True)
	user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
	file_path = db.Column(db.String(500), nullable=False)
	created_at = db.Column(db.DateTime, default=datetime.utcnow)


# User Trash model
class UserTrash(db.Model):
	__tablename__ = 'user_trash'
	id = db.Column(db.Integer, primary_key=True)
	user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
	file_path = db.Column(db.String(500), nullable=False)
	original_path = db.Column(db.String(500), nullable=False)
	deleted_at = db.Column(db.DateTime, default=datetime.utcnow)


# Initialize the database if it doesn't exist
def initialize_database():
	with app.app_context():
		# Create tables if they don't exist
		db.create_all()

		# Add sample users if none exist
		if User.query.count() == 0:
			admin = User(
				username='admin',
				email='admin@photogenic.com',
				is_admin=True
			)
			admin.set_password('password')
			db.session.add(admin)

			test_user = User(
				username='testuser',
				email='test@photogenic.com',
				is_admin=False
			)
			test_user.set_password('password')
			db.session.add(test_user)

			db.session.commit()


# Run database initialization
try:
	initialize_database()
	print("Database initialized successfully")
except Exception as e:
	print(f"Error initializing database: {e}")

# OAuth Configuration
oauth = OAuth(app)
google_client_id = os.environ.get('GOOGLE_CLIENT_ID', 'YOUR_GOOGLE_CLIENT_ID')
google_client_secret = os.environ.get('GOOGLE_CLIENT_SECRET', 'YOUR_GOOGLE_CLIENT_SECRET')
oauth.register(
	name='google',
	client_id=google_client_id,
	client_secret=google_client_secret,
	server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
	client_kwargs={
		'scope': 'openid email profile',
		'prompt': 'select_account'  # Force Google account selection
	},
	authorize_params={
		'access_type': 'offline'  # Get refresh token
	}
)

# Configure login manager
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'
login_manager.login_message = 'Please log in to access this page.'
login_manager.login_message_category = 'info'


@login_manager.user_loader
def load_user(user_id):
	return User.query.get(int(user_id))


# Configure upload paths
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
COLLECTIONS_ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'collections')
THUMBNAILS_ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'thumbnails')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(COLLECTIONS_ROOT, exist_ok=True)
os.makedirs(THUMBNAILS_ROOT, exist_ok=True)


# Helper function to get user collections directory
def get_user_collections_dir(user_id):
	user_dir = os.path.join(COLLECTIONS_ROOT, str(user_id))
	os.makedirs(user_dir, exist_ok=True)
	return user_dir


# Helper function to verify directory ownership
def verify_directory_ownership(path, user_id):
	"""
    Verify that the specified path belongs to the user.
    Returns True if the path is within the user's collections directory,
    False otherwise.
    """
	user_dir = get_user_collections_dir(user_id)
	abs_path = os.path.join(user_dir, path)
	return os.path.normpath(abs_path).startswith(os.path.normpath(user_dir))


# Helper function to verify collection ownership in the database
def verify_collection_ownership(path, user_id):
	"""
    Verify that the specified collection belongs to the user according to database records.
    For folders, checks if any parent folder is owned by the user.
    Returns True if the collection is owned by the user, False otherwise.
    """
	# Exact path match
	collection = Collection.query.filter_by(path=path, owner_id=user_id).first()
	if collection:
		return True

	# For folders, check parent folders
	if path:
		parts = path.split('/')
		for i in range(len(parts)):
			parent_path = '/'.join(parts[:i]) if i > 0 else ''
			parent = Collection.query.filter_by(path=parent_path, is_folder=True, owner_id=user_id).first()
			if parent:
				return True

	# For new paths that don't exist in DB yet, default to filesystem check
	filesystem_check = verify_directory_ownership(path, user_id)

	# Log unauthorized access attempts
	if not filesystem_check:
		app.logger.warning(
			f"Unauthorized access attempt: User {user_id} tried to access path '{path}' which is outside their directory")

	return filesystem_check


# Configure generation output paths
GENERATED_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'generated')
os.makedirs(GENERATED_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload

# API keys
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY', '')
OPENAI_API_ENDPOINT = "https://api.openai.com/v1/chat/completions"
OPENAI_IMAGE_ENDPOINT = "https://api.openai.com/v1/images/generations"

# Pixabay API for image search
PIXABAY_API_KEY = os.environ.get('PIXABAY_API_KEY', '')
PIXABAY_API_ENDPOINT = "https://pixabay.com/api/"

# Initialize OpenAI client
client = OpenAI(api_key=OPENAI_API_KEY)

# Email configuration
app.config['MAIL_SERVER'] = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
app.config['MAIL_PORT'] = int(os.environ.get('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME', 'your-email@gmail.com')
app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD', 'your-email-password')
app.config['MAIL_DEFAULT_SENDER'] = os.environ.get('MAIL_DEFAULT_SENDER', 'your-email@gmail.com')
mail = Mail(app)


# Function to send email asynchronously
def send_async_email(app, msg):
	with app.app_context():
		mail.send(msg)


def send_email(subject, recipient, html_body):
	msg = Message(subject, recipients=[recipient])
	msg.html = html_body
	Thread(target=send_async_email, args=(app, msg)).start()


def safe_path(rel_path: str) -> str:
	"""Return an absolute path inside the COLLECTIONS_ROOT, preventing path traversal."""
	rel_path = rel_path.strip('/')
	abs_path = os.path.normpath(os.path.join(COLLECTIONS_ROOT, rel_path))
	if not abs_path.startswith(COLLECTIONS_ROOT):
		raise ValueError("Invalid path")
	return abs_path


def resize_image(image_path, max_size=1920, quality=85):
	"""Resize an image to a maximum dimension while maintaining an aspect ratio"""
	try:
		with Image.open(image_path) as img:
			# Get original dimensions
			width, height = img.size

			# Calculate new dimensions while maintaining an aspect ratio
			if width > height and width > max_size:
				new_width = max_size
				new_height = int(height * (max_size / width))
			elif height > max_size:
				new_height = max_size
				new_width = int(width * (max_size / height))
			else:
				# The Image is already smaller than max_size
				return

			# Resize the image
			resized_img = img.resize((new_width, new_height), Image.LANCZOS)

			# Save the resized image, overwriting the original
			resized_img.save(image_path, quality=quality, optimize=True)

			print(f"Resized image {os.path.basename(image_path)} from {width}x{height} to {new_width}x{new_height}")
	except Exception as e:
		print(f"Error resizing image {image_path}: {e}")


@app.route('/')
def index():
	return render_template('index.html')


@app.route('/interactive', methods=['GET', 'POST'])
def interactive():
	return render_template('interactive.html')


@app.route('/search-pixabay', methods=['GET'])
def search_pixabay():
	query = request.args.get('query', '')
	if not query:
		return jsonify({"error": "No search query provided"}), 400

	try:
		params = {
			"key": PIXABAY_API_KEY,
			"q": query,
			"image_type": "photo",
			"per_page": 10
		}
		response = requests.get(PIXABAY_API_ENDPOINT, params=params)
		data = response.json()
		return jsonify(data)
	except Exception as e:
		return jsonify({"error": str(e)}), 500


@app.route('/ai-story', methods=['GET'])
def ai_story():
	# Get some default Pixabay images for selection
	pixabay_images = []
	try:
		default_queries = ["story", "imagination", "fantasy", "adventure", "journey"]
		query = random.choice(default_queries)
		params = {
			"key": PIXABAY_API_KEY,
			"q": query,
			"image_type": "photo",
			"per_page": 6
		}
		response = requests.get(PIXABAY_API_ENDPOINT, params=params)
		if response.status_code == 200:
			data = response.json()
			pixabay_images = data.get('hits', [])
	except Exception as ex:
		# Don't let Pixabay errors block the main functionality
		pass

	return render_template('ai_story.html', pixabay_images=pixabay_images)


@app.route('/generate-story', methods=['POST'])
def generate_story():
	error = None
	image_url = None
	image_filename = None
	custom_text = request.form.get('custom_text')
	pixabay_url = request.form.get('pixabay_url')

	# Save form data in session to maintain state
	session['custom_text'] = custom_text
	session['pixabay_url'] = pixabay_url

	try:
		# Process the image if provided
		if 'image' in request.files and request.files['image'].filename:
			image = request.files['image']
			image_filename = secure_filename(image.filename)
			img_path = os.path.join(app.config['UPLOAD_FOLDER'], image_filename)
			image.save(img_path)
			image_url = '/static/uploads/' + image_filename
			session['image_url'] = image_url

			# Resize the image
			resize_image(img_path)
		elif pixabay_url:
			image_url = pixabay_url
			session['image_url'] = image_url

		# Get an initial description for the image or use custom text
		description = None
		if image_url and not custom_text:
			# Generate a simple description based on the image filename or generic descriptions
			if image_filename:
				base_name = os.path.splitext(image_filename)[0]
				description = base_name.replace('_', ' ').replace('-', ' ').title()
			else:
				# Generic descriptions for Pixabay images
				generic_descriptions = [
					"A beautiful landscape with mountains and sky",
					"A serene natural scene with vibrant colors",
					"An inspirational moment captured in perfect detail",
					"A breathtaking view that inspires stories",
					"A captivating image that sparks imagination"
				]
				description = random.choice(generic_descriptions)
			session['description'] = description

		# Use custom text as a prompt if provided
		story_prompt = custom_text if custom_text else description
		if not story_prompt:
			raise Exception("No prompt or description available for story generation.")

		# Generate a story using the OpenAI client
		chat_completion = client.chat.completions.create(
			model="gpt-3.5-turbo",
			messages=[
				ChatCompletionSystemMessageParam(role="system",
				                                 content="You are a creative storyteller that writes vivid, emotional, and engaging short stories."),
				ChatCompletionUserMessageParam(role="user",
				                               content=f"Write a vivid, creative, emotional, and detailed short story based on this input. Keep it under 500 words.\n\nInput: {story_prompt}\n\nStory:")
			],
			max_tokens=800,
			temperature=0.7
		)
		story = chat_completion.choices[0].message.content.strip()
		session['story'] = story
		session['story_prompt'] = story_prompt

		# Generate illustrative image
		try:
			image_generation = client.images.generate(
				prompt=f"Create an artistic illustration for this story: {story[:200]}",
				n=1,
				size="1024x1024",
				response_format="url",
			)
			generated_image_url = image_generation.data[0].url
		except Exception:
			generated_image_url = None
		session['generated_image_url'] = generated_image_url

		# Redirect to the result page
		return redirect(url_for('story_result'))
	except Exception as ex:
		error = f"AI generation failed: {str(ex)}"
		# Return to the main page with an error
		flash(error, 'error')
		return redirect(url_for('ai_story'))


@app.route('/story-result')
def story_result():
	# Get data from the session
	story = session.get('story')
	story_prompt = session.get('story_prompt')
	image_url = session.get('image_url')
	description = session.get('description')
	generated_image_url = session.get('generated_image_url')

	if not story:
		# If no story in session, redirect to the main page
		return redirect(url_for('ai_story'))

	return render_template('story_result.html',
	                       story=story,
	                       story_prompt=story_prompt,
	                       image_url=image_url,
	                       description=description,
	                       generated_image_url=generated_image_url)


@app.route('/regenerate-story', methods=['POST'])
def regenerate_story():
	# Clear the previous story but keep the prompt/image
	if 'story' in session:
		del session['story']
	if 'generated_image_url' in session:
		del session['generated_image_url']

	# Redirect to generate-story with the same inputs
	return redirect(url_for('generate_story'))


# AI Feature routes
@app.route('/ai-features')
def ai_features():
	return render_template('ai_features.html')


@app.route('/ai-stories')
def ai_stories():
	return render_template('ai_stories.html')


@app.route('/ai-image-generation')
def ai_image_generation():
	# Check if a Hugging Face API key is configured
	api_key = os.environ.get('HUGGINGFACE_API_KEY', '')
	api_configured = bool(api_key)

	return render_template('ai_image_generation.html', api_configured=api_configured)


@app.route('/test-huggingface-api')
def test_huggingface_api():
	"""Test the Hugging Face API configuration and return diagnostic information"""
	api_key = os.environ.get('HUGGINGFACE_API_KEY', '')

	if not api_key:
		return jsonify({
			"status": "error",
			"message": "No Hugging Face API key found in environment variables",
			"setup_instructions": "You need to set the HUGGINGFACE_API_KEY environment variable with your API key from Hugging Face."
		})

	# Test the API with a simple request
	test_model = "stabilityai/stable-diffusion-xl-base-1.0"
	api_url = f"https://api-inference.huggingface.co/models/{test_model}"

	headers = {
		"Authorization": f"Bearer {api_key}"
	}

	try:
		# Make a HEAD request to check authentication
		response = requests.head(api_url, headers=headers, timeout=10)

		if response.status_code == 200:
			return jsonify({
				"status": "success",
				"message": "Hugging Face API key is configured correctly",
				"api_key_length": len(api_key),
				"api_key_preview": f"{api_key[:4]}...{api_key[-4:]}" if len(api_key) > 8 else "***"
			})
		elif response.status_code == 401:
			return jsonify({
				"status": "error",
				"message": "Invalid Hugging Face API key",
				"code": response.status_code,
				"setup_instructions": "The API key you provided is invalid. Please check your API key at https://huggingface.co/settings/tokens"
			})
		else:
			return jsonify({
				"status": "warning",
				"message": f"Unexpected response from Hugging Face API: {response.status_code}",
				"code": response.status_code,
				"setup_instructions": "API connectivity issues detected. Your API key may be valid, but the service may be unavailable."
			})

	except Exception as e:
		return jsonify({
			"status": "error",
			"message": f"Error connecting to Hugging Face API: {str(e)}",
			"setup_instructions": "Could not connect to the Hugging Face API. Please check your internet connection and try again."
		})


@app.route('/generate-ai-image', methods=['POST'])
def generate_ai_image():
	"""Generate AI images using Hugging Face models based on text prompts"""
	global style, prompt
	try:
		# Parse request data
		data = request.json
		prompt = data.get('prompt', '')
		model = data.get('model', 'stabilityai/stable-diffusion-xl-base-1.0')
		size = data.get('size', 'medium')
		style = data.get('style', 'realistic')

		if not prompt:
			return jsonify({"error": "No prompt provided"}), 400

		# Get an API key from the environment variable
		api_key = os.environ.get('HUGGINGFACE_API_KEY', '')

		# Debug information
		print(f"Generating image with style: {style}, model: {model}")
		print(f"Prompt: {prompt}")
		print(f"API Key configured: {'Yes' if api_key else 'None'}")

		# If no API key is provided, use placeholder images
		if not api_key:
			print("No Hugging Face API key found. Using placeholder images.")
			return generate_placeholder_image(prompt, style)

		# Set dimensions based on a size parameter
		width = height = 512  # Default to small
		if size == 'medium':
			width = height = 768
		elif size == 'large':
			width = height = 1024

		# Adjust prompt based on style
		adjusted_prompt = prompt
		if style == 'cartoon':
			adjusted_prompt = f"mdjrny-v4 style {prompt}, cartoon, vibrant colors, high detail"
		elif style == 'artistic':
			adjusted_prompt = f"{prompt}, artistic style, detailed, vibrant, high quality"
		elif style == 'realistic':
			adjusted_prompt = f"{prompt}, realistic, detailed photograph, 4k, high resolution"

		# API URL for the selected model
		api_url = f"https://api-inference.huggingface.co/models/{model}"

		# Configure headers with an API key
		headers = {
			"Authorization": f"Bearer {api_key}"
		}

		# Configure payload based on model type
		if model.startswith('stabilityai/'):
			# SDXL format
			payload = {
				"inputs": adjusted_prompt,
				"parameters": {
					"width": width,
					"height": height,
					"num_inference_steps": 30,
					"guidance_scale": 7.5
				}
			}
		else:
			# Standard SD format for other models
			payload = {
				"inputs": adjusted_prompt,
				"parameters": {
					"width": width,
					"height": height,
					"num_inference_steps": 30,
					"guidance_scale": 7.5,
					"negative_prompt": "blurry, bad quality, distorted, deformed, ugly, bad anatomy"
				}
			}

		print(f"Sending request to: {api_url}")
		print(f"Payload: {payload}")

		# Make API request with timeout
		try:
			response = requests.post(
				api_url,
				headers=headers,
				json=payload,
				timeout=60  # Timeout after 60 seconds
			)

			print(f"Response status: {response.status_code}")
			print(f"Response content type: {response.headers.get('Content-Type', 'unknown')}")

			# Check if the response is successful
			if response.status_code == 200:
				# If the response is an image
				if 'image' in response.headers.get('Content-Type', ''):
					# Save the generated image
					unique_id = str(uuid.uuid4())
					output_dir = GENERATED_FOLDER

					file_path = os.path.join(output_dir, f"{unique_id}.jpg")
					with open(file_path, 'wb') as f:
						f.write(response.content)

					# Return the URL to the saved image
					image_url = f"/static/generated/{unique_id}.jpg"
					print(f"Image successfully generated and saved to {file_path}")
					return jsonify({"image_url": image_url})

				# If the response is JSON
				else:
					try:
						json_response = response.json()
						print(f"JSON response: {json_response}")

						# Check if the response contains an error
						if 'error' in json_response:
							error_msg = json_response.get('error')
							print(f"API returned error: {error_msg}")
							# Fall back to placeholder if there's an error
							return generate_placeholder_image(prompt, style, error_note=f"API Error: {error_msg}")

						# Handle case where API returns image URL instead of binary data
						if 'url' in json_response:
							print(f"API returned URL: {json_response['url']}")
							return jsonify({"image_url": json_response['url']})

						# If we don't understand the response, use placeholder
						print("Unknown JSON response format")
						return generate_placeholder_image(
							prompt,
							style
						)
					except Exception as json_err:
						print(f"Error parsing JSON response: {str(json_err)}")
						# Fall back to placeholder
						return generate_placeholder_image(
							prompt,
							style
						)
			else:
				# Handle non-200 responses
				error_message = response.text
				try:
					error_json = response.json()
					error_message = error_json.get('error', error_message)
				except:
					pass

				print(f"API error {response.status_code}: {error_message}")

				# If the model is loading, communicate this to the user
				if "loading" in error_message.lower() or "currently loading" in error_message.lower():
					return jsonify({
						"error": "Model is still loading, please try again in a few moments",
						"retry": True
					})

				# Fall back to placeholder for any other errors
				return generate_placeholder_image(
					prompt,
					style
				)

		except requests.exceptions.Timeout:
			print("Request to Hugging Face API timed out")
			return generate_placeholder_image(
				prompt,
				style
			)

		except requests.exceptions.RequestException as req_err:
			print(f"Request exception: {str(req_err)}")
			return generate_placeholder_image(
				prompt,
				style
			)

	except Exception as e:
		print(f"Exception in AI image generation: {str(e)}")
		print(traceback.format_exc())
		# Fall back to placeholder for any errors
		return generate_placeholder_image(
			prompt if 'prompt' in locals() else "error",
			style if 'style' in locals() else "realistic"
		)


def generate_placeholder_image(title, subtitle, note="", width=800, height=600, error_note=None):
	"""
    Create a placeholder image with text
    Used when we can't use the actual API
    """
	# Create a blank image with a gradient background
	image = Image.new('RGB', (width, height), color=(245, 245, 245))
	draw = ImageDraw.Draw(image)

	# Create a gradient background
	for y in range(height):
		color = (
			int(245 - y * 0.2),
			int(245 - y * 0.1),
			int(245)
		)
		draw.line([(0, y), (width, y)], fill=color)

	# Try to find system fonts that should be available on most systems
	try:
		# Try to load a standard font (should be available on most systems)
		title_font = ImageFont.truetype("arial.ttf", 36)
		subtitle_font = ImageFont.truetype("arial.ttf", 24)
		note_font = ImageFont.truetype("arial.ttf", 18)
	except IOError:
		# Fallback to default font if custom font not available
		title_font = ImageFont.load_default()
		subtitle_font = ImageFont.load_default()
		note_font = ImageFont.load_default()

	# Add decorative elements
	# Draw frame border
	draw.rectangle([(20, 20), (width - 20, height - 20)], outline=(70, 130, 180), width=2)

	# Draw circles in corners for visual interest
	for pos in [(50, 50), (width - 50, 50), (50, height - 50), (width - 50, height - 50)]:
		draw.ellipse((pos[0] - 20, pos[1] - 20, pos[0] + 20, pos[1] + 20), fill=(70, 130, 180, 128))

	# Calculate text positions
	title_width = draw.textlength(title, font=title_font)
	title_position = ((width - title_width) // 2, height // 3)

	subtitle_width = draw.textlength(subtitle, font=subtitle_font)
	subtitle_position = ((width - subtitle_width) // 2, height // 2)

	note_width = draw.textlength(note, font=note_font)
	note_position = ((width - note_width) // 2, height * 3 // 4)

	# Add text to the image
	draw.text(title_position, title, fill=(50, 50, 50), font=title_font, anchor="mm")
	draw.text(subtitle_position, subtitle, fill=(100, 100, 100), font=subtitle_font, anchor="mm")
	draw.text(note_position, note, fill=(150, 150, 150), font=note_font, anchor="mm")

	# Add PhotoGenic watermark
	watermark = "PhotoGenic AI"
	watermark_font = subtitle_font
	watermark_width = draw.textlength(watermark, font=watermark_font)
	draw.text(
		(width - watermark_width - 30, height - 50),
		watermark,
		fill=(70, 130, 180, 200),
		font=watermark_font
	)

	# Save the image to a temporary file with a unique name
	unique_id = str(uuid.uuid4())
	output_dir = GENERATED_FOLDER

	file_path = os.path.join(output_dir, f"{unique_id}.jpg")

	# Ensure the output directory exists
	os.makedirs(output_dir, exist_ok=True)

	# Save the image
	image.save(file_path, 'JPEG', quality=90)

	# Return the URL to the saved image in a Flask-compatible response
	image_url = f"/static/generated/{unique_id}.jpg"

	response_data = {
		"image_url": image_url,
		"placeholder": True
	}

	# Add note to response if provided
	if note or error_note:
		response_data["note"] = error_note if error_note else f"Using placeholder for: {note}"

	return jsonify(response_data)


@app.route('/ai-animation')
def ai_animation():
	return render_template('ai_animation.html')


import logging


# Animation Generation with Multiple Providers
@app.route('/generate-animation', methods=['POST'])
def generate_animation():
	global provider, temperature
	try:
		# --- Pro User Detection (simple example, replace it with real logic) ---
		pro_user = True  # Set everyone as Pro by default for a better experience

		# Get prompt and provider from a request
		if request.method == 'POST':
			if request.content_type and 'multipart/form-data' in request.content_type:
				prompt = request.form.get('prompt', '')
				provider = request.form.get('provider', 'picsart')
				temperature = float(request.form.get('temperature', 0.7))
			else:
				data = request.get_json()
				prompt = data.get('prompt', '')
				provider = data.get('provider', 'picsart')
				temperature = float(data.get('temperature', 0.7))

		if not prompt:
			return jsonify({'error': 'No prompt provided'}), 400

		# --- Story Generation ---
		story = None
		try:
			from openai.types.chat import ChatCompletionSystemMessageParam, ChatCompletionUserMessageParam
			clients = OpenAI()
			chat_completion = clients.chat.completions.create(
				model="gpt-3.5-turbo",
				messages=[
					ChatCompletionSystemMessageParam(role="system",
					                                 content="You are a creative storyteller that writes vivid, emotional, and engaging short stories."),
					ChatCompletionUserMessageParam(role="user",
					                               content=f"Write a vivid, creative, emotional, and detailed short story based on this input. Keep it under 300 words.\n\nInput: {prompt}\n\nStory:")
				],
				max_tokens=600,
				temperature=temperature
			)
			story = chat_completion.choices[0].message.content.strip()
		except Exception as e:
			story = "(Sorry, the AI story could not be generated at this time.)"

		# --- Animation Generation ---
		animation_id = f"{int(time.time())}_{random.randint(1000, 9999)}"
		output_folder = os.path.join(app.config['UPLOAD_FOLDER'], 'animations', animation_id)
		os.makedirs(output_folder, exist_ok=True)

		# Get an API key from the environment - users don't need to provide it
		api_key = None
		if provider == 'picsart':
			api_key = os.environ.get('PICSART_API_KEY', '')
		elif provider == 'runway':
			api_key = os.environ.get('RUNWAY_API_KEY', '')
		elif provider == 'did':
			api_key = os.environ.get('DID_API_KEY', '')
		elif provider == 'replicate':
			# Try both environment variable names for compatibility
			api_key = os.environ.get('REPLICATE_API_TOKEN', '') or os.environ.get('REPLICATE_API_KEY', '')
			logging.info(f"Using Replicate with API key (first 4 chars): {api_key[:4] if api_key else 'None'}")

		# For demo/testing - use placeholder generation if no API key is available
		if not api_key:
			logging.warning(f"No API key found for provider: {provider}")
			animation_path = generate_placeholder_animation(prompt, provider, animation_id, output_folder)
			return jsonify({
				'success': True,
				'animation_id': animation_id,
				'animation_path': animation_path,
				'provider': provider,
				'story': story,
				'note': 'Generated with placeholder animation',
				'is_video': False,
				'image_url': animation_path
			})

		# With API key - try real service, fall back to placeholder
		try:
			animation_path = None
			is_video = False

			if provider == 'picsart':
				animation_path = generate_with_picsart(prompt, api_key, animation_id, output_folder)
			elif provider == 'runway':
				animation_path = generate_with_runway(prompt, api_key, animation_id, output_folder)
			elif provider == 'did':
				animation_path = generate_with_did(prompt, api_key, animation_id, output_folder)
			elif provider == 'replicate':
				animation_path = generate_with_replicate(prompt, api_key, animation_id, output_folder)
				is_video = True  # Mark as video for Replicate responses
			else:
				animation_path = generate_placeholder_animation(prompt, provider, animation_id, output_folder)

			response_data = {
				'success': True,
				'animation_id': animation_id,
				'provider': provider,
				'story': story
			}

			if is_video:
				response_data['video_url'] = animation_path
				response_data['is_video'] = True
			else:
				response_data['image_url'] = animation_path
				response_data['is_video'] = False

			return jsonify(response_data)
		except Exception as e:
			logging.error(f"Animation generation error: {str(e)}")
			animation_path = generate_placeholder_animation(prompt, provider, animation_id, output_folder)
			return jsonify({
				'success': True,
				'animation_id': animation_id,
				'animation_path': animation_path,
				'image_url': animation_path,
				'is_video': False,
				'provider': provider,
				'story': story,
				'note': f'Used placeholder due to API error: {str(e)}'
			})
	except Exception as e:
		logging.error(f"Animation generation error: {str(e)}")
		return jsonify({'error': str(e)}), 500


def generate_with_picsart(prompt, api_key, animation_id, output_folder):
	"""
    Generate animation using Picsart API

    In a production environment, this would call the actual Picsart API
    For this demo, we'll simulate the API call and create a placeholder
    """
	logging.info(f"Generating animation with Picsart: {prompt}")

	try:
		# Placeholder logic - in a real implementation, this would call the Picsart API
		# For this demo, we'll just create a placeholder image/animation

		# Generate a placeholder image for demonstration
		animation_path = generate_placeholder_animation(prompt, 'picsart', animation_id, output_folder)

		return animation_path
	except Exception as e:
		logging.error(f"Error in generate_with_picsart: {str(e)}")
		raise


def generate_with_runway(prompts, api_key, animation_id, output_folder):
	"""
    Generate animation using RunwayML API

    In a production environment, this would call the actual RunwayML API
    For this demo, we'll simulate the API call and create a placeholder
    """
	logging.info(f"Generating animation with RunwayML: {prompts}")

	try:
		# Placeholder logic - in a real implementation, this would call the RunwayML API
		# For this demo, we'll just create a placeholder image/animation

		# Generate a placeholder image for demonstration
		animation_path = generate_placeholder_animation(prompts, 'runway', animation_id, output_folder)

		return animation_path
	except Exception as e:
		logging.error(f"Error in generate_with_runway: {str(e)}")
		raise


def generate_with_did(prompts, api_key, animation_id, output_folder):
	"""
    Generate animation using D-ID API

    In a production environment, this would call the actual D-ID API
    For this demo, we'll simulate the API call and create a placeholder
    """
	logging.info(f"Generating animation with D-ID: {prompts}")

	try:
		# Placeholder logic - in a real implementation, this would call the D-ID API
		# For this demo, we'll just create a placeholder image/animation

		# Generate a placeholder image for demonstration
		animation_path = generate_placeholder_animation(prompts, 'did', animation_id, output_folder)

		return animation_path
	except Exception as e:
		logging.error(f"Error in generate_with_did: {str(e)}")
		raise


def generate_with_replicate(prompts, api_key, animation_id, output_folder):
	"""
    Generate animation using Replicate API

    Uses the Replicate API to generate text-to-video animations
    """
	logging.info(f"Generating animation with Replicate: {prompts}")

	try:
		import replicate
		import requests
		from urllib.parse import urlparse
		import os
		import time

		# Set the API token - Replicate library explicitly looks for REPLICATE_API_TOKEN
		os.environ["REPLICATE_API_TOKEN"] = api_key
		logging.info(f"Set Replicate API token - first 4 chars: {api_key[:4]}...")

		# Select a text-to-video model on Replicate
		# Log the start of the generation process
		logging.info(f"Starting Replicate animation generation with prompt: {prompts}")

		# Using Stable Video Diffusion model which is good for text-to-video generation
		output = replicate.run(
			"stability-ai/stable-video-diffusion:3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438",
			input={
				"prompt": prompts,
				"fps": 8,
				"motion_bucket_id": 40,
				"cond_aug": 0.02,
				"decoding_t": 8,  # More frames for smoother animation
				"width": 576,
				"height": 320,
				"sizing_strategy": "maintain_aspect_ratio",
				"frames": 25,  # Increased frame count
				"num_inference_steps": 30,
				"guidance_scale": 7.5,
				"negative_prompt": "blurry, low quality, distorted, disfigured, ugly, bad anatomy"
			}
		)

		# The output from this model is a URL to the generated video
		if output:
			video_url = output
			logging.info(f"Generated animation URL: {video_url}")

			# Download the video file
			logging.info(f"Downloading video from: {video_url}")
			response = requests.get(video_url, stream=True)
			if response.status_code == 200:
				# Parse video filename from URL
				parsed_url = urlparse(video_url)
				video_filename = f"{animation_id}.mp4"
				video_path = os.path.join(output_folder, video_filename)

				# Save the video file
				with open(video_path, 'wb') as f:
					for chunk in response.iter_content(chunk_size=8192):
						f.write(chunk)

				# Get a relative path for the frontend
				rel_path = video_path.replace(os.getcwd(), '')
				if rel_path.startswith('\\') or rel_path.startswith('/'):
					rel_path = rel_path[1:]

				# Replace backslashes with forward slashes for URLs
				rel_path = rel_path.replace('\\', '/')

				logging.info(f"Generated animation saved: {rel_path}")
				return "/" + rel_path
			else:
				logging.error(f"Failed to download video: Status code {response.status_code}")
				raise Exception(f"Failed to download video: Status code {response.status_code}")
		else:
			logging.error("Replicate API returned empty output")
			raise Exception("Replicate API returned empty output")
	except Exception as e:
		logging.error(f"Error in generate_with_replicate: {str(e)}")
		raise


def generate_placeholder_animation(prompts, providers, animation_id, output_folder):
	"""
    Generate a placeholder animation (for demo purposes)
    In a production environment, this would be replaced with actual API calls
    """
	try:
		# Create a placeholder image with the prompt text
		frame = generate_animation_placeholder_image(
			title=f"AI Generated Animation with {providers.upper()}",
			subtitle=prompts,
			note=f"Placeholder animation (API integration pending)",
			providers=providers
		)

		# Save the frame as an image
		animation_file = os.path.join(output_folder, f"{animation_id}.png")
		frame.save(animation_file)

		# Get a relative path for the frontend
		rel_path = animation_file.replace(os.getcwd(), '')
		if rel_path.startswith('\\') or rel_path.startswith('/'):
			rel_path = rel_path[1:]

		# Replace backslashes with forward slashes for URLs
		rel_path = rel_path.replace('\\', '/')

		logging.info(f"Generated placeholder animation: {rel_path}")
		return "/" + rel_path
	except Exception as e:
		logging.error(f"Error in generate_placeholder_animation: {str(e)}")
		raise


def generate_animation_placeholder_image(title, subtitle, note="", providers="picsart", width=800, height=600):
	"""
    Generate a placeholder image with text
    """
	try:
		# Create an image with a gradient background
		from PIL import Image, ImageDraw, ImageFont, ImageFilter
		import numpy as np

		# Create a gradient background based on the provider
		gradient = np.zeros((height, width, 3), dtype=np.uint8)

		# Different gradient colors based on the provider
		if providers == 'picsart':
			# Blue-purple gradient
			for y in range(height):
				for x in range(width):
					r = int(25 + (x / width) * 20)
					g = int(25 + (y / height) * 20)
					b = int(40 + (x / width) * 40 + (y / height) * 40)
					gradient[y, x] = [r, g, b]
		elif providers == 'runway':
			# Green-teal gradient
			for y in range(height):
				for x in range(width):
					r = int(10 + (y / height) * 30)
					g = int(40 + (x / width) * 40)
					b = int(50 + (y / height) * 20)
					gradient[y, x] = [r, g, b]
		elif providers == 'did':
			# Orange-red gradient
			for y in range(height):
				for x in range(width):
					r = int(50 + (x / width) * 40)
					g = int(20 + (y / height) * 30)
					b = int(30 + (x / width) * 20)
					gradient[y, x] = [r, g, b]
		elif providers == 'replicate':
			# Purple-pink gradient
			for y in range(height):
				for x in range(width):
					r = int(40 + (y / height) * 40)
					g = int(10 + (x / width) * 25)
					b = int(50 + (y / height) * 40)
					gradient[y, x] = [r, g, b]
		else:
			# Default gradient
			for y in range(height):
				for x in range(width):
					r = int(30 + (x / width) * 30)
					g = int(30 + (y / height) * 30)
					b = int(40 + (x / width) * 40)
					gradient[y, x] = [r, g, b]

		# Convert to PIL Image
		image = Image.fromarray(gradient)

		# Apply blur
		image = image.filter(ImageFilter.GaussianBlur(radius=10))

		# Create a drawing context
		draw = ImageDraw.Draw(image)

		# Try to load fonts, use default if not available
		try:
			title_font = ImageFont.truetype("arial.ttf", 48)
			subtitle_font = ImageFont.truetype("arial.ttf", 32)
			note_font = ImageFont.truetype("arial.ttf", 20)
		except IOError:
			title_font = ImageFont.load_default()
			subtitle_font = ImageFont.load_default()
			note_font = ImageFont.load_default()

		# Draw title
		title_color = (240, 240, 255)
		title_position = (width // 2, height // 3)
		draw.text(title_position, title, fill=title_color, font=title_font, anchor="mm")

		# Draw subtitle
		subtitle_color = (200, 200, 240)
		subtitle_position = (width // 2, height // 2)

		# Split long prompts into multiple lines
		if len(subtitle) > 50:
			words = subtitle.split()
			lines = []
			current_line = []

			for word in words:
				if len(' '.join(current_line + [word])) <= 50:
					current_line.append(word)
				else:
					lines.append(' '.join(current_line))
					current_line = [word]

			if current_line:
				lines.append(' '.join(current_line))

			try:
				line_height = subtitle_font.getsize("A")[1] + 10
			except:
				# For PIL versions that don't have getsize
				line_height = 40

			start_y = subtitle_position[1] - ((len(lines) - 1) * line_height) // 2

			for i, line in enumerate(lines):
				line_position = (width // 2, start_y + i * line_height)
				draw.text(line_position, line, fill=subtitle_color, font=subtitle_font, anchor="mm")
		else:
			draw.text(subtitle_position, subtitle, fill=subtitle_color, font=subtitle_font, anchor="mm")

		# Draw note
		if note:
			note_color = (180, 180, 220)
			note_position = (width // 2, height * 3 // 4)
			draw.text(note_position, note, fill=note_color, font=note_font, anchor="mm")

		# Draw a pulsing circle to simulate animation
		circle_center = (width // 2, height // 2 + 100)
		circle_radius = 50

		# Different circle colors based on the provider
		if providers == 'pics art':
			circle_color_base = (100, 100, 255)  # Blue
		elif providers == 'runway':
			circle_color_base = (100, 255, 180)  # Green
		elif providers == 'did':
			circle_color_base = (255, 140, 100)  # Orange
		elif providers == 'replicate':
			circle_color_base = (200, 100, 255)  # Purple
		else:
			circle_color_base = (180, 180, 255)  # Default

		for i in range(5):
			circle_color = (*circle_color_base, 50 - i * 10)
			draw.ellipse(
				(
					circle_center[0] - circle_radius - i * 10,
					circle_center[1] - circle_radius - i * 10,
					circle_center[0] + circle_radius + i * 10,
					circle_center[1] + circle_radius + i * 10
				),
				outline=circle_color
			)

		return image
	except Exception as e:
		logging.error(f"Error in generate_animation_placeholder_image: {str(e)}")
		# Return a very basic image in case of error
		img = Image.new('RGB', (width, height), color=(30, 30, 50))
		draw = ImageDraw.Draw(img)
		try:
			draw.text((width // 2, height // 2), f"Error: {str(e)}", fill=(255, 255, 255), anchor="mm")
		except:
			# For PIL versions that don't support anchor
			draw.text((width // 2, height // 2), f"Error: {str(e)}", fill=(255, 255, 255))
		return img


@app.route('/uploads/animations/<path:filename>')
def serve_animation(filename):
	"""Serve animation files"""
	return send_from_directory(os.path.join(app.config['UPLOAD_FOLDER'], 'animations'), filename)


# Route to serve generated animations
@app.route('/generated/animations/<filename>')
def generated_animation(filename):
	animation_folder = os.path.join(GENERATED_FOLDER, 'animations')
	return send_from_directory(animation_folder, filename)


# Route to serve generated static files (frames, images, etc.)
@app.route('/static/generated/<path:filename>')
def generated_files(filename):
	return send_from_directory(GENERATED_FOLDER, filename)


# AI Image Generation page
@app.route('/ai-image-generation')
def ai_image_generation_page():
	"""
    Render the AI image generation page
    """
	return render_template('ai_image_generation.html')


# Collections page
@app.route('/collections')
@login_required
def collections_page():
	# Pass the fixed CSS and JS files to the template
	return render_template('collections.html', user=current_user, use_fixed_collections=True)


@app.route('/api/collections', methods=['GET'])
@login_required
def get_collections():
	try:
		path = request.args.get('path', '')
		user_id = current_user.id

		# Validate and sanitize path to prevent directory traversal
		if not is_safe_path(path):
			app.logger.warning(f"Invalid path attempt: User {user_id} tried to access unsafe path '{path}'")
			return jsonify({'error': 'Invalid path'}), 400

		# Check if path is within user's directory
		if not verify_collection_ownership(path, user_id):
			app.logger.warning(
				f"Access denied: User {user_id} attempted to access path '{path}' outside their directory")
			return jsonify({'error': 'Access denied: path is outside of user directory'}), 403

		# Create user's collections directory if it doesn't exist
		user_collections_dir = get_user_collections_dir(user_id)

		# Create absolute path to the user's specific directory
		abs_path = os.path.join(user_collections_dir, path)

		# Check if path exists
		if not os.path.exists(abs_path):
			# If the path doesn't exist but it's the root, create it
			if not path:
				os.makedirs(abs_path, exist_ok=True)
			else:
				return jsonify({'error': 'Path does not exist'}), 404

		# Get items in directory
		items = []

		# Special case for "recent" virtual folder
		if path == 'recent':
			# Get recent collections from database
			recent_files = Collection.query.filter_by(
				owner_id=user_id,
				is_folder=False
			).order_by(Collection.modified_at.desc()).limit(20).all()

			for item in recent_files:
				items.append(item.to_dict())

		# Special case for "favorites" virtual folder
		elif path == 'favorites':
			# Get favorited files
			favorites = UserFavorites.query.filter_by(user_id=user_id).all()
			for favorite in favorites:
				try:
					# Get the file info
					file_info = get_file_info(favorite.file_path)
					items.append(file_info)
				except Exception as e:
					app.logger.error(f"Error processing favorite file {favorite.file_path}: {str(e)}")

		# Special case for "shared" virtual folder
		elif path == 'shared':
			# Get files shared with this user
			shared_files = SharedFile.query.filter_by(shared_with_id=user_id).all()

			app.logger.info(f"Found {len(shared_files)} shared files for user {user_id}")

			for shared in shared_files:
				try:
					# Get the owner's username
					owner = User.query.get(shared.owner_id)
					if not owner:
						app.logger.warning(
							f"Owner not found for shared file: {shared.path}, owner_id: {shared.owner_id}")
						continue

					# For files, check if they exist in the owner's directory
					owner_path = os.path.join(get_user_collections_dir(shared.owner_id), shared.path.lstrip('/'))

					if not os.path.exists(owner_path):
						app.logger.warning(f"Shared file not found: {owner_path}")
						continue

					# Check if there's a collection entry
					collection = Collection.query.filter_by(path=shared.path, owner_id=shared.owner_id).first()

					if collection:
						# Use the collection entry
						item_dict = collection.to_dict()
					else:
						# Create a dictionary with file information
						is_dir = os.path.isdir(owner_path)
						filename = os.path.basename(shared.path)

						item_dict = {
							'name': filename,
							'path': shared.path,
							'type': 'folder' if is_dir else 'file',
							'isDir': is_dir,
							'modifiedTime': datetime.fromtimestamp(os.path.getmtime(owner_path)).isoformat()
						}

						# Add size for files
						if not is_dir:
							item_dict['size'] = os.path.getsize(owner_path)

							# Mark as image if it's an image file
							if is_image_file(filename):
								item_dict['isImage'] = True

					# Add owner information
					item_dict['shared_by'] = owner.username
					items.append(item_dict)

				except Exception as e:
					app.logger.error(f"Error processing shared file {shared.path}: {str(e)}")

		# Special case for "trash" virtual folder
		elif path == 'trash':
			# Get files in trash
			trash_items = UserTrash.query.filter_by(user_id=user_id).all()
			for trash in trash_items:
				try:
					# Get the file info
					file_info = get_file_info(trash.file_path)
					items.append(file_info)
				except Exception as e:
					app.logger.error(f"Error processing trash file {trash.file_path}: {str(e)}")

		# Special case for "permitted" virtual folder
		elif path == 'permitted':
			# Get files shared with the user
			shared_files = SharedFile.query.filter_by(shared_with_id=user_id).all()

			app.logger.info(f"Found {len(shared_files)} shared files for user {user_id}")

			for shared in shared_files:
				try:
					# Get the owner's username
					owner = User.query.get(shared.owner_id)
					if not owner:
						app.logger.warning(
							f"Owner not found for shared file: {shared.path}, owner_id: {shared.owner_id}")
						continue

					# For files, check if they exist in the owner's directory
					owner_path = os.path.join(get_user_collections_dir(shared.owner_id), shared.path.lstrip('/'))

					if not os.path.exists(owner_path):
						app.logger.warning(f"Shared file not found: {owner_path}")
						continue

					# Check if there's a collection entry
					collection = Collection.query.filter_by(path=shared.path, owner_id=shared.owner_id).first()

					if collection:
						# Use the collection entry
						item_dict = collection.to_dict()
					else:
						# Create a dictionary with file information
						is_dir = os.path.isdir(owner_path)
						filename = os.path.basename(shared.path)

						item_dict = {
							'name': filename,
							'path': shared.path,
							'type': 'folder' if is_dir else 'file',
							'isDir': is_dir,
							'modifiedTime': datetime.fromtimestamp(os.path.getmtime(owner_path)).isoformat()
						}

						# Add size for files
						if not is_dir:
							item_dict['size'] = os.path.getsize(owner_path)

							# Mark as image if it's an image file
							if is_image_file(filename):
								item_dict['isImage'] = True

					# Add owner information
					item_dict['shared_by'] = owner.username
					items.append(item_dict)

				except Exception as e:
					app.logger.error(f"Error processing shared file {shared.path}: {str(e)}")

		# Normal directory listing
		else:
			try:
				for item_name in os.listdir(abs_path):
					item_path = os.path.join(abs_path, item_name)
					rel_path = os.path.join(path, item_name) if path else item_name

					# Create item object
					item = {
						'name': item_name,
						'path': rel_path,
						'type': 'folder' if os.path.isdir(item_path) else 'file',
						'isDir': os.path.isdir(item_path),
						'modifiedTime': datetime.fromtimestamp(os.path.getmtime(item_path)).isoformat()
					}

					# Add size for files
					if os.path.isfile(item_path):
						item['size'] = os.path.getsize(item_path)

						# Mark as image if it's an image file
						if is_image_file(item_name):
							item['isImage'] = True

					items.append(item)

				# Sort items (folders first, then alphabetically)
				items.sort(key=lambda x: (0 if x.get('isDir', x.get('type') == 'folder') else 1, x['name'].lower()))
			except PermissionError:
				return jsonify({'error': 'Permission denied'}), 403
			except Exception as e:
				app.logger.error(f"Error listing collections: {str(e)}")
				return jsonify({'error': 'Failed to list items'}), 500

		return jsonify({
			'collections': items,
			'path': path,
			'parent': os.path.dirname(path) if path else None
		})
	except Exception as e:
		app.logger.error(f"Unexpected error in get_collections: {str(e)}")
		return jsonify({'error': 'An unexpected error occurred'}), 500


@app.route('/api/collections/folder', methods=['POST'])
@login_required
def create_folder():
	try:
		# Validate request data
		if not request.is_json:
			return jsonify({'error': 'Invalid request format, JSON required'}), 400

		data = request.json
		path = data.get('path', '')
		name = data.get('name', '')
		user_id = current_user.id

		# Validate inputs
		if not name:
			return jsonify({'error': 'Folder name is required'}), 400

		if not is_valid_filename(name):
			return jsonify({'error': 'Invalid folder name'}), 400

		if not is_safe_path(path):
			app.logger.warning(f"Invalid path attempt: User {user_id} tried to access unsafe path '{path}'")
			return jsonify({'error': 'Invalid path'}), 400

		# Check if path is within user's directory
		if not verify_collection_ownership(path, user_id):
			app.logger.warning(
				f"Access denied: User {user_id} attempted to access path '{path}' outside their directory")
			return jsonify({'error': 'Access denied: path is outside of user directory'}), 403

		# Create user's collections directory if it doesn't exist
		user_collections_dir = get_user_collections_dir(user_id)

		# Create absolute path
		parent_path = os.path.join(user_collections_dir, path)
		new_folder_path = os.path.join(parent_path, name)

		# Check if parent directory exists
		if not os.path.exists(parent_path):
			return jsonify({'error': 'Parent directory does not exist'}), 404

		# Check if folder already exists
		if os.path.exists(new_folder_path):
			return jsonify({'error': 'Folder already exists'}), 409

		# Create folder
		try:
			os.makedirs(new_folder_path, exist_ok=True)

			# Add to database
			folder_rel_path = os.path.join(path, name) if path else name
			new_folder = Collection(
				path=folder_rel_path,
				name=name,
				is_folder=True,
				owner_id=user_id
			)
			db.session.add(new_folder)
			db.session.commit()

			return jsonify({
				'success': True,
				'path': folder_rel_path
			})
		except PermissionError:
			return jsonify({'error': 'Permission denied'}), 403
		except Exception as e:
			app.logger.error(f"Error creating folder: {str(e)}")
			return jsonify({'error': 'Failed to create folder'}), 500
	except Exception as e:
		app.logger.error(f"Unexpected error in create_folder: {str(e)}")
		return jsonify({'error': 'An unexpected error occurred'}), 500


@app.route('/api/collections/upload', methods=['POST'])
@login_required
def upload_to_collection():
	try:
		path = request.form.get('path', '')
		user_id = current_user.id

		# Validate path
		if not is_safe_path(path):
			app.logger.warning(f"Invalid path attempt: User {user_id} tried to access unsafe path '{path}'")
			return jsonify({'error': 'Invalid path'}), 400

		# Check if path is within user's directory
		if not verify_collection_ownership(path, user_id):
			app.logger.warning(
				f"Access denied: User {user_id} attempted to access path '{path}' outside their directory")
			return jsonify({'error': 'Access denied: path is outside of user directory'}), 403

		# Check if files are provided
		if 'files[]' not in request.files and 'files' not in request.files:
			return jsonify({'error': 'No files provided'}), 400

		# Get files
		files = request.files.getlist('files[]') if 'files[]' in request.files else request.files.getlist('files')

		if len(files) == 0:
			return jsonify({'error': 'No files provided'}), 400

		# Create user's collections directory if it doesn't exist
		user_collections_dir = get_user_collections_dir(user_id)

		# Create absolute path
		upload_path = os.path.join(user_collections_dir, path)

		# Check if directory exists
		if not os.path.exists(upload_path):
			os.makedirs(upload_path, exist_ok=True)

		# Upload files
		uploaded_files = []
		failed_files = []

		for file in files:
			if file and file.filename:
				filename = secure_filename(file.filename)

				# Check if filename is valid
				if not filename or not is_valid_filename(filename):
					failed_files.append({
						'name': file.filename,
						'error': 'Invalid filename'
					})
					continue

				try:
					# Save file
					file_path = os.path.join(upload_path, filename)
					file.save(file_path)

					# Get file size
					file_size = os.path.getsize(file_path)

					# Process image if it's an image file
					is_image = is_image_file(filename)
					if is_image:
						create_thumbnail(file_path)

					# Add to database
					file_rel_path = os.path.join(path, filename) if path else filename
					new_file = Collection(
						path=file_rel_path,
						name=filename,
						is_folder=False,
						size=file_size,
						mime_type=file.content_type if hasattr(file, 'content_type') else None,
						owner_id=user_id
					)
					db.session.add(new_file)

					# Add to uploaded files
					uploaded_files.append({
						'name': filename,
						'path': file_rel_path,
						'size': file_size,
						'isImage': is_image
					})
				except Exception as e:
					app.logger.error(f"Error uploading file {filename}: {str(e)}")
					failed_files.append({
						'name': file.filename,
						'error': str(e)
					})

		# Commit all database changes
		db.session.commit()

		result = {
			'success': len(uploaded_files) > 0,
			'uploaded': uploaded_files,
			'failed': failed_files
		}

		if len(failed_files) > 0 and len(uploaded_files) == 0:
			return jsonify(result), 500

		return jsonify(result)
	except Exception as e:
		app.logger.error(f"Unexpected error in upload_to_collection: {str(e)}")
		return jsonify({'error': 'An unexpected error occurred'}), 500


@app.route('/api/collections/file/<path:path>', methods=['GET'])
@login_required
def get_collection_file(path):
	if not current_user.is_authenticated:
		return jsonify({'error': 'Authentication required'}), 401

	user_id = current_user.id

	# Check if this is a shared file
	if 'owner_id' in request.args:
		try:
			owner_id = int(request.args.get('owner_id'))

			# Check if this file is shared with the current user
			shared = SharedFile.query.filter_by(
				path=path,
				owner_id=owner_id,
				shared_with_id=user_id
			).first()

			if not shared:
				app.logger.warning(
					f"Access denied: User {user_id} attempted to access shared file '{path}' not shared with them")
				return jsonify({'error': 'Access denied: file not shared with you'}), 403
		except:
			owner_id = user_id
	else:
		owner_id = user_id

	# Create absolute path using the owner's directory
	file_path = os.path.join(get_user_collections_dir(owner_id), path)

	# Security check: verify the requested path is within this user's collections directory
	if not os.path.normpath(file_path).startswith(os.path.normpath(get_user_collections_dir(owner_id))):
		app.logger.warning(f"Access denied: User {user_id} attempted to access path '{path}' outside their directory")
		return jsonify({'error': 'Access denied: path is outside of user directory'}), 403

	# Check if file exists
	if not os.path.exists(file_path) or not os.path.isfile(file_path):
		return jsonify({'error': 'File not found'}), 404

	# Set the correct mime type for the file
	mime_type, _ = mimetypes.guess_type(file_path)

	return send_file(file_path, mimetype=mime_type)


@app.route('/api/collections/thumbnail/<path:path>', methods=['GET'])
@login_required
def get_collection_thumbnail(path):
	if not current_user.is_authenticated:
		return jsonify({'error': 'Authentication required'}), 401

	user_id = current_user.id

	# Check if this is a shared file
	if 'owner_id' in request.args:
		try:
			owner_id = int(request.args.get('owner_id'))

			# Check if this file is shared with the current user
			shared = SharedFile.query.filter_by(
				path=path,
				owner_id=owner_id,
				shared_with_id=user_id
			).first()

			if not shared:
				app.logger.warning(
					f"Access denied: User {user_id} attempted to access shared file '{path}' not shared with them")
				return jsonify({'error': 'Access denied: file not shared with you'}), 403
		except:
			owner_id = user_id
	else:
		owner_id = user_id

	# Create absolute path using the owner's directory
	file_path = os.path.join(get_user_collections_dir(owner_id), path)

	# Security check: verify the requested path is within this user's collections directory
	if not os.path.normpath(file_path).startswith(os.path.normpath(get_user_collections_dir(owner_id))):
		app.logger.warning(f"Access denied: User {user_id} attempted to access path '{path}' outside their directory")
		return jsonify({'error': 'Access denied: path is outside of user directory'}), 403

	# Check if file exists
	if not os.path.exists(file_path) or not os.path.isfile(file_path):
		return jsonify({'error': 'File not found'}), 404

	# Check if file is an image
	if not is_image_file(file_path):
		return jsonify({'error': 'Not an image file'}), 400

	# Get thumbnail path
	thumbnail_path = get_thumbnail_path(file_path)

	# Create thumbnail if it doesn't exist
	if not os.path.exists(thumbnail_path):
		create_thumbnail(file_path)

	# Return thumbnail
	return send_file(thumbnail_path)


@app.route('/api/collections/analyze', methods=['POST'])
@login_required
def analyze_collection_image():
	try:
		# Validate request data
		if not request.is_json:
			return jsonify({'error': 'Invalid request format, JSON required'}), 400

		data = request.json
		path = data.get('path', '')
		user_id = current_user.id

		# Validate path
		if not path or not is_safe_path(path):
			app.logger.warning(f"Invalid path attempt: User {user_id} tried to access unsafe path '{path}'")
			return jsonify({'error': 'Invalid path'}), 400

		# Check if path is within user's directory
		if not verify_collection_ownership(path, user_id):
			app.logger.warning(
				f"Access denied: User {user_id} attempted to access path '{path}' outside their directory")
			return jsonify({'error': 'Access denied: path is outside of user directory'}), 403

		# Check if user has access to this file
		file_record = Collection.query.filter_by(path=path, owner_id=user_id).first()

		# If not owner, check if file is shared with user
		if not file_record:
			shared = SharedFile.query.filter_by(
				path=path,
				shared_with_id=user_id
			).first()

			if not shared:
				app.logger.warning(
					f"Access denied: User {user_id} attempted to access file '{path}' not shared with them")
				return jsonify({'error': 'Access denied'}), 403

			# Get the actual owner ID for the file path
			owner_id = shared.owner_id
		else:
			owner_id = user_id

		# Create absolute path using the owner's directory
		file_path = os.path.join(get_user_collections_dir(owner_id), path)

		# Check if file exists
		if not os.path.exists(file_path) or not os.path.isfile(file_path):
			return jsonify({'error': 'File not found'}), 404

		# Check if file is an image
		if not is_image_file(file_path):
			return jsonify({'error': 'Not an image file'}), 400

		# Analyze image using existing AI functionality
		analysis_results = analyze_image(file_path)

		return jsonify({
			'success': True,
			'path': path,
			'results': analysis_results
		})
	except Exception as e:
		app.logger.error(f"Error analyzing image {path if 'path' in locals() else 'unknown'}: {str(e)}")
		return jsonify({'error': 'Failed to analyze image'}), 500


def analyze_image(file_path):
	"""Analyze an image using AI features"""
	try:
		# Placeholder for actual AI analysis
		# This would call existing AI functionality in your app
		results = {
			'description': 'An image analysis would appear here',
			'tags': ['tag1', 'tag2', 'tag3'],
			'colors': ['#FF5733', '#33FF57', '#3357FF'],
			'objects': ['object1', 'object2'],
			'ai_generated': False
		}

		# In a real implementation, you would:
		# 1. Load the image
		# 2. Use existing AI models to analyze it
		# 3. Return structured results

		return results
	except Exception as e:
		app.logger.error(f"Error in AI analysis for {file_path}: {str(e)}")
		return {
			'error': str(e),
			'description': 'Analysis failed',
			'tags': []
		}


# Utility functions for collections
def is_safe_path(path):
	"""Check if a path is safe (no directory traversal)"""
	if not path:
		return True

	# Normalize path
	norm_path = os.path.normpath(path)

	# Check for directory traversal attempts
	if norm_path.startswith('..') or '/../' in norm_path or '/..' in norm_path:
		return False

	return True


def is_valid_filename(filename):
	"""Check if a filename is valid"""
	# Check for empty filename
	if not filename or filename.strip() == '':
		return False

	# Check for invalid characters
	invalid_chars = ['/', '\\', ':', '*', '?', '"', '<', '>', '|']
	if any(char in filename for char in invalid_chars):
		return False

	# Check if filename is too long
	if len(filename) > 255:
		return False

	return True


def is_image_file(filename):
	"""Check if a file is an image based on extension"""
	image_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']
	_, ext = os.path.splitext(filename)
	return ext.lower() in image_extensions


def get_thumbnail_path(file_path):
	"""Get the path to the thumbnail for a file"""
	thumbnails_dir = THUMBNAILS_ROOT
	file_hash = hashlib.md5(file_path.encode()).hexdigest()
	_, ext = os.path.splitext(file_path)
	return os.path.join(thumbnails_dir, f"{file_hash}{ext}")


def create_thumbnail(file_path, size=(240, 180)):
	"""Create a thumbnail for an image file"""
	# Get thumbnail path
	thumbnail_path = get_thumbnail_path(file_path)

	try:
		# Open image
		img = Image.open(file_path)

		# Preserve aspect ratio
		img.thumbnail(size, Image.LANCZOS)

		# Save thumbnail
		img.save(thumbnail_path, optimize=True, quality=85)

		return thumbnail_path
	except Exception as e:
		app.logger.error(f"Error creating thumbnail for {file_path}: {str(e)}")
		# Return original file path if thumbnail creation fails
		return file_path


# --- Person Page Route ---

@app.route('/person')
def person():
	"""Redirecting to collections page since face recognition is disabled"""
	flash("Face recognition has been disabled.", "warning")
	return redirect(url_for('collections_page'))


# --- API Endpoints for Person Page ---

@app.route('/api/get-all-people')
def api_get_all_people():
	"""Return empty list since face recognition is disabled"""
	return jsonify({
		"success": False,
		"message": "Face recognition has been disabled.",
		"people": []
	})


@app.route('/api/get-person-photos', methods=['GET'])
def api_get_person_photos():
	"""Return empty list since face recognition is disabled"""
	return jsonify({
		"success": False,
		"message": "Face recognition has been disabled.",
		"photos": []
	})


# --- User Authentication Routes ---
@app.route('/login', methods=['GET', 'POST'])
def login():
	if current_user.is_authenticated:
		return redirect(url_for('index'))

	if request.method == 'POST':
		try:
			username = request.form.get('username', '').strip()
			password = request.form.get('password', '').strip()
			remember = True if request.form.get('remember') else False

			# Simple validation
			if not username or not password:
				flash('Please enter both username and password', 'error')
				return render_template('login.html')

			# Query the database
			user = User.query.filter_by(username=username).first()

			# Check if user exists and password is correct
			if user and user.check_password(password):
				login_user(user, remember=remember)
				next_page = request.args.get('next')
				return redirect(next_page or url_for('index'))
			else:
				flash('Invalid username or password', 'error')
				return render_template('login.html')
				
		except Exception as e:
			app.logger.error(f"Login error: {str(e)}")
			flash('An error occurred during login. Please try again.', 'error')
			return render_template('login.html')

	return render_template('login.html')


@app.route('/register', methods=['GET', 'POST'])
def register():
	if current_user.is_authenticated:
		return redirect(url_for('index'))

	if request.method == 'POST':
		# Get form data
		username = request.form.get('username')
		email = request.form.get('email')
		password = request.form.get('password')
		confirm_password = request.form.get('confirm_password')

		# Basic validation
		if not username or not email or not password:
			flash('Please fill out all required fields', 'error')
			return render_template('register.html')

		if password != confirm_password:
			flash('Passwords do not match', 'error')
			return render_template('register.html')

		# Check if username or email already exists
		existing_user = User.query.filter_by(username=username).first()
		if existing_user:
			flash('Username already exists', 'error')
			return render_template('register.html')

		existing_email = User.query.filter_by(email=email).first()
		if existing_email:
			flash('Email already registered', 'error')
			return render_template('register.html')

		# Create new user
		try:
			new_user = User(
				username=username,
				email=email,
				api_keys='{}'
			)
			new_user.set_password(password)

			# Add to database
			db.session.add(new_user)
			db.session.commit()

			flash('Registration successful! Please log in.', 'success')
			return redirect(url_for('login'))
		except Exception as e:
			db.session.rollback()
			print(f"Registration error: {e}")
			flash('An error occurred during registration', 'error')

	return render_template('register.html')


@app.route('/logout')
def logout():
	"""Handle user logout"""
	logout_user()
	flash('You have been logged out.', 'info')
	return redirect(url_for('index'))


@app.route('/profile')
@login_required
def profile():
	"""Display user profile"""
	return render_template('profile.html', user=current_user)


@app.route('/profile/edit', methods=['GET', 'POST'])
@login_required
def edit_profile():
	"""Allow users to edit their profile"""
	error = None
	success = None

	if request.method == 'POST':
		bio = request.form.get('bio', '').strip()

		# Handle profile image upload
		if 'profile_image' in request.files:
			profile_image = request.files['profile_image']

			if profile_image.filename:
				# Check if the file is an allowed image
				allowed_extensions = {'png', 'jpg', 'jpeg', 'gif'}
				if '.' in profile_image.filename and profile_image.filename.rsplit('.', 1)[
					1].lower() in allowed_extensions:
					# Generate a secure filename
					filename = secure_filename(
						f"{current_user.username}_{int(time.time())}.{profile_image.filename.rsplit('.', 1)[1].lower()}")

					# Save the file
					profile_image_dir = os.path.join(app.config['UPLOAD_FOLDER'], 'profile_images')
					os.makedirs(profile_image_dir, exist_ok=True)
					profile_image_path = os.path.join(profile_image_dir, filename)
					profile_image.save(profile_image_path)

					# Update user's profile image
					current_user.profile_image = f"uploads/profile_images/{filename}"
				else:
					error = 'Invalid file format. Please upload a valid image file (PNG, JPG, JPEG, GIF).'

		# Update other profile details
		if not error:
			current_user.bio = bio
			db.session.commit()
			success = 'Profile updated successfully!'

	return render_template('edit_profile.html', user=current_user, error=error, success=success)


@app.route('/profile/api-keys', methods=['GET', 'POST'])
@login_required
def api_keys():
	"""Allow users to manage their API keys"""
	error = None
	success = None

	api_services = {
		'replicate': 'Replicate (Abstract Animation)',
		'picsart': 'PicsArt (Cinematic Animation)',
		'runway': 'RunwayML (Artistic Animation)',
		'did': 'D-ID (Realistic Animation)',
		'openai': 'OpenAI (Text Generation)',
		'pixabay': 'Pixabay (Image Search)'
	}

	if request.method == 'POST':
		service = request.form.get('service')
		api_key = request.form.get('api_key', '').strip()

		if service in api_services:
			current_user.set_api_key(service, api_key)
			success = f'API key for {api_services[service]} updated successfully!'
		else:
			error = 'Invalid service selected.'

	return render_template('api_keys.html', user=current_user, api_services=api_services, error=error, success=success)


@app.route('/reset-password-request', methods=['GET', 'POST'])
def reset_password_request():
	if current_user.is_authenticated:
		return redirect(url_for('index'))

	if request.method == 'POST':
		email = request.form.get('email')
		user = User.query.filter_by(email=email).first()

		if user:
			# Generate a token
			token = secrets.token_urlsafe(32)

			# Store the token in the database with expiration time (1 hour)
			user.reset_token = token
			user.reset_token_expiration = datetime.utcnow() + timedelta(hours=1)
			db.session.commit()

			# Send email with reset link
			reset_url = url_for('reset_password', token=token, _external=True)
			html = f'''
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #0F5E4C;">PhotoGenic</h1>
                </div>
                <h2 style="color: #333;">Password Reset Request</h2>
                <p>Hello,</p>
                <p>We received a request to reset your password. Click the button below to reset it:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{reset_url}" style="background-color: #0F5E4C; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Your Password</a>
                </div>
                <p>If you didn't request a password reset, you can ignore this email.</p>
                <p>This link will expire in 1 hour.</p>
                <p>Thank you,<br>The PhotoGenic Team</p>
            </div>
            '''

			send_email('Reset Your PhotoGenic Password', email, html)

			flash('Password reset instructions have been sent to your email.', 'success')
			return redirect(url_for('login'))
		else:
			flash('Email not found. Please check the email address or register for an account.', 'error')

	return render_template('reset_password_request.html')


@app.route('/reset-password/<token>', methods=['GET', 'POST'])
def reset_password(token):
	if current_user.is_authenticated:
		return redirect(url_for('index'))

	# Find user by token
	user = User.query.filter_by(reset_token=token).first()

	# Check if token is valid and not expired
	if not user or user.reset_token_expiration < datetime.utcnow():
		flash('The password reset link is invalid or has expired.', 'error')
		return redirect(url_for('reset_password_request'))

	if request.method == 'POST':
		password = request.form.get('password')
		confirm_password = request.form.get('confirm_password')

		if password != confirm_password:
			flash('Passwords do not match.', 'error')
			return redirect(url_for('reset_password', token=token))

		# Update user's password
		user.set_password(password)

		# Clear the reset token
		user.reset_token = None
		user.reset_token_expiration = None

		db.session.commit()

		flash('Your password has been reset successfully. You can now log in with your new password.', 'success')
		return redirect(url_for('login'))

	return render_template('reset_password.html', token=token)


@app.route('/login/google')
def login_google():
	"""Initiate Google OAuth login flow"""
	# Create a redirect URI for the callback
	redirect_uri = url_for('google_authorized', _external=True)

	# Store the next parameter in session
	session['next'] = request.args.get('next', url_for('index'))

	# Log the redirect URI for debugging
	app.logger.info(f"Google OAuth redirect URI: {redirect_uri}")

	# Initiate the authorization flow
	try:
		return oauth.google.authorize_redirect(redirect_uri)
	except Exception as e:
		app.logger.error(f"Google OAuth redirect error: {str(e)}")
		flash('Error initiating Google login. Please try again or use email login.', 'error')
		return redirect(url_for('login'))


@app.route('/login/google/callback')
def google_authorized():
	"""Handle Google OAuth callback"""
	try:
		# Log the callback parameters for debugging
		app.logger.info(f"Google OAuth callback received with parameters: {request.args}")

		# Exchange authorization code for tokens
		token = oauth.google.authorize_access_token()
		if not token:
			raise Exception("Failed to get access token")

		# Parse ID token to get user info
		user_info = oauth.google.parse_id_token(token)
		if not user_info or 'email' not in user_info:
			raise Exception("Failed to get user info from ID token")

		app.logger.info(f"Google user info received: {user_info.get('email')}")

		# Check if a user exists with this email
		user = User.query.filter_by(email=user_info['email']).first()

		if not user:
			# Create a new user
			username_base = user_info['email'].split('@')[0]
			username = username_base
			counter = 1

			# Ensure username is unique
			while User.query.filter_by(username=username).first():
				username = f"{username_base}{counter}"
				counter += 1

			# Generate a random password for the user
			random_password = ''.join(random.choices(string.ascii_letters + string.digits, k=16))

			user = User(
				username=username,
				email=user_info['email'],
				api_keys='{}'
			)
			user.set_password(random_password)

			db.session.add(user)
			db.session.commit()

			flash('Account created successfully with Google!', 'success')

		# Log the user in
		login_user(user)

		# Redirect to the next page or index
		next_page = session.pop('next', url_for('index'))

		flash('Login successful via Google!', 'success')
		return redirect(next_page)

	except Exception as e:
		app.logger.error(f"Google auth error: {str(e)}")
		flash('Authentication failed. Please try again or use email login.', 'error')
		return redirect(url_for('login'))


# API endpoint for user search
@app.route('/api/users/search', methods=['GET'])
def api_search_users():
	query = request.args.get('q', '')
	if not query or len(query) < 2:
		return jsonify({
			'success': False,
			'message': 'Search query must be at least 2 characters',
			'users': []
		})

	# Search for users (excluding the current user)
	current_user_id = current_user.id if current_user.is_authenticated else 0

	users = User.query.filter(
		User.id != current_user_id,
		(User.username.ilike(f'%{query}%') | User.email.ilike(f'%{query}%'))
	).limit(10).all()

	users_list = [{
		'id': user.id,
		'username': user.username,
		'email': user.email,
		'profile_image': user.profile_image if hasattr(user, 'profile_image') else None
	} for user in users]

	return jsonify({
		'success': True,
		'users': users_list
	})


@app.route('/api/collections/rename', methods=['POST'])
@login_required
def rename_collection_item():
	"""Rename a file or folder in the user's collections"""
	try:
		data = request.json
		old_path = data.get('old_path')
		new_name = data.get('new_name')
		user_id = current_user.id

		# Validate parameters
		if not old_path or not new_name:
			return jsonify({'error': 'Missing path or new name'}), 400

		if not is_safe_path(old_path):
			return jsonify({'error': 'Invalid path'}), 400

		# Prevent directory traversal in new name
		if '/' in new_name or '\\' in new_name or new_name.startswith('.'):
			return jsonify({'error': 'Invalid new name'}), 400

		# Verify ownership
		if not verify_collection_ownership(old_path, user_id):
			return jsonify({'error': 'Access denied'}), 403

		# Get user's collections directory
		user_dir = get_user_collections_dir(user_id)

		# Construct full paths
		old_full_path = os.path.join(user_dir, old_path)

		# Get the parent directory path
		parent_path = os.path.dirname(old_path)

		# Construct new path
		new_path = os.path.join(parent_path, new_name) if parent_path else new_name
		new_full_path = os.path.join(user_dir, new_path)

		# Verify old path exists
		if not os.path.exists(old_full_path):
			return jsonify({'error': 'Item not found'}), 404

		# Check if new path already exists
		if os.path.exists(new_full_path):
			return jsonify({'error': 'An item with this name already exists'}), 409

		# Perform the rename
		try:
			os.rename(old_full_path, new_full_path)

			# Update database records
			collection = Collection.query.filter_by(path=old_path, owner_id=user_id).first()
			if collection:
				collection.path = new_path
				collection.name = new_name

				# If it's a folder, update paths of items inside
				if collection.is_folder:
					# Find all items that start with the old path
					items = Collection.query.filter(
						Collection.owner_id == user_id,
						Collection.path.like(f"{old_path}/%")
					).all()

					for item in items:
						# Replace old path prefix with new path
						item.path = item.path.replace(old_path, new_path, 1)

				db.session.commit()

			return jsonify({
				'success': True,
				'old_path': old_path,
				'new_path': new_path
			})

		except Exception as e:
			db.session.rollback()
			app.logger.error(f"Error renaming item: {str(e)}")
			return jsonify({'error': f'Failed to rename item: {str(e)}'}), 500

	except Exception as e:
		app.logger.error(f"Error in rename operation: {str(e)}")
		return jsonify({'error': 'Internal server error'}), 500


@app.route('/api/collections/delete', methods=['POST'])
@login_required
def delete_collection_item():
	"""Delete a file or folder from the user's collections"""
	try:
		data = request.json
		path = data.get('path')
		user_id = current_user.id

		# Validate path
		if not path:
			return jsonify({'error': 'Missing path'}), 400

		if not is_safe_path(path):
			return jsonify({'error': 'Invalid path'}), 400

		# Verify ownership
		if not verify_collection_ownership(path, user_id):
			return jsonify({'error': 'Access denied'}), 403

		# Get user's collections directory
		user_dir = get_user_collections_dir(user_id)

		# Construct full path
		full_path = os.path.join(user_dir, path)

		# Verify path exists
		if not os.path.exists(full_path):
			return jsonify({'error': 'Item not found'}), 404

		# Delete the file or directory
		try:
			if os.path.isdir(full_path):
				shutil.rmtree(full_path)
			else:
				os.remove(full_path)

			# Delete database records
			collection = Collection.query.filter_by(path=path, owner_id=user_id).first()
			if collection:
				db.session.delete(collection)

				# If it's a folder, delete all items inside
				if collection.is_folder:
					items = Collection.query.filter(
						Collection.owner_id == user_id,
						Collection.path.like(f"{path}/%")
					).all()

					for item in items:
						db.session.delete(item)

				db.session.commit()

			return jsonify({
				'success': True,
				'path': path
			})

		except Exception as e:
			db.session.rollback()
			app.logger.error(f"Error deleting item: {str(e)}")
			return jsonify({'error': f'Failed to delete item: {str(e)}'}), 500

	except Exception as e:
		app.logger.error(f"Error in delete operation: {str(e)}")
		return jsonify({'error': 'Internal server error'}), 500


@app.route('/api/collections/share', methods=['POST'])
@login_required
def share_collection_item():
	data = request.json
	path = data.get('path')
	users = data.get('users', [])

	if not path or not users:
		return jsonify({
			'success': False,
			'message': 'Missing required parameters'
		}), 400

	# Verify the path exists and belongs to the current user
	full_path = os.path.join(get_user_collections_dir(current_user.id), path.lstrip('/'))
	if not os.path.exists(full_path):
		return jsonify({
			'success': False,
			'message': 'Item not found'
		}), 404

	if not verify_collection_ownership(path, current_user.id):
		return jsonify({
			'success': False,
			'message': 'You do not have permission to share this item'
		}), 403

	# Check if the path is a file or folder
	is_folder = os.path.isdir(full_path)

	# Share with each user
	shared_with = []
	failed = []

	for username in users:
		# Find the user
		user = User.query.filter_by(username=username).first()
		if not user:
			failed.append({
				'username': username,
				'reason': 'User not found'
			})
			continue

		# Don't share with yourself
		if user.id == current_user.id:
			failed.append({
				'username': username,
				'reason': 'Cannot share with yourself'
			})
			continue

		# Check if already shared
		existing_share = SharedFile.query.filter_by(
			path=path,
			owner_id=current_user.id,
			shared_with_id=user.id
		).first()

		if existing_share:
			# Update timestamp if already shared
			existing_share.created_at = datetime.utcnow()
			shared_with.append(username)
		else:
			# Create new share record
			share = SharedFile(
				path=path,
				is_folder=is_folder,
				owner_id=current_user.id,
				shared_with_id=user.id
			)
			db.session.add(share)
			shared_with.append(username)

	# Commit changes to database
	try:
		db.session.commit()
		return jsonify({
			'success': True,
			'message': f'Shared with {len(shared_with)} users',
			'shared_with': shared_with,
			'failed': failed
		})
	except Exception as e:
		db.session.rollback()
		return jsonify({
			'success': False,
			'message': f'Error sharing item: {str(e)}'
		}), 500


@app.route('/api/collections/favorite', methods=['POST'])
@login_required
def toggle_favorite():
	data = request.get_json()
	file_path = data.get('path')
	
	if not file_path:
		return jsonify({'success': False, 'error': 'No path provided'})
		
	favorite = UserFavorites.query.filter_by(user_id=current_user.id, file_path=file_path).first()
	
	if favorite:
		db.session.delete(favorite)
		is_favorite = False
	else:
		favorite = UserFavorites(user_id=current_user.id, file_path=file_path)
		db.session.add(favorite)
		is_favorite = True
		
	db.session.commit()
	return jsonify({'success': True, 'is_favorite': is_favorite})


@app.route('/api/collections/trash', methods=['POST'])
@login_required
def move_to_trash():
	data = request.get_json()
	file_path = data.get('path')
	
	if not file_path:
		return jsonify({'success': False, 'error': 'No path provided'})
		
	# Move file to trash
	trash_item = UserTrash(
		user_id=current_user.id,
		file_path=os.path.join('trash', os.path.basename(file_path)),
		original_path=file_path
	)
	db.session.add(trash_item)
	db.session.commit()
	
	# Move the actual file
	trash_dir = os.path.join(COLLECTIONS_ROOT, 'trash')
	os.makedirs(trash_dir, exist_ok=True)
	shutil.move(
		os.path.join(COLLECTIONS_ROOT, file_path),
		os.path.join(trash_dir, os.path.basename(file_path))
	)
	
	return jsonify({'success': True})


@app.route('/api/collections/list/<category>')
@login_required
def list_collections_by_category(category):
	if category == 'recent':
		# Get recently modified files
		items = get_collection_items(
			current_user.collections_path,
			sort_by='modified',
			limit=50
		)
	elif category == 'favorites':
		# Get favorited files
		favorites = UserFavorites.query.filter_by(user_id=current_user.id).all()
		items = [get_file_info(f.file_path) for f in favorites]
	elif category == 'trash':
		# Get files in trash
		trash_items = UserTrash.query.filter_by(user_id=current_user.id).all()
		items = [get_file_info(f.file_path) for f in trash_items]
	elif category == 'permitted':
		# Get files shared with the user
		items = get_shared_items(current_user.id)
	else:
		return jsonify({'success': False, 'error': 'Invalid category'})
		
	return jsonify({'success': True, 'items': items})


def get_file_info(file_path):
	"""Get file information"""
	try:
		# Get the file info
		file_info = {
			'name': os.path.basename(file_path),
			'path': file_path,
			'type': 'folder' if os.path.isdir(file_path) else 'file',
			'isDir': os.path.isdir(file_path),
			'modifiedTime': datetime.fromtimestamp(os.path.getmtime(file_path)).isoformat()
		}

		# Add size for files
		if os.path.isfile(file_path):
			file_info['size'] = os.path.getsize(file_path)

			# Mark as image if it's an image file
			if is_image_file(file_path):
				file_info['isImage'] = True

		return file_info
	except Exception as e:
		app.logger.error(f"Error getting file info for {file_path}: {str(e)}")
		return None


def get_collection_items(collection_path, sort_by='name', limit=None):
	"""Get collection items"""
	try:
		# Get the collection items
		items = []
		for item_name in os.listdir(collection_path):
			item_path = os.path.join(collection_path, item_name)
			item = {
				'name': item_name,
				'path': item_path,
				'type': 'folder' if os.path.isdir(item_path) else 'file',
				'isDir': os.path.isdir(item_path),
				'modifiedTime': datetime.fromtimestamp(os.path.getmtime(item_path)).isoformat()
			}

			# Add size for files
			if os.path.isfile(item_path):
				item['size'] = os.path.getsize(item_path)

				# Mark as image if it's an image file
				if is_image_file(item_name):
					item['isImage'] = True

			items.append(item)

		# Sort items (folders first, then alphabetically)
		items.sort(key=lambda x: (0 if x.get('isDir', x.get('type') == 'folder') else 1, x['name'].lower()))

		# Limit items if requested
		if limit:
			items = items[:limit]

		return items
	except Exception as e:
		app.logger.error(f"Error getting collection items for {collection_path}: {str(e)}")
		return []


def get_shared_items(user_id):
	"""Get files shared with the user"""
	try:
		# Get files shared with the user
		shared_files = SharedFile.query.filter_by(shared_with_id=user_id).all()

		items = []
		for shared in shared_files:
			try:
				# Get the owner's username
				owner = User.query.get(shared.owner_id)
				if not owner:
					app.logger.warning(
						f"Owner not found for shared file: {shared.path}, owner_id: {shared.owner_id}")
					continue

				# For files, check if they exist in the owner's directory
				owner_path = os.path.join(get_user_collections_dir(shared.owner_id), shared.path.lstrip('/'))

				if not os.path.exists(owner_path):
					app.logger.warning(f"Shared file not found: {owner_path}")
					continue

				# Check if there's a collection entry
				collection = Collection.query.filter_by(path=shared.path, owner_id=shared.owner_id).first()

				if collection:
					# Use the collection entry
					item_dict = collection.to_dict()
				else:
					# Create a dictionary with file information
					is_dir = os.path.isdir(owner_path)
					filename = os.path.basename(shared.path)

					item_dict = {
						'name': filename,
						'path': shared.path,
						'type': 'folder' if is_dir else 'file',
						'isDir': is_dir,
						'modifiedTime': datetime.fromtimestamp(os.path.getmtime(owner_path)).isoformat()
					}

					# Add size for files
					if not is_dir:
						item_dict['size'] = os.path.getsize(owner_path)

						# Mark as image if it's an image file
						if is_image_file(filename):
							item_dict['isImage'] = True

				# Add owner information
				item_dict['shared_by'] = owner.username
				items.append(item_dict)

			except Exception as e:
				app.logger.error(f"Error processing shared file {shared.path}: {str(e)}")

		return items
	except Exception as e:
		app.logger.error(f"Error getting shared items for user {user_id}: {str(e)}")
		return []


# --- Shared Items Endpoints ---

def _shared_items_response():
	"""Return JSON response with items shared with the current user."""
	items = get_shared_items(current_user.id)
	return jsonify({
		"success": True,
		"items": items
	})


@app.route('/api/collections/shared', methods=['GET'])
@login_required
def api_get_shared_items():
	"""Return files/folders that have been shared with the logged-in user.

	This endpoint powers the "Permitted" section in the collections UI.
	"""
	return _shared_items_response()


# Backwards-compatibility alias used by older front-end code
@app.route('/api/collections/list/permitted', methods=['GET'])
@login_required
def api_get_shared_items_alias():
	"""Alias for /api/collections/shared so that multiple front-end scripts work regardless of the URL they call."""
	return _shared_items_response()


if __name__ == '__main__':
	app.run(debug=True)