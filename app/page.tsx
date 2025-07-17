"use client";
import React, { useState, useRef } from "react";

export default function Home() {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeKeywords, setResumeKeywords] = useState<string[]>([]);
  const [resumeText, setResumeText] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [jobKeywords, setJobKeywords] = useState<string[]>([]);
  const [atsPdfUrl, setAtsPdfUrl] = useState<string>("");
  const [aiResumePreview, setAiResumePreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const jobDescRef = useRef<HTMLTextAreaElement>(null);

  const backend = typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:8000"
    : "http://localhost:8000"; // Change to your backend URL if deployed

  async function handleResumeUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setResumeFile(file);
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${backend}/upload_resume/`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    setResumeKeywords(data.keywords || []);
    setResumeText(data.text || "");
    setStep(2);
    setLoading(false);
  }

  async function handleJobDescExtract() {
    // Use the same keyword extraction as backend
    setLoading(true);
    const formData = new FormData();
    formData.append("file", new Blob([jobDesc], { type: "text/plain" }), "jobdesc.txt");
    const res = await fetch(`${backend}/upload_resume/`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    setJobKeywords(data.keywords || []);
    setStep(3);
    setLoading(false);
  }

  async function handleGenerateResume() {
    if (!resumeFile) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("resume_filename", resumeFile.name);
    formData.append("job_description", jobDesc);
    const res = await fetch(`${backend}/generate_resume/`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    setAtsPdfUrl(`${backend}/preview_resume/?pdf_path=${encodeURIComponent(data.pdf_path)}`);
    setAiResumePreview(data.ai_resume || "");
    setStep(4);
    setLoading(false);
  }

  return (
    <main className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">AI Resume Builder</h1>
      {step === 1 && (
        <div className="mb-8">
          <label className="block mb-2 font-semibold">Upload your Resume (PDF or Word):</label>
          <input type="file" accept=".pdf,.doc,.docx" onChange={handleResumeUpload} />
          {loading && <p className="mt-2">Uploading and extracting...</p>}
        </div>
      )}
      {step >= 2 && (
        <div className="mb-8">
          <h2 className="font-semibold mb-1">Resume Keywords:</h2>
          <div className="flex flex-wrap gap-2 mb-2">
            {resumeKeywords.map((kw) => (
              <span key={kw} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">{kw}</span>
            ))}
          </div>
          <h2 className="font-semibold mb-1">Resume Text Preview:</h2>
          <textarea className="w-full border rounded p-2" rows={6} value={resumeText} readOnly />
        </div>
      )}
      {step === 2 && (
        <div className="mb-8">
          <label className="block mb-2 font-semibold">Paste Job Description:</label>
          <textarea
            ref={jobDescRef}
            className="w-full border rounded p-2 mb-2"
            rows={6}
            value={jobDesc}
            onChange={e => setJobDesc(e.target.value)}
          />
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded"
            onClick={handleJobDescExtract}
            disabled={loading || !jobDesc.trim()}
          >
            Extract Job Keywords
          </button>
          {loading && <p className="mt-2">Extracting keywords...</p>}
        </div>
      )}
      {step >= 3 && (
        <div className="mb-8">
          <h2 className="font-semibold mb-1">Job Description Keywords:</h2>
          <div className="flex flex-wrap gap-2 mb-2">
            {jobKeywords.map((kw) => (
              <span key={kw} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">{kw}</span>
            ))}
          </div>
        </div>
      )}
      {step === 3 && (
        <div className="mb-8">
          <button
            className="bg-green-600 text-white px-4 py-2 rounded"
            onClick={handleGenerateResume}
            disabled={loading}
          >
            Generate ATS Resume
          </button>
          {loading && <p className="mt-2">Generating resume...</p>}
        </div>
      )}
      {step === 4 && (
        <div className="mb-8">
          <h2 className="font-semibold mb-1">AI Resume Preview (first 1000 chars):</h2>
          <textarea className="w-full border rounded p-2 mb-2" rows={8} value={aiResumePreview} readOnly />
          <h2 className="font-semibold mb-1">PDF Preview:</h2>
          {atsPdfUrl && (
            <iframe src={atsPdfUrl} className="w-full h-96 border rounded" title="ATS Resume PDF Preview"></iframe>
          )}
          {atsPdfUrl && (
            <a href={atsPdfUrl} download className="block mt-2 text-blue-600 underline">Download PDF</a>
          )}
        </div>
      )}
    </main>
  );
}
