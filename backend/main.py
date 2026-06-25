"""
DocuMind AI — FastAPI Backend
Handles: PDF ingestion, vector search, Groq LLM, web search, chat persistence
"""

import os
import uuid
import json
import time
from datetime import datetime
from typing import Optional
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS

from groq import Groq
from duckduckgo_search import DDGS
from dotenv import load_dotenv
import sqlite3

load_dotenv()

# ── APP SETUP ──────────────────────────────────────────────────────────────────
app = FastAPI(
    title="DocuMind AI API",
    description="Production RAG backend with Groq, FAISS, web search & persistence",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── GLOBALS ────────────────────────────────────────────────────────────────────
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

DB_PATH = "documind.db"

# In-memory session store: session_id → {vector_store, pdf_metadata, pdf_summaries}
SESSIONS: dict = {}

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

GROQ_MODEL = "llama-3.3-70b-versatile"


# ── DATABASE SETUP ─────────────────────────────────────────────────────────────
def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS chat_sessions (
            id TEXT PRIMARY KEY,
            name TEXT,
            created_at TEXT,
            updated_at TEXT
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS chat_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT,
            role TEXT,
            content TEXT,
            sources TEXT,
            page_refs TEXT,
            retrieval_mode TEXT,
            timestamp TEXT,
            FOREIGN KEY(session_id) REFERENCES chat_sessions(id)
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS uploaded_docs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT,
            filename TEXT,
            pages INTEGER,
            chunks INTEGER,
            uploaded_at TEXT
        )
    """)
    conn.commit()
    conn.close()

init_db()


# ── PYDANTIC MODELS ────────────────────────────────────────────────────────────
class QuestionRequest(BaseModel):
    session_id: str
    question: str
    search_mode: str = "all"
    selected_pdf: Optional[str] = None
    use_web_search: bool = False
    chat_history: list = []

class SessionCreateRequest(BaseModel):
    name: Optional[str] = "New Session"

class RenameSessionRequest(BaseModel):
    name: str


# ── HELPERS ────────────────────────────────────────────────────────────────────
def extract_pdf_text_with_pages(file_bytes: bytes) -> tuple[str, dict]:
    """Returns full text and page-level text dict."""
    import io
    reader = PdfReader(io.BytesIO(file_bytes))
    full_text = ""
    page_texts = {}
    for i, page in enumerate(reader.pages):
        t = page.extract_text() or ""
        full_text += t + "\n"
        page_texts[i + 1] = t
    return full_text, page_texts, len(reader.pages)


def web_search(query: str, max_results: int = 4) -> list[dict]:
    """DuckDuckGo search returning title + snippet + url."""
    try:
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=max_results))
        return [{"title": r.get("title",""), "snippet": r.get("body",""), "url": r.get("href","")} for r in results]
    except Exception:
        return []


def balanced_search(vector_store, query: str, pdf_names: list, per_pdf_k: int = 4):
    all_results = []
    for name in pdf_names:
        try:
            results = vector_store.similarity_search_with_score(
                query, k=per_pdf_k, filter={"source": name}, fetch_k=300
            )
            all_results.extend(results)
        except Exception:
            continue
    all_results.sort(key=lambda x: x[1])
    return all_results


def find_page_references(query_chunks: list[str], page_texts: dict) -> dict[str, list[int]]:
    """Match retrieved chunks back to PDF page numbers."""
    page_refs = {}
    for chunk_text, source in query_chunks:
        chunk_lower = chunk_text[:120].lower().strip()
        fname = source
        found_pages = []
        if fname in page_texts:
            for page_num, page_text in page_texts[fname].items():
                if chunk_lower[:80] in page_text.lower():
                    found_pages.append(page_num)
                    break
        if found_pages:
            page_refs.setdefault(fname, [])
            page_refs[fname].extend(found_pages)
    # Deduplicate
    return {k: sorted(set(v)) for k, v in page_refs.items()}


def save_message(session_id: str, role: str, content: str,
                 sources: list = None, page_refs: dict = None,
                 retrieval_mode: str = ""):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    ts = datetime.now().isoformat()
    c.execute("""
        INSERT INTO chat_messages (session_id, role, content, sources, page_refs, retrieval_mode, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        session_id, role, content,
        json.dumps(sources or []),
        json.dumps(page_refs or {}),
        retrieval_mode, ts
    ))
    c.execute("UPDATE chat_sessions SET updated_at=? WHERE id=?", (ts, session_id))
    conn.commit()
    conn.close()


