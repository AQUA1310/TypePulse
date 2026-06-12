# TypePulse

A minimalist typing speed test application built entirely with vanilla web technologies.

## 🎯 Project Goals
- [x] Design and implement UI layout (HTML/CSS)
- [x] Implement Dynamic word generation (JavaScript)
- [x] Build key-tracking & real-time typing logic
- [x] Add timer countdown and live WPM/Accuracy metrics
- [x] Implement local score tracking

## 🛠️ Tech Stack
- **HTML5** for semantic markup
- **CSS3** for styling and layout
- **JavaScript (ES6+)** for core application logic and data management

---

## 🚀 How to Run TypePulse Locally

Since this project uses vanilla JavaScript modules/data fetching, opening the `index.html` file directly by double-clicking it can sometimes trigger browser security blocks (CORS errors). For the best experience, run it using a local server.

### Option 1: VS Code Live Server (Easiest)
1. Open this project folder in **VS Code**.
2. Install the **Live Server** extension (by Ritwick Dey) if you haven't already.
3. Click the **Go Live** button at the bottom right corner of your VS Code status bar.
4. Your browser will automatically open the app at `http://127.0.0.1:5500`.

### Option 2: Using Python (Terminal)
If you prefer using the command line, navigate to the project directory in your terminal and run:
```bash
python -m http.server 8000
