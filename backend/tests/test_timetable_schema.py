from app.schemas import TimetableCreate, TimetableResponse


def test_timetable_create_accepts_extended_fields():
    payload = {
        "subject_id": 1,
        "day_of_week": 2,
        "start_time": "09:00",
        "end_time": "10:00",
        "location": "Lab 1",
        "faculty_name": "Dr. Ada",
        "building": "Block A",
        "class_type": "lab",
        "recurrence": "weekly",
        "notes": "Bring laptop",
        "is_active": True,
    }

    entry = TimetableCreate(**payload)

    assert entry.faculty_name == "Dr. Ada"
    assert entry.building == "Block A"
    assert entry.class_type == "lab"
    assert entry.recurrence == "weekly"
    assert entry.notes == "Bring laptop"
    assert entry.is_active is True


def test_timetable_response_includes_extended_fields():
    entry = TimetableResponse(
        id=1,
        subject_id=2,
        day_of_week=3,
        start_time="11:00",
        end_time="12:00",
        location="Room 204",
        faculty_name="Prof. Lin",
        building="Block B",
        class_type="lecture",
        recurrence="weekly",
        notes="Review chapters",
        is_active=True,
    )

    assert entry.faculty_name == "Prof. Lin"
    assert entry.building == "Block B"
    assert entry.class_type == "lecture"
    assert entry.recurrence == "weekly"
    assert entry.notes == "Review chapters"
    assert entry.is_active is True
