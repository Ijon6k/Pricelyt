import os
from fastapi import FastAPI

WORKER_ID = os.getenv("WORKER_ID", "unknown")

app = FastAPI()

@app.get("/hello")
def hello():
    return {
        "worker": WORKER_ID,
        "message": f"Hello world from worker {WORKER_ID}"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
