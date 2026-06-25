<div align="center">

<img src="https://img.shields.io/badge/DocuMind_AI-Production_RAG_Platform-0ea5e9?style=for-the-badge&logo=brain&logoColor=white" />

<h1>🧠 DocuMind AI</h1>

<p><strong>Production-grade AI document intelligence platform for PDF question answering, built with RAG architecture.</strong></p>

<p>
  <img src="https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react" />
  <img src="https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi" />
  <img src="https://img.shields.io/badge/Groq-LLaMA_3.3_70B-f55036?style=flat-square" />
  <img src="https://img.shields.io/badge/FAISS-Vector_Search-orange?style=flat-square" />
  <img src="https://img.shields.io/badge/LangChain-RAG-1c3144?style=flat-square" />
  <img src="https://img.shields.io/badge/SQLite-Persistence-003b57?style=flat-square&logo=sqlite" />
</p>

<p>
  <a href="#demo">Demo</a> ·
  <a href="#features">Features</a> ·
  <a href="#architecture">Architecture</a> ·
  <a href="#quickstart">Quick Start</a> ·
  <a href="#deployment">Deployment</a>
</p>

</div>

---

## 📌 Overview

DocuMind AI is a full-stack Retrieval-Augmented Generation (RAG) application that enables intelligent conversations with PDF documents. Users can upload multiple PDFs, ask natural language questions, and receive AI-generated answers with **exact page citations** and optional **live web search augmentation** — all in a Perplexity-style chat interface.

Built as a production-grade portfolio project demonstrating end-to-end AI engineering: from document ingestion and vector indexing to LLM orchestration, REST API design, and modern frontend development.

---

## ✨ Features

| Feature | Description |
|---|---|
| 📚 Multi-PDF RAG | Upload and query multiple PDFs simultaneously per session |
| 📍 Page Citations | Every answer references exact source page numbers |
| 💬 Persistent Sessions | Named chat sessions stored in SQLite — survive restarts |
| 🌐 Web Search | DuckDuckGo integration augments answers with live results |
| ⚡ Groq LLaMA 3.3 70B | Ultra-fast inference, 100% free — no billing required |
| 🔍 FAISS Vector Search | Balanced per-document retrieval with cosine similarity |
| 🎨 Perplexity-style UI | React + Framer Motion — animations, typewriter streaming |
| 🔌 REST API | FastAPI backend with full Swagger documentation at `/docs` |
| 🐳 Docker Ready | `docker-compose` for one-command local deployment |
| 📤 Drag & Drop Upload | PDF upload directly in the chat sidebar |
| 📋 Copy & Export | Copy answers, export full sessions as `.docx` |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                        │
│         Vite · Tailwind · Framer Motion · Zustand       │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP REST (Axios)
                       ▼
┌─────────────────────────────────────────────────────────┐
│                  FastAPI Backend                         │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────┐  │
│  │  PyPDF   │  │LangChain │  │  FAISS   │  │ Groq  │  │
│  │  Parser  │→ │ Chunker  │→ │  Index   │→ │  LLM  │  │
│  └──────────┘  └──────────┘  └──────────┘  └───────┘  │
│                                                         │
│  ┌──────────────┐  ┌─────────────────────────────────┐ │
│  │   SQLite     │  │  DuckDuckGo Web Search          │ │
│  │  (sessions + │  │  (optional augmentation)        │ │
│  │   messages)  │  └─────────────────────────────────┘ │
│  └──────────────┘                                       │
└─────────────────────────────────────────────────────────┘
```

### RAG Pipeline

```
PDF Upload → Text Extraction (PyPDF) → Chunking (LangChain, 350 tokens)
    → Embedding (HuggingFace MiniLM-L6) → FAISS Index

Query → Embedding → Balanced Search (per-doc retrieval)
    → Context Assembly → Groq LLaMA 3.3 70B → Answer + Citations
