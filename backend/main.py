from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
import os
from typing import Optional
from PyPDF2 import PdfReader
from docx import Document
import re
import google.generativeai as genai
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import os

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

def extract_text_from_pdf(file_path):
    text = ""
    try:
        reader = PdfReader(file_path)
        for page in reader.pages:
            text += page.extract_text() or ""
    except Exception as e:
        text = ""
    return text

def extract_text_from_docx(file_path):
    text = ""
    try:
        doc = Document(file_path)
        for para in doc.paragraphs:
            text += para.text + "\n"
    except Exception as e:
        text = ""
    return text

def extract_text_from_txt(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            return f.read()
    except Exception:
        return ""

def extract_text_from_rtf(file_path):
    try:
        import striprtf
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            return striprtf.rtf_to_text(f.read())
    except Exception:
        return ""

def extract_text_from_odt(file_path):
    try:
        from odf.opendocument import load
        from odf.text import P
        doc = load(file_path)
        paragraphs = doc.getElementsByType(P)
        return '\n'.join([str(p) for p in paragraphs])
    except Exception:
        return ""

def extract_keywords(text):
    # Simple keyword extraction: words longer than 3 chars, ignore common stopwords
    stopwords = set(["the", "and", "for", "with", "that", "this", "from", "have", "are", "was", "but", "not", "you", "your", "has", "can", "will", "all", "any", "our", "out", "who", "his", "her", "she", "him", "its", "had", "they", "them", "their", "been", "were", "which", "when", "what", "where", "how", "why", "about", "into", "than", "then", "also", "more", "some", "such", "only", "other", "use", "used", "using", "each", "per", "may", "should", "could", "would", "shall", "must", "might", "like", "just", "over", "very", "most", "many", "much", "even", "still", "those", "these", "both", "between", "under", "after", "before", "while", "during", "because", "since", "through", "without", "within", "across", "among", "against", "upon", "toward", "towards", "around", "upon", "amongst", "beside", "besides", "despite", "although", "though", "unless", "until", "whether", "whereas", "wherever", "whenever", "whereby", "wherein", "whereof", "whereon", "whereupon", "wherewith", "whereat", "whereby", "wherein", "whereof", "whereon", "whereupon", "wherewith", "whereat"])
    words = re.findall(r"\b\w{4,}\b", text.lower())
    keywords = [w for w in words if w not in stopwords]
    return list(set(keywords))

def extract_keywords_from_job_desc(text):
    return extract_keywords(text)

def call_gemini_api(resume_text, job_desc, resume_keywords, job_keywords):
    # You must set your Gemini API key as an environment variable: GEMINI_API_KEY
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return "[ERROR: Gemini API key not set]"
    genai.configure(api_key=api_key)
    prompt = f"""
You are an expert resume writer. Given the following resume and job description, rewrite the resume to be highly ATS-friendly, using relevant keywords from the job description and resume. Make sure the output is well-formatted and ready for PDF export.

Resume:
{resume_text}

Resume Keywords: {', '.join(resume_keywords)}

Job Description:
{job_desc}

Job Keywords: {', '.join(job_keywords)}

Output only the improved resume, no extra commentary.
"""
    model = genai.GenerativeModel('gemini-pro')
    response = model.generate_content(prompt)
    return response.text

def save_text_as_pdf(text, output_path):
    c = canvas.Canvas(output_path, pagesize=letter)
    width, height = letter
    lines = text.split('\n')
    y = height - 40
    for line in lines:
        c.drawString(40, y, line[:100])
        y -= 15
        if y < 40:
            c.showPage()
            y = height - 40
    c.save()

@app.post("/upload_resume/")
async def upload_resume(file: UploadFile = File(...)):
    file_location = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_location, "wb") as f:
        f.write(await file.read())
    ext = os.path.splitext(file.filename)[1].lower()
    if ext == ".pdf":
        text = extract_text_from_pdf(file_location)
    elif ext in [".docx", ".doc"]:
        text = extract_text_from_docx(file_location)
    elif ext == ".txt":
        text = extract_text_from_txt(file_location)
    elif ext == ".rtf":
        text = extract_text_from_rtf(file_location)
    elif ext == ".odt":
        text = extract_text_from_odt(file_location)
    else:
        text = ""
    keywords = extract_keywords(text)
    return {"filename": file.filename, "text": text[:1000], "keywords": keywords[:30], "message": "File uploaded and parsed."}

@app.post("/generate_resume/")
async def generate_resume(
    resume_filename: str = Form(...),
    job_description: str = Form(...)
):
    file_location = os.path.join(UPLOAD_DIR, resume_filename)
    ext = os.path.splitext(resume_filename)[1].lower()
    if ext == ".pdf":
        resume_text = extract_text_from_pdf(file_location)
    elif ext in [".docx", ".doc"]:
        resume_text = extract_text_from_docx(file_location)
    else:
        resume_text = ""
    resume_keywords = extract_keywords(resume_text)
    job_keywords = extract_keywords_from_job_desc(job_description)
    ai_resume = call_gemini_api(resume_text, job_description, resume_keywords, job_keywords)
    output_pdf = os.path.join(UPLOAD_DIR, f"ats_{resume_filename}.pdf")
    save_text_as_pdf(ai_resume, output_pdf)
    return {"pdf_path": output_pdf, "message": "ATS resume generated.", "ai_resume": ai_resume[:1000]}

@app.get("/preview_resume/")
def preview_resume(pdf_path: str):
    if not os.path.exists(pdf_path):
        return JSONResponse(status_code=404, content={"error": "File not found"})
    return FileResponse(pdf_path, media_type="application/pdf", filename=os.path.basename(pdf_path))