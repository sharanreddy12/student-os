import sys
import os
import asyncio

sys.path.append(os.path.dirname(__file__))

from app.database import SessionLocal
from app.models import Note, NoteChunk
from app.services.rag_pipeline import embed_and_store

async def embed_all_notes():
    """Generate embeddings for all notes in the database"""
    db = SessionLocal()
    try:
        print("--- EMBEDDING ALL NOTES ---")
        
        # Get all notes
        notes = db.query(Note).all()
        print(f"Found {len(notes)} notes to embed")
        
        # Clear existing chunks
        db.query(NoteChunk).delete()
        db.commit()
        print("Cleared existing chunks")
        
        # Embed each note
        success_count = 0
        error_count = 0
        
        for note in notes:
            try:
                await embed_and_store(note.id, db)
                success_count += 1
                print(f"✓ Embedded note {note.id}: {note.title}")
            except Exception as e:
                error_count += 1
                print(f"✗ Failed to embed note {note.id}: {e}")
        
        print(f"\n--- EMBEDDING COMPLETE ---")
        print(f"Success: {success_count}")
        print(f"Errors: {error_count}")
        print(f"Total: {len(notes)}")
        
    except Exception as e:
        print(f"Error during embedding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(embed_all_notes())