def load_messages(session_id: str) -> list[dict]:
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        SELECT role, content, sources, page_refs, retrieval_mode, timestamp
        FROM chat_messages WHERE session_id=? ORDER BY id ASC
    """, (session_id,))
    rows = c.fetchall()
    conn.close()
    return [
        {
            "role": r[0], "content": r[1],
            "sources": json.loads(r[2] or "[]"),
            "page_refs": json.loads(r[3] or "{}"),
            "retrieval_mode": r[4], "timestamp": r[5]
        }
        for r in rows
    ]


# ── ROUTES ─────────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "DocuMind AI API v2.0 running", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "healthy", "model": GROQ_MODEL, "timestamp": datetime.now().isoformat()}


# ── SESSION MANAGEMENT ─────────────────────────────────────────────────────────

@app.post("/sessions/create")
def create_session(req: SessionCreateRequest):
    session_id = str(uuid.uuid4())
    now = datetime.now().isoformat()
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("INSERT INTO chat_sessions (id, name, created_at, updated_at) VALUES (?,?,?,?)",
              (session_id, req.name, now, now))
    conn.commit()
    conn.close()
    SESSIONS[session_id] = {"vector_store": None, "pdf_metadata": {}, "pdf_summaries": {}, "page_texts": {}}
    return {"session_id": session_id, "name": req.name}


@app.get("/sessions")
def list_sessions():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT id, name, created_at, updated_at FROM chat_sessions ORDER BY updated_at DESC")
    rows = c.fetchall()
    conn.close()
    result = []
    for r in rows:
        conn2 = sqlite3.connect(DB_PATH)
        c2 = conn2.cursor()
        c2.execute("SELECT COUNT(*) FROM chat_messages WHERE session_id=?", (r[0],))
        msg_count = c2.fetchone()[0]
        conn2.close()
        result.append({"id": r[0], "name": r[1], "created_at": r[2], "updated_at": r[3], "message_count": msg_count})
    return result


@app.get("/sessions/{session_id}/messages")
def get_messages(session_id: str):
    return load_messages(session_id)


@app.delete("/sessions/{session_id}")
def delete_session(session_id: str):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("DELETE FROM chat_messages WHERE session_id=?", (session_id,))
    c.execute("DELETE FROM uploaded_docs WHERE session_id=?", (session_id,))
    c.execute("DELETE FROM chat_sessions WHERE id=?", (session_id,))
    conn.commit()
    conn.close()
    SESSIONS.pop(session_id, None)
    return {"deleted": session_id}


@app.patch("/sessions/{session_id}/rename")
def rename_session(session_id: str, req: RenameSessionRequest):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("UPDATE chat_sessions SET name=? WHERE id=?", (req.name, session_id))
    conn.commit()
    conn.close()
    return {"session_id": session_id, "name": req.name}


# ── DOCUMENT UPLOAD & INDEXING ─────────────────────────────────────────────────

@app.post("/sessions/{session_id}/upload")
async def upload_documents(session_id: str, files: list[UploadFile] = File(...)):
    if session_id not in SESSIONS:
        SESSIONS[session_id] = {"vector_store": None, "pdf_metadata": {}, "pdf_summaries": {}, "page_texts": {}}

    all_chunks = []
    all_meta = []
    results = []
    splitter = RecursiveCharacterTextSplitter(
        separators=["\n\n", "\n", ". ", " "],
        chunk_size=350, chunk_overlap=55,
    )

    for f in files:
        content = await f.read()
        full_text, page_texts, num_pages = extract_pdf_text_with_pages(content)
        file_chunks = splitter.split_text(full_text)

        all_chunks.extend(file_chunks)
        all_meta.extend([{"source": f.filename} for _ in file_chunks])

        SESSIONS[session_id]["pdf_summaries"][f.filename] = full_text[:8000]
        SESSIONS[session_id]["pdf_metadata"][f.filename] = {"pages": num_pages, "chunks": len(file_chunks)}
        SESSIONS[session_id]["page_texts"][f.filename] = page_texts

        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("""INSERT INTO uploaded_docs (session_id, filename, pages, chunks, uploaded_at)
                     VALUES (?,?,?,?,?)""",
                  (session_id, f.filename, num_pages, len(file_chunks), datetime.now().isoformat()))
        conn.commit()
        conn.close()

        results.append({"filename": f.filename, "pages": num_pages, "chunks": len(file_chunks)})

    # Build/update FAISS
    if all_chunks:
        vs = SESSIONS[session_id]["vector_store"]
        if vs is None:
            vs = FAISS.from_texts(texts=all_chunks, embedding=embeddings, metadatas=all_meta)
        else:
            new_vs = FAISS.from_texts(texts=all_chunks, embedding=embeddings, metadatas=all_meta)
            vs.merge_from(new_vs)
        SESSIONS[session_id]["vector_store"] = vs

    return {"indexed": results, "total_chunks": len(all_chunks)}


@app.get("/sessions/{session_id}/documents")
def get_documents(session_id: str):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT filename, pages, chunks, uploaded_at FROM uploaded_docs WHERE session_id=?", (session_id,))
    rows = c.fetchall()
    conn.close()
    return [{"filename": r[0], "pages": r[1], "chunks": r[2], "uploaded_at": r[3]} for r in rows]


# ── QUESTION ANSWERING ─────────────────────────────────────────────────────────

@app.post("/ask")
def ask_question(req: QuestionRequest):
    session = SESSIONS.get(req.session_id)
    if not session or not session["vector_store"]:
        raise HTTPException(status_code=400, detail="No documents indexed for this session. Upload PDFs first.")

    vs = session["vector_store"]
    pdf_names = list(session["pdf_metadata"].keys())
    pdf_summaries = session["pdf_summaries"]
    page_texts = session["page_texts"]

    # Build conversation context
    conv_ctx = "\n".join(
        f"{m['role'].capitalize()}: {m['content']}"
        for m in req.chat_history[-6:]
    )

    # Web search if requested
    web_ctx = ""
    web_results = []
    if req.use_web_search:
        web_results = web_search(req.question)
        if web_results:
            web_ctx = "\n\nWEB SEARCH RESULTS:\n" + "\n".join(
                f"[{r['title']}] {r['snippet']} ({r['url']})"
                for r in web_results
            )

    # Retrieve context
    doc_keywords = ["all pdf","all uploaded","all documents","compare","summarize all","across documents"]
    is_doc_level = any(kw in req.question.lower() for kw in doc_keywords)

    context_blocks = []
    used_sources = set()
    retrieval_mode = "vector-search"
    retrieved_chunks = []

    if is_doc_level:
        retrieval_mode = "document-level"
        for name, summary in pdf_summaries.items():
            used_sources.add(name)
            context_blocks.append(f"[Document: {name}]\n{summary[:5000]}")
    else:
        query = f"{conv_ctx}\n\nQuestion: {req.question}"
        if req.search_mode == "all":
            docs = balanced_search(vs, query, pdf_names)
        else:
            docs = vs.similarity_search_with_score(
                query, k=10, filter={"source": req.selected_pdf}, fetch_k=300
            )
        for doc, score in docs:
            used_sources.add(doc.metadata["source"])
            relevance = round((1 - min(score, 2) / 2) * 100, 1)
            context_blocks.append(
                f"[Source: {doc.metadata['source']} | Relevance: {relevance}%]\n{doc.page_content}"
            )
            retrieved_chunks.append((doc.page_content, doc.metadata["source"]))

    # Find page references
    page_refs = find_page_references(retrieved_chunks, page_texts)

    context = "\n\n---\n\n".join(context_blocks)

    prompt = f"""You are DocuMind AI, a precise and expert document analysis assistant.

RULES:
- Answer primarily from the provided document context.
- If web search results are provided, you may supplement with them — clearly note when doing so.
- Never fabricate information. If unsure, say so.
- Use bullet points for lists. Bold key terms.
- When citing sources, mention the document name.

Available Documents: {', '.join(pdf_names)}
Retrieval Mode: {retrieval_mode}

Conversation History:
{conv_ctx if conv_ctx else "No prior conversation."}

Document Context:
{context}
{web_ctx}

User Question: {req.question}

Answer:"""

    response = groq_client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=1500,
    )
    answer = response.choices[0].message.content

    # Persist both messages
    save_message(req.session_id, "user", req.question)
    save_message(req.session_id, "assistant", answer,
                 sources=list(used_sources), page_refs=page_refs,
                 retrieval_mode=retrieval_mode)

    return {
        "answer": answer,
        "sources": list(used_sources),
        "page_refs": page_refs,
        "retrieval_mode": retrieval_mode,
        "web_results": web_results,
        "model": GROQ_MODEL,
        "timestamp": datetime.now().isoformat(),
    }
