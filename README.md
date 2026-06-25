<div align="center">

<h1>DocuMind AI</h1>

<p>Production-grade AI document intelligence platform for conversational PDF question answering, built on Retrieval-Augmented Generation architecture.</p>

<p>
  <img src="https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/Groq-LLaMA_3.3_70B-f55036?style=flat-square&logoColor=white" />
  <img src="https://img.shields.io/badge/FAISS-Vector_Search-orange?style=flat-square&logoColor=white" />
  <img src="https://img.shields.io/badge/LangChain-RAG_Pipeline-1c3144?style=flat-square&logoColor=white" />
  <img src="https://img.shields.io/badge/SQLite-Persistence-003b57?style=flat-square&logo=sqlite&logoColor=white" />
</p>

</div>

---

## Overview

DocuMind AI allows users to upload PDF documents and ask natural language questions against their contents. The system retrieves relevant passages using vector similarity search and generates grounded answers using Groq's LLaMA 3.3 70B model — with exact page number citations and optional live web search augmentation.

The project is structured as a decoupled full-stack application: a FastAPI backend handling all RAG logic and a React frontend delivering a Perplexity-style conversational interface. Chat sessions and message history are persisted in SQLite so conversations survive server restarts.

---

## Features

- **Multi-document RAG** — upload and query multiple PDFs simultaneously within a single session
- **Page-level citations** — every answer references the exact source page numbers from the original PDF
- **Persistent sessions** — named chat sessions stored in SQLite; history is retained across restarts
- **Web search augmentation** — optional DuckDuckGo integration supplements document answers with live results
- **Balanced retrieval** — FAISS search distributes retrieval fairly across all uploaded documents, preventing any single file from dominating results
- **Conversational memory** — six-turn context window maintains coherent multi-turn dialogue
- **Typewriter streaming** — answers render progressively in the UI, consistent with modern AI chat interfaces
- **Drag-and-drop upload** — PDFs uploaded directly from the chat sidebar with live indexing progress
- **REST API** — fully documented FastAPI backend with Swagger UI available at `/docs`

---

## Architecture

```
React Frontend (Vite + Tailwind + Framer Motion)
        |
        | HTTP REST via Axios
        |
FastAPI Backend
        |
        |-- PyPDF          PDF parsing with page-level text extraction
        |-- LangChain      Document chunking (350 tokens, 15% overlap)
        |-- HuggingFace    Sentence embeddings (all-MiniLM-L6-v2)
        |-- FAISS          In-memory vector index and similarity search
        |-- Groq           LLaMA 3.3 70B inference
        |-- DuckDuckGo     Optional web search augmentation
        |-- SQLite         Session and message persistence
```

**RAG Pipeline**

```
PDF Upload
  → Text extraction per page (PyPDF)
  → Recursive character chunking (LangChain, 350 tokens)
  → Sentence embedding (MiniLM-L6-v2, 384 dimensions)
  → FAISS index (cosine similarity, per-document balanced retrieval)

Query
  → Embed query
  → Balanced search across all documents (4 chunks per PDF)
  → Assemble context with source and relevance metadata
  → Prompt construction with 6-turn conversation history
  → Groq LLaMA 3.3 70B inference
  → Response with page citations and source attribution
```

---

## Tech Stack

**Frontend**

| Technology | Purpose |
|---|---|
| React 18 + Vite | UI framework and build tooling |
| Tailwind CSS | Utility-first styling, dark glassmorphism theme |
| Framer Motion | Message animations, sidebar transitions, typewriter effect |
| Zustand | Lightweight global state management |
| React Markdown | Markdown and table rendering in chat responses |
| React Dropzone | Drag-and-drop PDF upload interface |
| Axios | HTTP client with interceptors and error handling |

**Backend**

| Technology | Purpose |
|---|---|
| FastAPI | Async REST API with automatic OpenAPI documentation |
| LangChain | Document chunking and RAG orchestration |
| FAISS (CPU) | Vector store for embedding similarity search |
| HuggingFace Transformers | `sentence-transformers/all-MiniLM-L6-v2` embeddings |
| Groq API | LLaMA 3.3 70B inference — free tier, no billing required |
| PyPDF | PDF parsing with page-level text extraction |
| DuckDuckGo Search | Zero-cost web augmentation |
| SQLite | Session and message persistence |

---

## Project Structure

```
DocuMind-AI/
│
├── backend/
│   ├── main.py                 FastAPI application — all RAG logic
│   ├── requirements.txt        Python dependencies
│   ├── Dockerfile              Container definition
│   ├── railway.toml            Railway deployment configuration
│   ├── Procfile                Process definition for PaaS platforms
│   └── .env.example            Environment variable template
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx             Root component and layout
│   │   ├── main.jsx            React entry point
│   │   ├── index.css           Global styles and Tailwind directives
│   │   ├── components/
│   │   │   ├── Sidebar.jsx     Session management, PDF upload, settings
│   │   │   ├── ChatArea.jsx    Primary chat interface and input
│   │   │   ├── Message.jsx     Message rendering, citations, web results
│   │   │   └── WelcomeScreen.jsx   Empty state and feature overview
│   │   └── lib/
│   │       ├── api.js          Axios API client
│   │       └── store.js        Zustand global state store
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── vercel.json             Vercel deployment configuration
│   └── .env.example            Environment variable template
│
├── docker-compose.yml          Full-stack local deployment
├── .gitignore
└── README.md
```

---

## Local Setup

**Prerequisites:** Python 3.10+, Node.js 18+, free Groq API key from [console.groq.com](https://console.groq.com)

**Backend**

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
source venv/bin/activate       # Mac / Linux
pip install -r requirements.txt
cp .env.example .env           # add GROQ_API_KEY
uvicorn main:app --reload --port 8000
```

**Frontend**

```bash
cd frontend
npm install
cp .env.example .env.local     # VITE_API_URL=http://localhost:8000
npm run dev
```

Frontend: `http://localhost:3000`  
Backend API docs: `http://localhost:8000/docs`

---

## Key Design Decisions

**Groq over OpenAI / Gemini** — Free tier with no billing, significantly faster inference, and sufficient context window for multi-document RAG at this scale.

**FAISS over ChromaDB** — In-memory operation with no external server process, simpler dependency surface, and adequate performance for document-scale workloads.

**Balanced per-document retrieval** — Standard top-k FAISS search allows larger documents to dominate results. The custom retrieval strategy enforces equal chunk allocation per PDF, ensuring multi-document comparisons are factually grounded across all sources.

**Page-level extraction** — Text is extracted and indexed with page metadata at ingestion time, enabling citations to reference exact source pages rather than approximate locations.

**FastAPI + React over Streamlit** — Proper REST API separation allows the frontend to be replaced or extended independently, and reflects production engineering practice more accurately for portfolio and hiring purposes.

**SQLite over PostgreSQL** — Zero-configuration persistence appropriate for single-instance deployment. Session and message data volumes at this scale do not justify an external database service.

---

## Author

**Om Kadam**  
B.Tech — Artificial Intelligence & Data Science, Sanjivani University

