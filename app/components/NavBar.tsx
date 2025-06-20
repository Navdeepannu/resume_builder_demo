"use client";
import { useEffect, useState } from "react";

export default function NavBar() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [isDark]);

  return (
    <nav
      className="w-full flex items-center justify-between px-8 py-4 mb-8 shadow-sm"
      style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}
    >
      <span className="text-xl font-bold" style={{ color: 'var(--color-primary)' }}>
        AI Resume Builder
      </span>
      <button
        className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium border transition-colors"
        style={{
          background: isDark ? 'var(--color-primary)' : 'var(--color-surface)',
          color: isDark ? 'var(--color-cta-text)' : 'var(--color-primary)',
          borderColor: 'var(--color-primary)',
        }}
        aria-label="Toggle dark mode"
        onClick={() => setIsDark((d) => !d)}
      >
        {isDark ? (
          <span>🌙 Dark</span>
        ) : (
          <span>☀️ Light</span>
        )}
      </button>
    </nav>
  );
} 