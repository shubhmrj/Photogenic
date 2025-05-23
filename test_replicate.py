import os
import replicate
import requests
import time
import logging
from dotenv import load_dotenv

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Load environment variables
load_dotenv()

# Get API token from environment variables
api_token = os.environ.get('REPLICATE_API_TOKEN') or os.environ.get('REPLICATE_API_KEY')

if not api_token:
    raise ValueError("No Replicate API token found. Please set REPLICATE_API_TOKEN in .env file")

logging.info(f"Using Replicate API token starting with: {api_token[:5]}...")

# Set the API token for the Replicate library
os.environ["REPLICATE_API_TOKEN"] = api_token

# Test prompt
test_prompt = "A beautiful mountain landscape with snow-capped peaks, a flowing river, and eagles soaring in the sky"

# Test the Replicate API directly
def test_replicate_api():
    try:
        logging.info(f"Starting Replicate test with prompt: {test_prompt}")
        
        # Using Stable Video Diffusion model
        output = replicate.run(
            "stability-ai/stable-video-diffusion:3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438",
            input={
                "prompt": test_prompt,
                "fps": 8,
                "motion_bucket_id": 40,
                "cond_aug": 0.02,
                "decoding_t": 8,
                "width": 576,
                "height": 320,
                "sizing_strategy": "maintain_aspect_ratio",
                "frames": 25,
                "num_inference_steps": 30,
                "guidance_scale": 7.5,
                "negative_prompt": "blurry, low quality, distorted, disfigured, ugly, bad anatomy",
            }
        )
        
        logging.info(f"Replicate API response: {output}")
        
        # Test downloading the video
        if output and isinstance(output, str):
            logging.info(f"Downloading video from: {output}")
            response = requests.get(output, stream=True)
            
            if response.status_code == 200:
                video_path = "test_output.mp4"
                with open(video_path, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        f.write(chunk)
                logging.info(f"Video downloaded successfully to {video_path}")
                return True
            else:
                logging.error(f"Failed to download video: Status code {response.status_code}")
                return False
        else:
            logging.error(f"Invalid output from Replicate API: {output}")
            return False
            
    except Exception as e:
        logging.error(f"Error in Replicate API test: {str(e)}")
        return False

if __name__ == "__main__":
    result = test_replicate_api()
    if result:
        logging.info("✅ Replicate API test successful!")
    else:
        logging.error("❌ Replicate API test failed")
