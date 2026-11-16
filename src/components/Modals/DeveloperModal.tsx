import React, { useState } from 'react';
import { X, ExternalLink, GraduationCap, Sparkles, User } from 'lucide-react';

interface DeveloperModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeveloperModal: React.FC<DeveloperModalProps> = ({ isOpen, onClose }) => {
  const [imgError, setImgError] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="bg-ide-panel border border-ide-border rounded-xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-ide-subpanel border-b border-ide-border">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <h2 className="text-sm font-semibold text-white tracking-wide uppercase">
              Developer Profile
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Developer Profile"
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-ide-hover transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Card Body */}
        <div className="p-6 space-y-5">
          {/* Developer Photograph Portrait */}
          <div className="flex flex-col items-center justify-center pt-1">
            <div className="relative group">
              {/* Subtle ambient halo */}
              <div className="absolute -inset-1.5 rounded-full bg-gradient-to-tr from-blue-600/35 via-indigo-500/25 to-emerald-500/30 blur-md opacity-80 group-hover:opacity-100 transition-opacity" />

              {/* Circular portrait container */}
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-2 border-blue-500/50 ring-4 ring-blue-500/10 shadow-2xl bg-zinc-900 flex items-center justify-center">
                {!imgError ? (
                  <img
                    src="/images/developer/image.jpeg"
                    alt="Minhajul Islam"
                    className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 bg-zinc-900">
                    <User className="w-10 h-10 text-zinc-500" />
                    <span className="text-[10px] text-zinc-500 mt-1">Photo unavailable</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Primary Identity Section */}
          <div className="space-y-1.5 text-center">
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Minhajul Islam
              </h1>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-blue-400 bg-blue-950/60 px-2.5 py-0.5 rounded-full border border-blue-800/60">
                <Sparkles className="w-3 h-3" />
                Developer
              </span>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-xs text-zinc-300">
              <GraduationCap className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>CSE, Daffodil International University</span>
            </div>
          </div>

          {/* Development Tool Badge */}
          <div className="p-3 rounded-lg bg-ide-subpanel border border-ide-border text-xs text-zinc-300 flex items-center justify-between">
            <span className="text-zinc-400">Development Tool:</span>
            <span className="font-semibold text-white px-2.5 py-0.5 rounded bg-ide-panel border border-ide-border text-[11px] tracking-wide">
              Developed with Antigravity
            </span>
          </div>

          {/* Clickable Social Profiles */}
          <div className="space-y-2.5 pt-1">
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">
              Social Profiles
            </span>

            {/* GitHub Card */}
            <a
              href="https://github.com/Minhajulcse"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Minhajul Islam on GitHub (Minhajulcse)"
              className="flex items-center justify-between p-3 rounded-lg bg-ide-subpanel hover:bg-ide-hover border border-ide-border hover:border-zinc-600 transition-all group"
            >
              <div className="flex items-center gap-3">
                {/* GitHub Logo SVG */}
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-white">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                </div>
                <div>
                  <span className="text-xs font-semibold text-white block group-hover:text-blue-400 transition-colors">
                    GitHub
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400">
                    Minhajulcse
                  </span>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-zinc-500 group-hover:text-blue-400 transition-colors" />
            </a>

            {/* Codeforces Card */}
            <a
              href="https://codeforces.com/profile/NoObMin"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Minhajul Islam on Codeforces (NoObMin)"
              className="flex items-center justify-between p-3 rounded-lg bg-ide-subpanel hover:bg-ide-hover border border-ide-border hover:border-zinc-600 transition-all group"
            >
              <div className="flex items-center gap-3">
                {/* Codeforces 3-Bars Logo SVG */}
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <rect x="2.5" y="11" width="4.5" height="10" rx="1.5" fill="#facc15" />
                    <rect x="9.5" y="5" width="4.5" height="16" rx="1.5" fill="#3b82f6" />
                    <rect x="16.5" y="8" width="4.5" height="13" rx="1.5" fill="#ef4444" />
                  </svg>
                </div>
                <div>
                  <span className="text-xs font-semibold text-white block group-hover:text-blue-400 transition-colors">
                    Codeforces
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400">
                    NoObMin
                  </span>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-zinc-500 group-hover:text-blue-400 transition-colors" />
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-5 py-3.5 bg-ide-subpanel border-t border-ide-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-lg bg-ide-panel hover:bg-ide-hover border border-ide-border text-white transition-colors min-h-[38px]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
