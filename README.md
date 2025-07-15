## 📸 PhotoGraphy

A sleek, responsive photo gallery web app built in Python, ideal for showcasing photography portfolios. Features include image upload, EXIF metadata display, lightbox viewing, and easy customization., users can perform all actions of AI, such as animation design and story generation, and utilize all my features as an API Key.

---

## 🔍 Overview

PhotoGraphy provides:

- **Image upload** via drag & drop or file picker  
- **Gallery display**: grid view, click-to-enlarge with lightbox  
- **EXIF metadata** (camera model, aperture, ISO, timestamp, etc.)  
- **Responsive design**: Desktop, tablet & mobile friendly  
- **Customizable look & feel** via CSS/JS  
- **Modular & extensible**: clear structure for added features

---

## ⚙️ Tech Stack

| Layer       | Technology                     |
|-------------|--------------------------------|
| Backend     | Python 3.x (Flask or Django)  |
| Frontend    | HTML5, CSS3, JavaScript       |
| Templating  | Jinja2                        |
| Metadata    | Pillow / exifread             |


---

## 🗂️ Project Structure

 PhotoGraphy/
├── main.py # App entrypoint & config
├── requirements.txt # Dependencies
├── .gitignore
├── static/
│ ├── css/
│ │ └── collections.css # Gallery styling
│ └── js/
│ └── collections-fixed.js # Interactivity logic
├── templates/
│ └── *.html # Gallery & layout templates
├── uploads/ # (Optional) store user uploads
└── README.md # <- this file


## 🚀 Installation & Setup

1. **Clone the repo**
   git clone https://github.com/shubhmrj/PhotoGraphy.git
   cd PhotoGraphy

2.Setup a virtual environment
    python3 -m venv venv
    source venv/bin/activate   # Windows: venv\Scripts\activate

3.Install prerequisites
    pip install -r requirements.txt

4.Run the application
    python main.py
    Browse locally
    Visit http://localhost:5000 in your browser.

**To contribute:
1.Fork the repository
2.Create a new branch (feature/your-feature)
3.Make changes and commit logically
4.Push and open a Pull Request
5.Maintain code quality, add docstrings & tests
