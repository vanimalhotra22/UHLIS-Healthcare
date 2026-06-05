# 🏥 UHLIS - Universal Healthcare Logistic & Integration System

UHLIS is a futuristic, full-stack healthcare platform featuring a robust Python **FastAPI backend** and a modern **React frontend**. The system integrates advanced generative AI features powered by Gemini, live biometrics telemetry, secure medical records vaults, and emergency booking systems to deliver a comprehensive digital healthcare dashboard.

---

## 🌟 Key Features

*   **🤖 AI Health Copilot & Clinical Chat:** Powered by Gemini, offering instant clinical insights, disease guideline checks, and automated prescription routing.
*   **👁️ Multi-Organ AI Scanner:** Upload scans (Lungs, Skin, Eyes, Pathology, Abdomen, Breast) and receive instant diagnosis, confidence metrics, and severity details using Gemini Vision.
*   **📄 Secure Medical Records Vault:** Upload PDF, JPG, PNG, and CSV medical files to a secure vault, with automatic AI-generated summaries.
*   **💓 Live Vitals & Telemetry Dashboard:** View real-time simulated heart rate and blood pressure trends dynamically updated via custom charts.
*   **🛒 Pharmacy Hub & Bio-Bank:** E-commerce section to browse formulations, manage carts, and route bio-resources (Blood, Organs) in critical situations.
*   **🚑 Emergency Ambulance Booking:** Dispatches simulated emergency units with ETAs, driver contacts, and pick-up details.
*   **🗺️ OpenStreetMap Facility Finder:** Integration with the Overpass API to proxy and display real hospitals, clinics, and doctors nearby.

---

## 🛠️ Technology Stack

### Backend:
*   **Framework:** FastAPI (Python)
*   **Database:** SQLite + SQLAlchemy ORM
*   **AI Integration:** LangChain + Gemini (`langchain-google-genai`)
*   **Server:** Uvicorn

### Frontend:
*   **Framework:** React.js
*   **Styling:** Tailwind CSS + Framer Motion
*   **Charts:** Recharts
*   **Maps:** React Leaflet + OpenStreetMap
*   **Icons:** Lucide React

---

## 🚀 Setup & Installation (Local Execution)

### Prerequisites:
Ensure you have **Python 3.10+** and **Node.js 18+** installed on your system.

### 1. Backend Setup
1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Create a Virtual Environment and activate it:
   ```bash
   # Windows
   python -m venv venv
   .\venv\Scripts\activate

   # Linux/macOS
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install the required Python packages:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file in the `backend` directory and add your Gemini API Key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
5. Seed the database with sample data (Medicines, Doctors, Bio-Bank resources):
   ```bash
   # Windows (sets UTF-8 encoding support for logs)
   $env:PYTHONIOENCODING="utf-8"
   python seed_data.py
   ```
6. Start the backend development server:
   ```bash
   python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
   ```

---

### 2. Frontend Setup
1. Navigate to the `frontend` folder:
   ```bash
   cd ../frontend
   ```
2. Install the Node packages:
   ```bash
   npm install --legacy-peer-deps
   ```
3. Start the React development server:
   ```bash
   npm start
   ```
   The application will run locally on [http://localhost:3000](http://localhost:3000).

---

## ☁️ Deployment Guide

### Backend: Deploying on Render (render.com)
1. Select **New + > Web Service** on Render.
2. Link your GitHub repository.
3. Configure the settings:
   * **Root Directory:** `backend`
   * **Build Command:** `pip install -r requirements.txt`
   * **Start Command:** `python -m uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add the following **Environment Variables** under Settings:
   * `GEMINI_API_KEY` = `[Your Gemini API Key]`
   * `PYTHONIOENCODING` = `utf-8`

### Frontend: Deploying on Vercel (vercel.com)
1. Select **Add New > Project** on Vercel.
2. Link your GitHub repository.
3. Configure the settings:
   * **Root Directory:** `frontend`
4. Add the following **Environment Variable**:
   * `REACT_APP_API_URL` = `[Your Live Render URL]` (e.g., `https://your-app.onrender.com`)
5. Click **Deploy**.
