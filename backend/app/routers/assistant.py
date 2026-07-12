from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import ChatSession, ChatMessage, Note, Subject
from app.schemas import ChatRequest, ChatResponse, SummarizeRequest, SummarizeResponse, QuizRequest, QuizResponse
from app.dependencies import get_current_user
from app.services.ai_client import get_ai_provider
from app.services.rag_pipeline import retrieve_relevant_chunks, build_grounding_prompt
from typing import List

router = APIRouter(prefix="/assistant", tags=["assistant"])


@router.post("/chat", response_model=ChatResponse)
async def chat(
    chat_data: ChatRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = int(current_user["user_id"])
    
    # Get or create session
    if chat_data.session_id:
        session = db.query(ChatSession).filter(
            ChatSession.id == chat_data.session_id,
            ChatSession.user_id == user_id
        ).first()
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )
    else:
        session = ChatSession(user_id=user_id)
        db.add(session)
        db.commit()
        db.refresh(session)
    
    # Store user message
    user_message = ChatMessage(
        session_id=session.id,
        role="user",
        content=chat_data.message
    )
    db.add(user_message)
    
    # Retrieve relevant chunks using RAG
    try:
        relevant_chunks = await retrieve_relevant_chunks(chat_data.message, user_id, db, top_k=5)
        
        if relevant_chunks:
            # Build grounded prompt with context
            prompt = build_grounding_prompt(chat_data.message, relevant_chunks)
            citations = [{"note_id": c["note_id"], "note_title": c["note_title"]} for c in relevant_chunks]
        else:
            # No relevant context found
            prompt = f"I couldn't find relevant information in your notes. Please answer this question generally: {chat_data.message}"
            citations = []
        
        ai_provider = get_ai_provider()
        answer = await ai_provider.chat(prompt)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI service error: {str(e)}"
        )
    
    # Store assistant message
    assistant_message = ChatMessage(
        session_id=session.id,
        role="assistant",
        content=answer
    )
    db.add(assistant_message)
    db.commit()
    
    return ChatResponse(
        session_id=session.id,
        answer=answer,
        citations=citations
    )


@router.post("/summarize", response_model=SummarizeResponse)
async def summarize(
    summary_data: SummarizeRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = int(current_user["user_id"])
    
    # Verify subject belongs to user
    subject = db.query(Subject).filter(
        Subject.id == summary_data.subject_id,
        Subject.user_id == user_id
    ).first()
    
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found"
        )
    
    # Get all notes for this subject
    notes = db.query(Note).filter(
        Note.subject_id == summary_data.subject_id,
        Note.user_id == user_id
    ).all()
    
    if not notes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No notes found for this subject"
        )
    
    # Combine all note content
    combined_content = "\n\n".join([f"{note.title}\n{note.content}" for note in notes])
    
    # Create summary prompt
    prompt = f"Summarize the following notes for the subject {subject.name}:\n\n{combined_content}"
    
    try:
        ai_provider = get_ai_provider()
        summary = await ai_provider.chat(prompt)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI service error: {str(e)}"
        )
    
    return SummarizeResponse(summary=summary)


@router.post("/quiz", response_model=QuizResponse)
async def quiz(
    quiz_data: QuizRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = int(current_user["user_id"])
    
    # Verify subject belongs to user
    subject = db.query(Subject).filter(
        Subject.id == quiz_data.subject_id,
        Subject.user_id == user_id
    ).first()
    
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found"
    )
    
    # Get all notes for this subject
    notes = db.query(Note).filter(
        Note.subject_id == quiz_data.subject_id,
        Note.user_id == user_id
    ).all()
    
    if not notes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No notes found for this subject"
        )
    
    # Combine all note content
    combined_content = "\n\n".join([f"{note.title}\n{note.content}" for note in notes])
    
    # Create quiz prompt
    topic_suffix = f" focusing on {quiz_data.topic}" if quiz_data.topic else ""
    prompt = f"Generate 5 multiple choice questions{topic_suffix} based on these notes for {subject.name}. Return JSON with 'questions' array, each having 'question', 'options' (array of 4), and 'answer' (correct option index). Notes:\n\n{combined_content}"
    
    try:
        ai_provider = get_ai_provider()
        response = await ai_provider.chat(prompt)
        # Parse the AI response as JSON
        import json
        quiz_data_parsed = json.loads(response)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI service error: {str(e)}"
        )
    
    return QuizResponse(questions=quiz_data_parsed.get("questions", []))
