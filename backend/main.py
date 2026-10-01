"""
Entrypoint for ChessCure PMS Backend.
Allows running via:
  1. uvicorn main:app --reload --port 8000
  2. uvicorn app.main:app --reload --port 8000
  3. python main.py
"""

from app.main import app

if __name__ == "__main__":
    import uvicorn
    print("Starting ChessCure PMS Backend on http://127.0.0.1:8000 ...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
