from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models import User, Attendance, Assignment, Subject, Mark


def predict_attendance_risk(student_id: int, db: Session) -> Dict[str, Any]:
    """
    Model 1: Attendance Risk Prediction
    Inputs: Attendance percentage, absence patterns, assignment completion rate, study behaviour.
    Outputs: Risk % (0.0 to 100.0), reasons (List[str]), recommendations (List[str]).
    """
    # 1. Fetch student's attendance records
    attendance_records = db.query(Attendance).filter(Attendance.user_id == student_id).all()
    total_classes = len(attendance_records)
    
    if total_classes == 0:
        # Default fallback if no records yet
        return {
            "risk_percentage": 10.0,
            "reasons": ["No attendance data logged yet."],
            "recommendations": ["Ensure you attend classes regularly from day one."]
        }
    
    present_classes = sum(1 for r in attendance_records if r.status in ["present", "late"])
    attendance_pct = (present_classes / total_classes) * 100.0
    
    # Analyze consecutive absence pattern (last 5 records)
    recent_absences = sum(1 for r in attendance_records[-5:] if r.status == "absent")
    
    # 2. Fetch assignment completion rate
    assignments = db.query(Assignment).filter(Assignment.user_id == student_id).all()
    total_assignments = len(assignments)
    completed_assignments = sum(1 for a in assignments if a.status == "done")
    assignment_completion_rate = (completed_assignments / total_assignments * 100.0) if total_assignments > 0 else 90.0
    
    # 3. Compute Risk Score
    # Lower attendance -> higher risk. Below 75% attendance triggers massive risk boost.
    attendance_weight = 60
    assignment_weight = 30
    recent_absence_weight = 10
    
    attendance_factor = max(0, 100.0 - attendance_pct)
    assignment_factor = max(0, 100.0 - assignment_completion_rate)
    recent_absence_factor = (recent_absences / 5.0) * 100.0
    
    risk_score = (
        (attendance_factor * (attendance_weight / 100.0)) +
        (assignment_factor * (assignment_weight / 100.0)) +
        (recent_absence_factor * (recent_absence_weight / 100.0))
    )
    
    # If attendance is under 75% threshold, enforce high risk
    if attendance_pct < 75.0:
        risk_score = max(risk_score, 65.0 + (75.0 - attendance_pct) * 1.4)
        
    risk_score = round(min(100.0, max(0.0, risk_score)), 1)
    
    # Determine reasons and recommendations
    reasons = []
    recommendations = []
    
    if attendance_pct < 75.0:
        reasons.append(f"Attendance is at {round(attendance_pct, 1)}%, which is below the mandatory 75% threshold.")
        recommendations.append("Prioritize attending tomorrow's lectures to avoid exam disqualification.")
    elif attendance_pct < 85.0:
        reasons.append(f"Attendance is borderline at {round(attendance_pct, 1)}%.")
        recommendations.append("Try not to miss any more classes to keep your attendance in the safe zone.")
        
    if recent_absences >= 2:
        reasons.append(f"Detected a recent pattern of absence ({recent_absences} absences in the last 5 days).")
        recommendations.append("Connect with your faculty advisors to request makeup sheets for missed lectures.")
        
    if assignment_completion_rate < 80.0:
        reasons.append(f"Low assignment submission rate ({round(assignment_completion_rate, 1)}% completed).")
        recommendations.append("Dedicate study hours tonight to complete and submit outstanding assignments.")
        
    if not reasons:
        reasons.append("Academic status and attendance metrics look excellent.")
        recommendations.append("Maintain your current study routine and stay engaged in class discussions.")
        
    confidence = 0.95 if total_classes >= 10 else 0.70
    explanation = f"Calculated with {confidence * 100}% confidence based on {total_classes} logged attendance classes and assignment submission trends."
        
    return {
        "risk_percentage": risk_score,
        "reasons": reasons,
        "recommendations": recommendations,
        "confidence": confidence,
        "explanation": explanation
    }


