"""Run quick checks against teacher-related endpoints and save outputs.
Usage: python tools/debug_teacher_endpoints.py
"""
import sys, json, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from app.database import SessionLocal
from app.models import User, UserRole, Subject
from app.auth import create_access_token
import requests

BASE = os.environ.get('API_URL', 'http://127.0.0.1:8000')


def get_teacher_token(db):
    teacher = db.query(User).filter(User.role == UserRole.TEACHER).first()
    if not teacher:
        print('No teacher user found')
        return None
    token = create_access_token({'sub': teacher.id, 'role': str(teacher.role.value)})
    return token


def call_endpoints(token):
    headers = {'Authorization': f'Bearer {token}'} if token else {}
    endpoints = [
        ('GET', '/api/v1/analytics/teacher'),
        ('GET', '/api/v1/subjects/all'),
    ]
    results = {}
    for method, path in endpoints:
        url = BASE + path
        try:
            r = requests.request(method, url, headers=headers, timeout=10)
            results[path] = {'status_code': r.status_code, 'text': r.text}
        except Exception as e:
            results[path] = {'error': repr(e)}
    print(json.dumps(results, indent=2))


if __name__ == '__main__':
    db = SessionLocal()
    try:
        token = get_teacher_token(db)
        if token:
            print('Got teacher token')
        else:
            print('No token; calls will be unauthenticated')
        call_endpoints(token)
    finally:
        db.close()