```

---

## 🛠️ Tech Stack

**Frontend**
- React 18 + Vite
- Tailwind CSS — dark glassmorphism theme
- Framer Motion — page transitions, message animations, typewriter effect
- Zustand — lightweight global state
- React Markdown — full markdown + table rendering
- React Dropzone — drag-and-drop PDF upload
- Lucide React — icon system
- Axios — HTTP client

**Backend**
- FastAPI — async REST API
- LangChain — document chunking and RAG orchestration
- FAISS — CPU vector store with similarity search
- HuggingFace `sentence-transformers/all-MiniLM-L6-v2` — embeddings
- Groq API — LLaMA 3.3 70B inference
- PyPDF — PDF parsing with page-level text extraction
- DuckDuckGo Search — free web augmentation
- SQLite — session and message persistence
- Python-dotenv — environment management

**DevOps**
- Docker + docker-compose — containerized local deployment
- Railway — backend hosting
- Vercel — frontend hosting
- GitHub Actions ready

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- Free Groq API key → [console.groq.com](https://console.groq.com)

### 1. Clone
```bash
git clone https://github.com/Om-Jagtap/DocuMind-AI.git
cd DocuMind-AI
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate       # Windows
# source venv/bin/activate  # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env → add your GROQ_API_KEY

# Run backend
uvicorn main:app --reload --port 8000
```
Backend: **http://localhost:8000**  
API Docs: **http://localhost:8000/docs**

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# .env.local already points to http://localhost:8000

# Run frontend
npm run dev
```
Frontend: **http://localhost:3000**

---

## 🌐 Deployment

### Backend → Railway (Free)

1. Push this repo to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Select the `backend/` directory as root
4. Add environment variable: `GROQ_API_KEY=your_key`
5. Railway auto-detects the `Procfile` and deploys
6. Copy your Railway URL: `https://documind-ai-backend.up.railway.app`

### Frontend → Vercel (Free)

1. Go to [vercel.com](https://vercel.com) → New Project → Import GitHub repo
2. Set **Root Directory** to `frontend`
3. Framework preset: **Vite**
4. Add environment variable:
   ```
   VITE_API_URL = https://your-railway-backend-url.up.railway.app
   ```
5. Deploy → get your public URL instantly

### Docker (Self-hosted)
```bash
# From project root
cp .env.example .env  # add GROQ_API_KEY
docker-compose up --build
```

---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/sessions/create` | Create new chat session |
| `GET` | `/sessions` | List all sessions |
| `GET` | `/sessions/{id}/messages` | Get chat history |
| `DELETE` | `/sessions/{id}` | Delete session |
| `PATCH` | `/sessions/{id}/rename` | Rename session |
| `POST` | `/sessions/{id}/upload` | Upload & index PDFs |
| `GET` | `/sessions/{id}/documents` | List indexed documents |
| `POST` | `/ask` | Ask a question (RAG) |

Full interactive documentation: **[Backend URL]/docs**

---

## 📁 Project Structure

```
DocuMind-AI/
├── backend/
│   ├── main.py              # FastAPI application — all RAG logic
│   ├── requirements.txt     # Python dependencies
│   ├── Dockerfile           # Container definition
│   ├── railway.toml         # Railway deployment config
│   ├── Procfile             # Process definition for PaaS
│   └── .env.example         # Environment template
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                    # Root component + routing
│   │   ├── main.jsx                   # React entry point
│   │   ├── index.css                  # Global styles + Tailwind
│   │   ├── components/
│   │   │   ├── Sidebar.jsx            # Sessions, upload, settings
│   │   │   ├── ChatArea.jsx           # Main chat interface
│   │   │   ├── Message.jsx            # Message bubble + citations
│   │   │   └── WelcomeScreen.jsx      # Landing / empty state
│   │   └── lib/
│   │       ├── api.js                 # Axios API client
│   │       └── store.js               # Zustand global state
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── vercel.json          # Vercel deployment config
│   └── .env.example         # Environment template
│
├── docker-compose.yml       # Full-stack local deployment
├── .gitignore
└── README.md
```

---

## 🔬 Key Technical Decisions

**Why Groq over OpenAI/Gemini?**
Free tier with no billing required, 100x faster inference than alternatives, production-grade API reliability.

**Why FAISS over ChromaDB?**
Zero external dependencies, runs entirely in-memory, no server process required, faster for document-scale workloads.

**Why FastAPI + React over Streamlit?**
Clean separation of concerns, proper REST API enables any frontend (mobile, web, CLI), industry-standard architecture for production systems.

**Why SQLite over PostgreSQL?**
Zero-config persistence ideal for single-instance deployment, no external database service needed, sufficient for session/message storage at this scale.

---

## 👨‍💻 Author

**Om Jagtap**  
B.Tech — Artificial Intelligence & Data Science  
Sanjivani University, Maharashtra

[![GitHub](https://img.shields.io/badge/GitHub-Om--Jagtap-181717?style=flat-square&logo=github)](https://github.com/Om-Jagtap)

---

## ⭐ If this project helped you, consider giving it a star!

