"use client"
export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 sm:p-20" style={{ background: 'var(--color-background)' }}>
      {/* Main Heading */}
      <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--color-primary)' }}>
        Resume builder AI.io
      </h1>
      {/* Subheading */}
      <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--color-subheading)' }}>
        Create a beautiful resume in minutes
      </h2>
      {/* Paragraph */}
      <p className="max-w-xl text-center text-base mb-6" style={{ color: 'var(--color-text)' }}>
        Our AI-powered platform helps you craft a professional, eye-catching resume with ease. Choose your style, customize your content, and download instantly.
      </p>
      {/* Accent Divider */}
      <div className="w-24 h-1 rounded-full mb-6" style={{ background: 'var(--color-secondary)' }} />
      {/* Buttons */}
      <div className="flex gap-4">
        <button
          className="px-6 py-2 rounded-lg font-semibold shadow"
          style={{ background: 'var(--color-primary)', color: 'var(--color-cta-text)', border: 'none' }}
        >
          Get Started
        </button>
        <button
          className="px-6 py-2 rounded-lg font-semibold border"
          style={{ background: 'var(--color-surface)', color: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}
        >
          Learn More
        </button>
      </div>
    </div>
  );
}
