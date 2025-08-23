# Photogeni 📸✨

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue)](https://python.org)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/shubhmrj/PhotoGraphy/pulls)
[![Forks](https://img.shields.io/github/forks/shubhmrj/PhotoGraphy?label=Forks&color=blue)](https://github.com/shubhmrj/PhotoGraphy/network/members)
[![Stars](https://img.shields.io/github/stars/shubhmrj/PhotoGraphy?label=Stars&color=yellow)](https://github.com/shubhmrj/PhotoGraphy/stargazers)
[![Issues](https://img.shields.io/github/issues/shubhmrj/PhotoGraphy?label=Issues)](https://github.com/shubhmrj/PhotoGraphy/issues)



**Solve photo storage problems with zero-storage sharing and AI creativity** - Photogeni eliminates redundant photo sharing and cloud storage waste by enabling direct user-to-user transfers. Stop sending multiple copies and hunting for lost links! 

👉 [Live Demo](https://photogenic-hq3h.onrender.com/) | 📚 [API Documentation](https://photogenic-production.up.railway.app/login?next=%2Fcollections) | 🔑 [Get API Key](https://photogenic-hq3h.onrender.com/api-keys)

## 🎥 Video Demo

[![Watch the video](https://img.youtube.com/vi/saXSTgmxXJA/0.jpg)](https://www.youtube.com/watch?v=saXSTgmxXJA)

*Click the image above to watch the demo video on YouTube*

## Table of Contents
1. [The Problem](#the-problem-)
2. [Our Solution](#our-solution-)
3. [Key Features](#key-features-)
4. [Tech Stack](#tech-stack-)
5. [Installation](#installation-)
6. [Usage Guide](#usage-guide-)
7. [API Examples](#api-examples-)
8. [FAQ](#faq-)
9. [Contributing](#contributing-)
10. [License](#license-)
11. [Contact](#contact-)



## The Problem 💡
Photogeni fundamentally reimagines how we share photos in our increasingly visual world. At its core, it solves a modern digital dilemma we've all experienced but rarely acknowledge - every time we share photos through conventional methods, we're unknowingly creating a storage crisis that impacts both our devices and the cloud infrastructure supporting our digital lives.
Traditional photo sharing follows an outdated "copy-and-distribute" model that made sense in the early digital era but has become woefully inefficient today. When you send vacation photos through WhatsApp or email, here's what really happens behind the scenes:
The original photo sits in your camera roll
A copy gets created in your messaging app's sent folder
Each recipient receives and stores a separate copy
Cloud backups create additional duplicates across multiple services
This multiplication effect becomes staggering when you consider that the average user shares 23 photos per week. For a family of four sharing memories, this translates to hundreds of redundant copies floating across devices and servers - consuming precious storage space, increasing energy usage in data centers, and creating version control nightmares when trying to find "that one good picture" later.


Modern photo sharing creates multiple issues:
- 📦 **Storage bloat** from duplicate photos in chats
- 🔗 **Lost cloud links** that expire or get forgotten
- 📱 **Device storage overload** from multiple copies
- 🔄 **Redundant uploads** to different platforms
- 🧩 **Fragmented editing** across different apps
- 📱 **Device storage overload** from multiple copies
- 📱 **Auto-file sharing** to multiple platforms , based on user's preferences
- 📱 **Auto-files authentication** basis of user's image reading


## Our Solution 🚀
Photogeni reimagines photo sharing:
1. **Search & Send** - Find users and send photos directly (no links needed)
2. **Zero-Storage Sharing** - 1 copy visible to all recipients
3. **AI Creativity Suite** - Generate stories, animations & related images
4. **Unified Platform** - All photo tools in one place
5. **API Access** - Integrate with any application

## Key Features ✨

### Storage-Efficient Sharing
- 🔍 User search and direct transfer
- 💾 Single cloud copy with multiple access
- 📲 No local storage consumption
- 🚫 No link management needed

### 🤖 AI Photo Tools  
```python
# Example AI function call
from photogeni import Client

client = Client(api_key="your_api_key")

# Generate a fantasy-style story from a photo
story = client.generate_story(image_id="12345", style="fantasy")
print(story)
```

Available AI Tools:  
- `generate_story(image_id, style)` – Create text stories around photos  
- `generate_variations(image_id, filter)` – Apply creative filters  
- `animate_photo(image_id)` – Make moving animations from stills  
- `related_images(image_id)` – Suggest similar AI-generated photos  

---

## Tech Stack 🛠  
- **Backend**: Python (FastAPI)  
- **Frontend**: React + Tailwind  
- **Database**: PostgreSQL  
- **Storage**: Cloud Object Storage (S3 Compatible)  
- **AI Models**: OpenAI / Stable Diffusion APIs  
- **Deployment**: Render, Railway  

---

## Installation ⚡  

### Prerequisites  
- Python 3.10+  
- pip / virtualenv  
- PostgreSQL  

### Setup  
```bash
# Clone repo
git clone https://github.com/shubhmrj/PhotoGraphy.git
cd PhotoGraphy

# Create virtual env
python -m venv venv
source venv/bin/activate   # Linux/Mac
venv\Scripts\activate      # Windows

# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload
```

---

## Usage Guide 📖  

### Run Locally  
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```
Visit: [http://localhost:8000](http://localhost:8000)  

### Get API Key  
- Sign up at [Photogeni](https://photogenic-hq3h.onrender.com/)  
- Navigate to **API Keys** section  
- Copy your personal API key  

---

## API Examples 🔌  

### Upload a Photo  
```python
client.upload_photo("my_photo.jpg")
```

### Share with User  
```python
client.share_photo(image_id="12345", recipient="john_doe")
```

### AI Story Generation  
```python
story = client.generate_story("12345", style="adventure")
print(story)
```

### Get Shared Photos  
```python
photos = client.get_shared_photos()
for p in photos:
    print(p.id, p.url)
```

---

## FAQ ❓  

**Q: How is this different from Google Photos or WhatsApp?**  
A: Unlike conventional apps, **Photogeni doesn’t duplicate photos** – all recipients access a **single shared copy**, saving storage.  

**Q: Can I integrate it with my app?**  
A: Yes! Use our [API Docs](https://photogenic-production.up.railway.app/login?next=%2Fcollections).  

**Q: Is my data secure?**  
A: Yes, all photos are encrypted and access-controlled.  

---

## Contributing 🤝  

Contributions are welcome!  

1. Fork the repo  
2. Create a feature branch  
   ```bash
   git checkout -b feature/your-feature
   ```
3. Commit changes  
   ```bash
   git commit -m "Add new feature"
   ```
4. Push branch and open a PR  

Please check [CONTRIBUTING.md](CONTRIBUTING.md) before submitting.  

---

## License 📜  
Distributed under the MIT License. See [LICENSE](LICENSE) for details.  

---

## Contact 📬  
👤 **Shubham**  
- GitHub: [@shubhmrj](https://github.com/shubhmrj)  
- Email: shubhmrj.dev@gmail.com  
