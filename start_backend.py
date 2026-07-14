import uvicorn
import sys
import os

os.chdir(os.path.join(os.path.dirname(__file__), "backend"))
sys.path.insert(0, ".")

from app.main import app
print("Starting backend server on http://localhost:8000")
print("API docs at http://localhost:8000/docs")
uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")