import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import ChatSession, ChatMessage, Note, Subject, Assignment, Attendance, TimetableEntry, Announcement, Mark, UserRole, User
from app.schemas import ChatRequest, ChatResponse, SummarizeRequest, SummarizeResponse, QuizRequest, QuizResponse
from app.dependencies import get_current_user
from app.services.ai_client import get_ai_provider
from app.services.rag_pipeline import retrieve_relevant_chunks_vector, build_grounding_prompt
from app.services.ml_models import predict_attendance_risk, predict_performance, predict_study_recommendation
from typing import List

router = APIRouter(prefix="/assistant", tags=["assistant"])


@router.post("/chat", response_model=ChatResponse)
async def chat(
    chat_data: ChatRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = int(current_user["user_id"])
    role = current_user["role"]
    
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
    
    # 1. Retrieve RAG embedding chunks
    relevant_chunks = []
    try:
        relevant_chunks = await retrieve_relevant_chunks_vector(chat_data.message, user_id, db, top_k=5)
    except Exception as e:
        print(f"RAG vector search failure: {e}")
        
    # 2. Gather student academic context
    academic_context = {}
    if role == UserRole.STUDENT:
        # Subjects
        from app.models import StudentSubject
        student_subjects = db.query(StudentSubject.subject_id).filter(StudentSubject.student_id == user_id).all()
        subject_ids = [s[0] for s in student_subjects]
        subjects = db.query(Subject).filter(Subject.id.in_(subject_ids)).all()
        sub_list = [{
            "id": s.id,
            "name": s.name,
            "code": s.code,
            "faculty_name": s.faculty_name,
            "credits": s.credits,
            "classroom": s.classroom
        } for s in subjects]

        # Assignments
        assignments = db.query(Assignment).filter(Assignment.user_id == user_id).all()
        asg_list = [{
            "title": a.title,
            "description": a.description,
            "due_date": str(a.due_date),
            "status": a.status,
            "max_marks": a.max_marks,
            "marks_obtained": a.marks_obtained
        } for a in assignments]
        
        # Attendance
        attendance = db.query(Attendance).filter(Attendance.user_id == user_id).all()
        att_list = [{
            "subject_id": att.subject_id,
            "date": str(att.date),
            "status": att.status
        } for att in attendance]
        
        # Timetable
        timetable = db.query(TimetableEntry).filter(TimetableEntry.subject_id.in_(subject_ids)).all()
        tt_list = [{
            "subject_name": tt.subject.name,
            "day": tt.day_of_week,
            "start": tt.start_time,
            "end": tt.end_time,
            "location": tt.location
        } for tt in timetable]
        
        # Marks
        marks = db.query(Mark).filter(Mark.user_id == user_id).all()
        marks_list = [{
            "subject_name": m.subject.name,
            "quiz": m.quiz,
            "assignment": m.assignment,
            "lab": m.lab,
            "internal": m.internal,
            "mid_exam": m.mid_exam,
            "practical": m.practical,
            "final": m.final,
            "total": m.total,
            "percentage": m.percentage,
            "grade": m.grade
        } for m in marks]
        
        # Announcements
        announcements = db.query(Announcement).filter(Announcement.subject_id.in_(subject_ids)).all()
        ann_list = [{
            "title": ann.title,
            "content": ann.content,
            "created_at": str(ann.created_at)
        } for ann in announcements]
        
        # ML recommendations
        ml_risk = predict_attendance_risk(user_id, db)
        ml_perf = predict_performance(user_id, db)
        ml_study = predict_study_recommendation(user_id, db)
        
        academic_context = {
            "student_name": current_user["name"],
            "role": "STUDENT",
            "subjects": sub_list[:5], # Limit to 5 subjects to save tokens
            "assignments": asg_list[-5:], 
            "attendance_summary_provided_in_ml_predictions": True,
            "timetable": tt_list[:5], # Limit to 5
            "marks": marks_list[:5], # Limit to 5
            "announcements": ann_list[-5:], 
            "ml_predictions": {
                "attendance_risk": ml_risk,
                "performance": ml_perf,
                "study_recommendation": {
                    "best_subject": ml_study.get("best_subject"),
                    "priority_order": ml_study.get("priority_order", [])[:5],
                    "recommendations": ml_study.get("recommendations", [])[:3]
                }
            }
        }
    elif role == UserRole.TEACHER:
        # Subjects taught
        subjects_taught = db.query(Subject).filter(Subject.teacher_id == user_id).all()
        sub_list = [{
            "id": s.id,
            "name": s.name,
            "code": s.code,
            "classroom": s.classroom
        } for s in subjects_taught]

        # Student roster
        roster_students = db.query(User).filter(
            User.role == UserRole.STUDENT,
            User.subjects.any(Subject.teacher_id == user_id)
        ).all()
        student_list = [{
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "roll_number": u.roll_number,
            "department": u.department
        } for u in roster_students]

        # Timetable entries
        timetable_entries = db.query(TimetableEntry).join(Subject).filter(Subject.teacher_id == user_id).all()
        tt_list = [{
            "subject_name": tt.subject.name,
            "day": tt.day_of_week,
            "start": tt.start_time,
            "end": tt.end_time
        } for tt in timetable_entries]

        # Assignments pending evaluations
        assignments_pending = db.query(Assignment).join(Subject).filter(
            Subject.teacher_id == user_id,
            Assignment.status == "in_progress"
        ).all()
        asg_list = [{
            "title": a.title,
            "student_name": a.user.name,
            "due_date": str(a.due_date)
        } for a in assignments_pending]

        academic_context = {
            "teacher_name": current_user["name"],
            "role": "TEACHER",
            "subjects_taught": sub_list[:5],
            "roster_students": student_list[:5],
            "timetable": tt_list[:5],
            "pending_evaluations": asg_list[:5]
        }
    
    # 3. Build grounded prompt including retrieved metadata
    note_context_str = ""
    if relevant_chunks:
        note_context_str = "\n".join([
            f"[Note Source: {c['note_title']}] {c['chunk'].content}" for c in relevant_chunks
        ])
        
    context_payload = {
        "user_role": role,
        "academic_profile": academic_context,
        "notes_embeddings_context": note_context_str
    }
    
    prompt = f"""
You are the StudentOS Academic AI Assistant. You must answer the user's question using the grounded academic profile and notes data provided below.
If the information is not present in the context, look for it in the student's records or politely state that you cannot find it.
Never answer directly using pre-trained knowledge if the context provides the answer.

Academic Data Context:
{json.dumps(context_payload, indent=2)}

User Question: {chat_data.message}

Answer:"""
    
    try:
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
    
    citations = [{"note_id": c["note_id"], "note_title": c["note_title"]} for c in relevant_chunks] if relevant_chunks else []
    
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
    role = current_user["role"]
    
    # Verify access to subject
    subject_query = db.query(Subject).filter(Subject.id == summary_data.subject_id)
    if role == UserRole.STUDENT:
        from app.models import StudentSubject
        subject_query = subject_query.join(StudentSubject, Subject.id == StudentSubject.subject_id).filter(StudentSubject.student_id == user_id)
    elif role == UserRole.TEACHER:
        subject_query = subject_query.filter(Subject.teacher_id == user_id)
        
    subject = subject_query.first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found or access denied")
    
    # Get notes
    notes = db.query(Note).filter(Note.subject_id == summary_data.subject_id).all()
    if not notes:
        raise HTTPException(status_code=400, detail="No notes found for this subject")
    
    combined_content = "\n\n".join([f"{note.title}\n{note.content}" for note in notes])
    prompt = f"Summarize the following academic notes for the course '{subject.name}' ({subject.code}). Provide a clear, bulleted summary organized by topic.\n\nNotes Content:\n{combined_content}"
    
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
    role = current_user["role"]
    
    subject_query = db.query(Subject).filter(Subject.id == quiz_data.subject_id)
    if role == UserRole.STUDENT:
        from app.models import StudentSubject
        subject_query = subject_query.join(StudentSubject, Subject.id == StudentSubject.subject_id).filter(StudentSubject.student_id == user_id)
    elif role == UserRole.TEACHER:
        subject_query = subject_query.filter(Subject.teacher_id == user_id)
        
    subject = subject_query.first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found or access denied")
    
    notes = db.query(Note).filter(Note.subject_id == quiz_data.subject_id).all()
    if not notes:
        raise HTTPException(status_code=400, detail="No notes found for this subject")
    
    combined_content = "\n\n".join([f"{note.title}\n{note.content}" for note in notes])
    topic_suffix = f" focusing on '{quiz_data.topic}'" if quiz_data.topic else ""
    prompt = f"""
Generate 5 multiple choice questions{topic_suffix} based on these academic notes for the subject '{subject.name}'.
You MUST return ONLY a valid JSON string (no markdown ticks, no extra text) with a 'questions' array.
Each question object in the array must have:
- 'question': the question text (string)
- 'options': an array of 4 choices (strings)
- 'answer': the 0-indexed correct option integer

Notes Content:
{combined_content}
"""
    
    try:
        ai_provider = get_ai_provider()
        response_text = await ai_provider.chat(prompt)
        
        # Strip markdown if present
        clean_json = response_text.strip()
        if clean_json.startswith("```json"):
            clean_json = clean_json[7:]
        if clean_json.endswith("```"):
            clean_json = clean_json[:-3]
        clean_json = clean_json.strip()
        
        quiz_data_parsed = json.loads(clean_json)
        return QuizResponse(questions=quiz_data_parsed.get("questions", []))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Quiz generation failed: {str(e)}"
        )
