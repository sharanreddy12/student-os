"""
Script to start both backend and frontend servers.
Run this with: python start_servers.py
"""
import subprocess
import sys
import os
import time
import signal

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(BASE_DIR, "backend")
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")

processes = []

def start_backend():
    print("Starting backend server on port 8000...")
    proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"],
        cwd=BACKEND_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )
    processes.append(proc)
    return proc

def start_frontend():
    print("Starting frontend server on port 5173...")
    proc = subprocess.Popen(
        ["npm", "run", "dev"],
        cwd=FRONTEND_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )
    processes.append(proc)
    return proc

def print_output(proc, name):
    for line in iter(proc.stdout.readline, ''):
        if line:
            print(f"[{name}] {line.rstrip()}")

if __name__ == "__main__":
    print("=" * 60)
    print("Starting StudentOS Servers")
    print("=" * 60)
    
    backend = start_backend()
    time.sleep(2)
    frontend = start_frontend()
    
    print("\n" + "=" * 60)
    print("Servers are starting up...")
    print(f"  Backend:  http://localhost:8000")
    print(f"  Frontend: http://localhost:5173")
    print(f"  API Docs: http://localhost:8000/docs")
    print("=" * 60)
    print("\nPress Ctrl+C to stop both servers.\n")
    
    try:
        # Print output from both processes
        while True:
            line_b = backend.stdout.readline()
            if line_b:
                print(f"[Backend] {line_b.rstrip()}")
            line_f = frontend.stdout.readline()
            if line_f:
                print(f"[Frontend] {line_f.rstrip()}")
            if not line_b and not line_f:
                time.sleep(0.1)
    except KeyboardInterrupt:
        print("\nShutting down servers...")
    finally:
        for proc in processes:
            proc.terminate()
        print("Servers stopped.")