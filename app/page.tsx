"use client";
import React, { useState, useRef } from "react";
import { useForm } from "react-hook-form";

interface ResumeFormInputs {
  resume: FileList;
}
interface JobDescFormInputs {
  jobDesc: string;
}

export default function Home() {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeKeywords, setResumeKeywords] = useState<string[]>([]);
  const [resumeText, setResumeText] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [jobKeywords, setJobKeywords] = useState<string[]>([]);
  const [atsPdfUrl, setAtsPdfUrl] = useState<string>("");
  const [aiResumePreview, setAiResumePreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);

  // react-hook-form for resume upload
  const {
    register: registerResume,
    handleSubmit: handleResumeSubmit,
    formState: { errors: resumeErrors },
    reset: resetResume,
  } = useForm<ResumeFormInputs>();

  // react-hook-form for job description
  const {
    register: registerJobDesc,
    handleSubmit: handleJobDescSubmit,
    formState: { errors: jobDescErrors },
    reset: resetJobDesc,
  } = useForm<JobDescFormInputs>();

  const backend = typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:8000"
    : "http://localhost:8000"; // Change to your backend URL if deployed

  // Landing page section
  if (step === 0) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 px-4">
        <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-8 flex flex-col items-center">
          <img src="/favicon.ico" alt="Resume Builder" className="w-16 h-16 mb-4" />
          <h1 className="text-4xl font-bold mb-2 text-center">AI Resume Builder</h1>
          <p className="text-lg text-gray-600 mb-6 text-center">
            Upload your resume and job description, and let AI generate an ATS-friendly resume for you!
          </p>
          <button
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold text-lg shadow hover:bg-blue-700 transition"
            onClick={() => setStep(1)}
          >
            Get Started
          </button>
        </div>
        <footer className="mt-10 text-gray-400 text-sm text-center">
          Built by Kunal Solani & Navdeep Singh
        </footer>
      </main>
    );
  }

  // Step 1: Resume Upload
  async function onResumeSubmit(data: ResumeFormInputs) {
    const file = data.resume[0];
    if (!file) return;
    setResumeFile(file);
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${backend}/upload_resume/`, {
      method: "POST",
      body: formData,
    });
    const result = await res.json();
    setResumeKeywords(result.keywords || []);
    setResumeText(result.text || "");
    setStep(2);
    setLoading(false);
  }

  // Step 2: Job Description
  async function onJobDescSubmit(data: JobDescFormInputs) {
    setJobDesc(data.jobDesc);
    setLoading(true);
    const formData = new FormData();
    formData.append("file", new Blob([data.jobDesc], { type: "text/plain" }), "jobdesc.txt");
    const res = await fetch(`${backend}/upload_resume/`, {
      method: "POST",
      body: formData,
    });
    const result = await res.json();
    setJobKeywords(result.keywords || []);
    setStep(3);
    setLoading(false);
  }

  // Step 3: Generate Resume
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

  // Step 1: Resume Upload UI
  if (step === 1) {
    return (
      <main className="max-w-2xl mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold mb-6 text-center">Upload Your Resume</h1>
        <form onSubmit={handleResumeSubmit(onResumeSubmit)} className="bg-white rounded-lg shadow p-6 flex flex-col gap-4">
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            {...registerResume("resume", { required: "Resume file is required" })}
            className="border p-2 rounded"
          />
          {resumeErrors.resume && <span className="text-red-600 text-sm">{resumeErrors.resume.message}</span>}
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 transition"
            disabled={loading}
          >
            {loading ? "Uploading..." : "Next: Job Description"}
          </button>
        </form>
        <button className="mt-6 text-blue-600 underline" onClick={() => setStep(0)}>Back to Home</button>
      </main>
    );
  }

  // Step 2: Job Description UI
  if (step === 2) {
    return (
      <main className="max-w-2xl mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold mb-6 text-center">Paste Job Description</h1>
        <form onSubmit={handleJobDescSubmit(onJobDescSubmit)} className="bg-white rounded-lg shadow p-6 flex flex-col gap-4">
          <textarea
            rows={7}
            {...registerJobDesc("jobDesc", { required: "Job description is required" })}
            className="border p-2 rounded"
            placeholder="Paste the job description here..."
          />
          {jobDescErrors.jobDesc && <span className="text-red-600 text-sm">{jobDescErrors.jobDesc.message}</span>}
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 transition"
            disabled={loading}
          >
            {loading ? "Extracting..." : "Next: Review & Generate"}
          </button>
        </form>
        <button className="mt-6 text-blue-600 underline" onClick={() => setStep(1)}>Back</button>
      </main>
    );
  }

  // Step 3: Review & Generate
  if (step === 3) {
    return (
      <main className="max-w-2xl mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold mb-6 text-center">Review & Generate</h1>
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="font-semibold mb-1">Resume Keywords:</h2>
          <div className="flex flex-wrap gap-2 mb-2">
            {resumeKeywords.map((kw) => (
              <span key={kw} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">{kw}</span>
            ))}
          </div>
          <h2 className="font-semibold mb-1">Resume Text Preview:</h2>
          <textarea className="w-full border rounded p-2 mb-4" rows={4} value={resumeText} readOnly />
          <h2 className="font-semibold mb-1">Job Description Keywords:</h2>
          <div className="flex flex-wrap gap-2 mb-2">
            {jobKeywords.map((kw) => (
              <span key={kw} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">{kw}</span>
            ))}
          </div>
        </div>
        <button
          className="bg-green-600 text-white px-4 py-2 rounded font-semibold hover:bg-green-700 transition"
          onClick={handleGenerateResume}
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate ATS Resume"}
        </button>
        <button className="mt-6 ml-4 text-blue-600 underline" onClick={() => setStep(2)}>Back</button>
      </main>
    );
  }

  // Step 4: Preview & Download
  if (step === 4) {
    return (
      <main className="max-w-2xl mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold mb-6 text-center">Your ATS Resume</h1>
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="font-semibold mb-1">AI Resume Preview (first 1000 chars):</h2>
          <textarea className="w-full border rounded p-2 mb-4" rows={8} value={aiResumePreview} readOnly />
          <h2 className="font-semibold mb-1">PDF Preview:</h2>
          {atsPdfUrl && (
            <iframe src={atsPdfUrl} className="w-full h-96 border rounded" title="ATS Resume PDF Preview"></iframe>
          )}
          {atsPdfUrl && (
            <a href={atsPdfUrl} download className="block mt-2 text-blue-600 underline">Download PDF</a>
          )}
        </div>
        <button className="mt-6 text-blue-600 underline" onClick={() => setStep(0)}>Start Over</button>
      </main>
    );
  }

  return null;
}