def predict_performance(student_id: int, db: Session) -> Dict[str, Any]:
    """
    Model 2: Performance Prediction
    Predicts: Expected Grade, Expected CGPA, Expected Semester Marks %, Backlog Risk
    """
    # Fetch all marks for student
    marks_records = db.query(Mark).filter(Mark.user_id == student_id).all()
    
    # Base calculation using actual grades or falling back to a realistic estimate
    if not marks_records:
        # Default fallback for new students
        return {
            "expected_cgpa": 7.5,
            "expected_grade": "B (Good)",
            "expected_percentage": 75.0,
            "confidence": 0.50,
            "explanation": "No marks records exist yet. Prediction uses baseline university student statistics.",
            "backlog_prediction": {
                "risk": "Low",
                "probability": 10.0,
                "explanation": "Standard student parameters suggest low initial backlog risk."
            }
        }
    
    # Calculate current average percentage across all registered subjects
    total_pct = sum(m.percentage for m in marks_records if m.percentage is not None)
    avg_pct = total_pct / len(marks_records) if len(marks_records) > 0 else 75.0
    
    # Attendance adjustment
    attendance_records = db.query(Attendance).filter(Attendance.user_id == student_id).all()
    if attendance_records:
        present = sum(1 for r in attendance_records if r.status in ["present", "late"])
        att_pct = (present / len(attendance_records)) * 100.0
        # High attendance boosts prediction; low attendance dampens it
        performance_factor = (avg_pct * 0.85) + (att_pct * 0.15)
    else:
        performance_factor = avg_pct
        
    expected_pct = min(100.0, max(0.0, round(performance_factor, 1)))
    
    # Expected CGPA mapping (simple 10-point scale conversion)
    expected_cgpa = round((expected_pct / 10.0), 2)
    
    # Grade Mapping
    if expected_pct >= 90.0:
        expected_grade = "O (Outstanding)"
    elif expected_pct >= 80.0:
        expected_grade = "A+ (Excellent)"
    elif expected_pct >= 70.0:
        expected_grade = "A (Very Good)"
    elif expected_pct >= 60.0:
        expected_grade = "B (Good)"
    elif expected_pct >= 50.0:
        expected_grade = "C (Pass)"
    else:
        expected_grade = "F (Fail)"
        
    confidence = 0.90 if len(marks_records) >= 3 else 0.65
    explanation = f"Estimated with {confidence * 100}% confidence from {len(marks_records)} logged exam and class components."
    
    has_f_grades = any(m.grade == "F" or (m.percentage is not None and m.percentage < 50.0) for m in marks_records)
    backlog_pct = 85.0 if has_f_grades else max(5.0, 100.0 - expected_pct * 1.1)
    backlog_prediction = {
        "risk": "High" if backlog_pct > 50.0 else "Low",
        "probability": round(backlog_pct, 1),
        "explanation": "High backlog probability detected due to failing grades or low cumulative mark predictions." if backlog_pct > 50.0 else "Low backlog probability based on consistent passing performances."
    }
        
    return {
        "expected_cgpa": expected_cgpa,
        "expected_grade": expected_grade,
        "expected_percentage": expected_pct,
        "confidence": confidence,
        "explanation": explanation,
        "backlog_prediction": backlog_prediction
    }


def predict_study_recommendation(student_id: int, db: Session) -> Dict[str, Any]:
    """
    Model 3: Study Recommendation Engine
    Predicts: Best Subject (highest performance), Priority order of subjects, Recommended weekly study hours.
    """
    # Fetch student's enrolled subjects
    subjects = db.query(Subject).filter(Subject.user_id == student_id).all()
    if not subjects:
        return {
            "best_subject": "N/A",
            "priority_order": [],
            "recommendations": []
        }
        
    subject_marks = db.query(Mark).filter(Mark.user_id == student_id).all()
    marks_map = {m.subject_id: m.percentage for m in subject_marks if m.percentage is not None}
    
    # Compute a prioritization score for each subject
    # Higher priority score means they need to study it MORE.
    # Prioritize subjects with lower marks and lower attendance.
    priority_list = []
    
    for sub in subjects:
        # Get attendance percentage for this specific subject
        sub_attendance = db.query(Attendance).filter(
            Attendance.user_id == student_id,
            Attendance.subject_id == sub.id
        ).all()
        
        if sub_attendance:
            present = sum(1 for r in sub_attendance if r.status in ["present", "late"])
            att_pct = (present / len(sub_attendance)) * 100.0
        else:
            att_pct = 80.0  # fallback
            
        mark_pct = marks_map.get(sub.id, 70.0)
        
        # Priority score = (100 - marks_pct) * 0.6 + (100 - att_pct) * 0.4
        priority_score = (100.0 - mark_pct) * 0.6 + (100.0 - att_pct) * 0.4
        
        priority_list.append({
            "subject_id": sub.id,
            "subject_name": sub.name,
            "subject_code": sub.code,
            "priority_score": priority_score,
            "mark_pct": mark_pct,
            "att_pct": att_pct
        })
        
    # Sort subjects by priority score descending (highest need first)
    priority_list.sort(key=lambda x: x["priority_score"], reverse=True)
    
    # Best subject is the one with highest mark
    best_sub_item = min(priority_list, key=lambda x: x["priority_score"]) if priority_list else None
    best_subject = best_sub_item["subject_name"] if best_sub_item else "None"
    
    # Calculate recommended hours (we distribute 20 total study hours per week based on priority)
    total_study_hours = 20.0
    total_priority_points = sum(item["priority_score"] for item in priority_list)
    
    recommendations = []
    for item in priority_list:
        # Allocate hours relative to priority score, minimum 1.5 hours
        allocated_hours = 1.5 + (item["priority_score"] / max(1, total_priority_points)) * (total_study_hours - 1.5 * len(priority_list))
        allocated_hours = round(max(1.5, min(8.0, allocated_hours)), 1)
        
        recommendations.append({
            "subject_name": item["subject_name"],
            "subject_code": item["subject_code"],
            "recommended_hours_per_week": allocated_hours,
            "focus_areas": "Review notes, solve past assignments" if item["priority_score"] > 30 else "Practice problem sets, read advanced material"
        })
        
    return {
        "best_subject": best_subject,
        "priority_order": [item["subject_name"] for item in priority_list],
        "recommendations": recommendations
    }
