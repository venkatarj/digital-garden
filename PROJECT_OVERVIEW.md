# Digital Garden - Project Overview

## 🌟 Executive Summary
The **Digital Garden** is a modern, AI-enhanced journaling platform designed for reflection and personal growth. It combines a distraction-free writing environment with powerful analytics and machine learning to help users track their mood, visualize their thoughts, and organize their entries automatically.

---

## 🛠️ Toolchain & Technology Stack

### **Frontend** (Modern React Ecosystem)
Built for speed transparency and visual fidelity.
- **Framework**: `React 19` + `Vite 7` (Blazing fast HMR and build).
- **Styling**: `Tailwind CSS 4` + Custom CSS Variables for themes (Glassmorphism).
- **Animation**: `Framer Motion` for smooth UI transitions (e.g., Zen Mode entry).
- **Visualization**: `Recharts` for interactive mood/topic charts.
- **Icons**: `Lucide React` for a clean, consistent icon set.
- **State/Networking**: `Axios` for API calls, standard React Hooks for state.

### **Backend** (High-Performance Python API)
Built for asynchronous processing and AI integration.
- **API Framework**: `FastAPI` (Async, auto-documented via Swagger UI).
- **Database ORM**: `SQLAlchemy` (Async session management).
- **AI/ML Engine**:
    - `SentenceTransformers`: Runs local LLM models (`all-MiniLM-L6-v2`) for semantic analysis.
    - `Scikit-Learn`: Used for cosine similarity and keyword extraction (KeyBERT-lite).
    - `PyTorch`: Underpinning the neural network operations.
- **Async Tasks**: `Celery` + `Redis` (Task queue for background processing).

### **Infrastructure** (Containerized Deployment)
- **Containerization**: `Docker` & `Docker Compose` for orchestrating services (Frontend, Backend, DB, Redis, Nginx).
- **Reverse Proxy**: `Nginx` handles incoming traffic, SSL termination, and static file serving.
- **Database**: `PostgreSQL 15` (Robust relational data storage).
- **Caching**: `Redis 7` (High-speed caching and message broker).
- **Security**: Self-Signed SSL Certificates (HTTPS on port 443).

---

## 🚀 Key Features

### 1. 📝 **Intelligent Journaling**
- **Zen Mode**: A distraction-free environment that hides all UI elements while you type, allowing pure focus.
- **Auto-Save**: Seamlessly saves your work in the background to prevent data loss.
- **Reflection Modes**: Dedicated overlays for specific mindsets:
    - *Vent Mode*: For clearing your mind.
    - *Gratitude Mode*: For positive reinforcement.
    - *Deep Reflection*: For structured thinking.

### 2. 🤖 **AI Auto-Tagging**
- **Smart Extraction**: Uses a local AI model to analyze your journal entry and suggest relevant tags automatically.
- **Privacy-First**: Analysis happens locally on your server—no data is sent to external AI APIs.
- **One-Click**: Accessible via a dedicated "Auto-Tag" button for entries >20 characters.

### 3. 📊 **Visual Insights Dashboard**
- **Mood Trends**: An interactive area chart visualizing your emotional journey over time.
- **Topic Distribution**: A bar chart showing the frequency of your tags and topics, helping you identify recurring themes in your life.

### 4. 🔒 **Secure & Self-Hostable**
- **Encrypted**: Fully capable of running over HTTPS.
- **Owned Data**: You own the database, the code, and the keys. Nothing is hidden.

---

## 📂 Project Structure

```bash
digital-garden/
├── backend/                # FastAPI Application
│   ├── app/
│   │   ├── api/            # API Route Handlers
│   │   ├── core/           # Config & Security
│   │   ├── db/             # Database Models & Schemas
│   │   ├── services/       # Business Logic (AI, Tagging)
│   └── Dockerfile          # Backend Container Config
│
├── frontend/               # React Application
│   ├── src/
│   │   ├── features/       # Feature-based architecture (Journal, Dashboard)
│   │   ├── components/     # Shared UI Components (Charts, Buttons)
│   │   ├── assets/         # Static Assets
│   └── Dockerfile          # Frontend/Nginx Container Config
│
├── deploy.sh               # One-click deployment script
├── docker-compose.prod.yml # Production Orchestration
└── docker-compose.yml      # Local Development Orchestration
```

## 🔄 Deployment Workflow
The project uses a custom `deploy.sh` script to simplify updates:
1.  **Sync**: Uses `rsync` to push local code changes to the remote server.
2.  **Build**: Rebuilds Docker containers (smartly caching layers).
3.  **Launch**: Restarts services with zero-downtime architecture goals.
