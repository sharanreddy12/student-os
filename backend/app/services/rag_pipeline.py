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
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise ValueError(f"Note {note_id} not found")
    
    # Delete existing chunks for this note
    db.query(NoteChunk).filter(NoteChunk.note_id == note_id).delete()
    
    # Chunk the content
    chunks = chunk_text(note.content)
    
    # Get AI provider
    ai_provider = get_ai_provider()
    
    # Embed and store each chunk
    for i, chunk_text in enumerate(chunks):
        try:
            embedding = await ai_provider.embed(chunk_text)
            
            note_chunk = NoteChunk(
                note_id=note_id,
                chunk_index=i,
                content=chunk_text,
                embedding=embedding
            )
            db.add(note_chunk)
        except Exception as e:
            print(f"Failed to embed chunk {i} for note {note_id}: {e}")
            # Store chunk without embedding if embedding fails
            note_chunk = NoteChunk(
                note_id=note_id,
                chunk_index=i,
                content=chunk_text,
                embedding=None
            )
            db.add(note_chunk)
    
    db.commit()


async def retrieve_relevant_chunks(query: str, user_id: int, db: Session, top_k: int = 5) -> List[dict]:
    """
    Retrieve the most relevant chunks for a query using cosine similarity.
    Currently uses a simple text matching fallback since pgvector isn't fully set up.
    """
    # Get all chunks for the user's notes
    chunks = db.query(NoteChunk).join(Note).filter(
        Note.user_id == user_id
    ).all()
    
    if not chunks:
        return []
    
    # Simple keyword matching as fallback
    query_words = set(query.lower().split())
    scored_chunks = []
    
    for chunk in chunks:
        chunk_words = set(chunk.content.lower().split())
        # Calculate simple overlap score
        overlap = len(query_words & chunk_words)
        if overlap > 0:
            scored_chunks.append({
                "chunk": chunk,
                "score": overlap,
                "note_id": chunk.note_id,
                "note_title": chunk.note.title if chunk.note else "Unknown"
            })
    
    # Sort by score and return top_k
    scored_chunks.sort(key=lambda x: x["score"], reverse=True)
    return scored_chunks[:top_k]


async def retrieve_relevant_chunks_vector(query: str, user_id: int, db: Session, top_k: int = 5) -> List[dict]:
    """
    Vector-based retrieval using pgvector (to be implemented when pgvector is fully configured).
    This is a placeholder for the full vector similarity search.
    """
    # TODO: Implement proper pgvector cosine similarity search
    # For now, use the text-based fallback
    return await retrieve_relevant_chunks(query, user_id, db, top_k)


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
