from typing import List, Optional
from sqlalchemy.orm import Session
from app.models import Note, NoteChunk
from app.services.ai_client import get_ai_provider
import re


def chunk_text(text: str, chunk_size: int = 400, overlap: int = 50) -> List[str]:
    """
    Split text into chunks with overlap for better context retrieval.
    """
    # Simple word-based chunking with overlap
    words = text.split()
    chunks = []
    
    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i:i + chunk_size])
        if chunk.strip():
            chunks.append(chunk)
    
    return chunks


async def embed_and_store(note_id: int, db: Session):
    """
    Chunk a note's content, embed each chunk, and store in note_chunks table.
    """
    from app.services.ai_client import get_embedding_provider
    
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise ValueError(f"Note {note_id} not found")
    
    # Delete existing chunks for this note
    db.query(NoteChunk).filter(NoteChunk.note_id == note_id).delete()
    
    # Chunk the content
    chunks = chunk_text(note.content)
    
    # Get AI provider (prefer Gemini for embeddings)
    ai_provider = get_embedding_provider()
    
    # Embed and store each chunk
    for i, chunk_content in enumerate(chunks):
        try:
            embedding = await ai_provider.embed(chunk_content)
            
            note_chunk = NoteChunk(
                note_id=note_id,
                chunk_index=i,
                content=chunk_content,
                embedding=embedding
            )
            db.add(note_chunk)
        except Exception as e:
            print(f"Failed to embed chunk {i} for note {note_id}: {e}")
            # Store chunk without embedding if embedding fails
            note_chunk = NoteChunk(
                note_id=note_id,
                chunk_index=i,
                content=chunk_content,
                embedding=None
            )
            db.add(note_chunk)
    
    db.commit()


import math
from app.models import User, UserRole, Subject

def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    if not v1 or not v2 or len(v1) != len(v2):
        return 0.0
    dot_product = sum(a * b for a, b in zip(v1, v2))
    magnitude_v1 = math.sqrt(sum(a * a for a in v1))
    magnitude_v2 = math.sqrt(sum(a * a for a in v2))
    if magnitude_v1 == 0.0 or magnitude_v2 == 0.0:
        return 0.0
    return dot_product / (magnitude_v1 * magnitude_v2)


async def retrieve_relevant_chunks(query: str, user_id: int, db: Session, top_k: int = 5) -> List[dict]:
    """
    Retrieve the most relevant chunks for a query using keyword overlap search (text fallback).
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return []
        
    if user.role == UserRole.STUDENT:
        # Enrolled subjects notes only
        from app.models import StudentSubject
        student_subjects = db.query(StudentSubject.subject_id).filter(StudentSubject.student_id == user_id).all()
        subject_ids = [s[0] for s in student_subjects]
        chunks = db.query(NoteChunk).join(Note).filter(Note.subject_id.in_(subject_ids)).all()
    else:
        # Teacher: own notes
        chunks = db.query(NoteChunk).join(Note).filter(Note.user_id == user_id).all()
        
    if not chunks:
        return []
    
    query_words = set(query.lower().split())
    scored_chunks = []
    
    for chunk in chunks:
        chunk_words = set(chunk.content.lower().split())
        overlap = len(query_words & chunk_words)
        if overlap > 0:
            scored_chunks.append({
                "chunk": chunk,
                "score": overlap,
                "note_id": chunk.note_id,
                "note_title": chunk.note.title if chunk.note else "Unknown"
            })
    
    scored_chunks.sort(key=lambda x: x["score"], reverse=True)
    return scored_chunks[:top_k]


async def retrieve_relevant_chunks_vector(query: str, user_id: int, db: Session, top_k: int = 5) -> List[dict]:
    """
    Vector-based retrieval using Cosine Similarity on float array embeddings.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return []

    try:
        ai_provider = get_ai_provider()
        query_embedding = await ai_provider.embed(query)
    except Exception as e:
        print(f"Failed to generate query embedding, falling back to text search: {e}")
        return await retrieve_relevant_chunks(query, user_id, db, top_k)

    if user.role == UserRole.STUDENT:
        from app.models import StudentSubject
        student_subjects = db.query(StudentSubject.subject_id).filter(StudentSubject.student_id == user_id).all()
        subject_ids = [s[0] for s in student_subjects]
        chunks = db.query(NoteChunk).join(Note).filter(Note.subject_id.in_(subject_ids)).all()
    else:
        chunks = db.query(NoteChunk).join(Note).filter(Note.user_id == user_id).all()

    if not chunks:
        return []

    scored_chunks = []
    for chunk in chunks:
        if chunk.embedding:
            sim = cosine_similarity(query_embedding, chunk.embedding)
            scored_chunks.append({
                "chunk": chunk,
                "score": sim,
                "note_id": chunk.note_id,
                "note_title": chunk.note.title if chunk.note else "Unknown"
            })
        else:
            scored_chunks.append({
                "chunk": chunk,
                "score": 0.0,
                "note_id": chunk.note_id,
                "note_title": chunk.note.title if chunk.note else "Unknown"
            })

    scored_chunks.sort(key=lambda x: x["score"], reverse=True)
    return scored_chunks[:top_k]


def build_grounding_prompt(query: str, relevant_chunks: List[dict]) -> str:
    """
    Build a prompt that includes the retrieved context for grounded responses.
    """
    if not relevant_chunks:
        return query
    
    context_parts = []
    for i, chunk_data in enumerate(relevant_chunks, 1):
        context_parts.append(
            f"[Source {i}: {chunk_data['note_title']}]\n{chunk_data['chunk'].content}"
        )
    
    context = "\n\n".join(context_parts)
    
    prompt = f"""Based on the following context from your notes, answer the question. If the context doesn't contain relevant information, say so clearly.
 
Context:
{context}
 
Question: {query}
 
Answer:"""
    
    return prompt
