from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
import os
from typing import Optional

app = FastAPI()

# Allow CORS for local frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/upload_resume/")
async def upload_resume(file: UploadFile = File(...)):
    file_location = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_location, "wb") as f:
        f.write(await file.read())
    # TODO: Parse file and extract text/keywords
    return {"filename": file.filename, "message": "File uploaded successfully."}

@app.post("/generate_resume/")
async def generate_resume(
    resume_filename: str = Form(...),
    job_description: str = Form(...)
):
    # TODO: Parse resume file, extract keywords, extract job description keywords
    # TODO: Call Gemini API to generate ATS resume
    # TODO: Convert AI response to PDF/Word and return file path
    return {"message": "Resume generation not implemented yet."}