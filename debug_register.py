import traceback
import json
import sys
from app.database import engine, SessionLocal
from app.models import User
from app.auth import get_password_hash
from sqlalchemy import text

def log(msg):
    print(msg)
    sys.stdout.flush()

# Step 1: Check database tables
log("=" * 60)
log("STEP 1: Checking database tables")
log("=" * 60)
try:
    conn = engine.connect()
    result = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema='public'"))
    tables = [row[0] for row in result]
    log(f"Tables in database: {tables}")
    conn.close()
except Exception as e:
    log(f"ERROR checking tables: {e}")
    traceback.print_exc()

# Step 2: Check if users table columns match the model
log("\n" + "=" * 60)
log("STEP 2: Checking users table columns")
log("=" * 60)
try:
    conn = engine.connect()
    result = conn.execute(text("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name='users'"))
    for row in result:
        log(f"  {row[0]}: {row[1]} (nullable={row[2]})")
    conn.close()
except Exception as e:
    log(f"ERROR checking columns: {e}")
    traceback.print_exc()

# Step 3: Try to manually create a user via SQLAlchemy
log("\n" + "=" * 60)
log("STEP 3: Attempting user registration via SQLAlchemy")
log("=" * 60)
db = SessionLocal()
try:
    hashed_pw = get_password_hash("sharan@1230")
    log(f"Password hash generated: {hashed_pw[:20]}...")
    
    new_user = User(
        student_id="tu1",
        name="sharan",
        email="durgamsharan@gmail.com",
        hashed_password=hashed_pw
    )
    log(f"User object created: student_id={new_user.student_id}, name={new_user.name}, email={new_user.email}")
    
    db.add(new_user)
    db.flush()
    log(f"Flush succeeded, user id: {new_user.id}")
    
    db.commit()
    log(f"Commit succeeded!")
    
    db.refresh(new_user)
    log(f"Refresh succeeded: id={new_user.id}, created_at={new_user.created_at}")
    
except Exception as e:
    db.rollback()
    log(f"ERROR during registration: {e}")
    traceback.print_exc()
finally:
    db.close()

# Step 4: Now try the actual POST endpoint
log("\n" + "=" * 60)
log("STEP 4: Testing POST /api/v1/auth/register endpoint")
log("=" * 60)
try:
    import urllib.request
    url = "http://localhost:8000/api/v1/auth/register"
    data = json.dumps({
        "student_id": "tu2",
        "name": "sharan",
        "email": "sharan2@gmail.com",
        "password": "sharan@1230"
    }).encode()
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    resp = urllib.request.urlopen(req)
    log(f"Status: {resp.status}")
    log(f"Response: {resp.read().decode()}")
except urllib.error.HTTPError as e:
    log(f"HTTP Error {e.code}: {e.read().decode()}")
except Exception as e:
    log(f"Error: {e}")
    traceback.print_exc()