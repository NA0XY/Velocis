"use client";

import { useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'motion/react';
import {
  AlertCircle, Sun, Moon, Shield, Home, Folder, Sparkles, RefreshCw,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router';

// ─── PipelinePage ─────────────────────────────────────────────────────────────
export function PipelinePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const themeClass = isDarkMode ? 'dark' : '';

  const repoName = id ?? 'Unknown';

  // ── Fortress QA Strategist ────────────────────────────────────────────────
  const [isFortressLoading, setIsFortressLoading] = useState(false);
  const [qaPlanMarkdown, setQaPlanMarkdown] = useState<string>('');
  const [qaError, setQaError] = useState<string | null>(null);

  const [filesAnalyzed, setFilesAnalyzed] = useState<string[]>([]);

  const fetchQAPlan = useCallback(async () => {
    if (isFortressLoading) return;
    setIsFortressLoading(true);
    setQaError(null);
    setQaPlanMarkdown('');
    setFilesAnalyzed([]);

    try {
      const BASE_URL = (import.meta.env.VITE_BACKEND_URL as string) ?? 'http://localhost:3001';
      const res = await fetch(`${BASE_URL}/api/fortress/qa-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ repoId: repoName }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.message ?? `Server returned ${res.status}`);
      }
      const data = await res.json();
      setQaPlanMarkdown(data.qaPlanMarkdown ?? '');
      setFilesAnalyzed(data.filesAnalyzed ?? []);
    } catch (err: any) {
      setQaError(err?.message ?? 'Failed to generate QA plan.');
    } finally {
      setIsFortressLoading(false);
    }
  }, [isFortressLoading, repoName]);

  return (
    <div className={`${themeClass} w-full h-full`}>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#080d18] text-gray-900 dark:text-gray-100 transition-colors duration-300 overflow-hidden">

        {/* ── Top Bar ── */}
        <div className="border-b h-[60px] flex items-center justify-between px-6 bg-white dark:bg-slate-900/80 border-gray-200 dark:border-slate-800 backdrop-blur-md shadow-sm z-20 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md flex items-center justify-center bg-gray-900 dark:bg-white">
                <span className="text-white dark:text-gray-900 font-bold text-sm">V</span>
              </div>
              <span className="font-bold hidden sm:block">Velocis</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-white transition-colors font-medium"
              >
                <Home className="w-3.5 h-3.5" /><span className="hidden sm:inline">Dashboard</span>
              </button>
              <span>/</span>
              <button
                onClick={() => navigate(`/repo/${id}`)}
                className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-white transition-colors font-medium"
              >
                <Folder className="w-3.5 h-3.5" /><span className="hidden sm:inline">{repoName}</span>
              </button>
              <span>/</span>
              <span className="text-gray-900 dark:text-white font-semibold flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-orange-400" /> Fortress Pipeline
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors hidden sm:block"
            >
              {isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 shadow-sm cursor-pointer">
              <span className="text-sm font-bold">R</span>
            </div>
          </div>
        </div>

        {/* ── Main Content ── */}
        <div className="flex-1 overflow-auto">
          <div className="flex flex-col items-center px-6 py-8 gap-6">

            {/* Page heading */}
            <div className="w-full max-w-2xl flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-orange-500/10 border border-orange-500/30 shrink-0">
                <Shield className="w-4 h-4 text-orange-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">Fortress QA Strategist</h1>
                <p className="text-xs text-gray-500 dark:text-slate-500">
                  Powered by <span className="font-semibold text-blue-400">DeepSeek V3</span> via Amazon Bedrock
                </p>
              </div>
            </div>

            {/* ── QA Strategist Card ── */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="w-full max-w-2xl rounded-2xl border border-blue-500/20 bg-white dark:bg-slate-900/60 overflow-hidden shadow-sm"
            >
              {/* Card header */}
              <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100 dark:border-slate-800/60">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-500/10 border border-blue-500/30">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">BDD Test Plan Generator</h3>
                    <p className="text-[11px] text-gray-500 dark:text-slate-500 mt-0.5">
                      DeepSeek V3 · Bedrock · Given / When / Then
                    </p>
                  </div>
                </div>
                <button
                  onClick={fetchQAPlan}
                  disabled={isFortressLoading}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isFortressLoading
                    ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    : <Sparkles className="w-3.5 h-3.5" />
                  }
                  {isFortressLoading ? 'Analyzing...' : qaPlanMarkdown ? 'Regenerate' : 'Generate BDD Plan'}
                </button>
              </div>

              {/* Files-analyzed strip — shown once results are available */}
              {!isFortressLoading && filesAnalyzed.length > 0 && (
                <div className="px-5 py-2.5 flex flex-wrap items-center gap-1.5 border-b border-gray-100 dark:border-slate-800/60 bg-slate-50/60 dark:bg-slate-900/40">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400 dark:text-slate-500 mr-1">
                    {filesAnalyzed.length} {filesAnalyzed.length === 1 ? 'file' : 'files'} analyzed:
                  </span>
                  {filesAnalyzed.map((f) => (
                    <span
                      key={f}
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-500/20"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              )}

              {/* Loading state */}
              {isFortressLoading && (
                <div className="px-5 py-6 space-y-3">
                  <div className="flex items-center gap-2.5 mb-4">
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                    <span className="text-xs font-medium text-gray-500 dark:text-slate-400">
                      Fetching repo files from GitHub and generating BDD test scenarios...
                    </span>
                  </div>
                  {[80, 60, 72, 50, 64].map((w, i) => (
                    <div
                      key={i}
                      className="h-3 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse"
                      style={{ width: `${w}%`, animationDelay: `${i * 120}ms` }}
                    />
                  ))}
                  <div
                    className="h-3 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse w-1/3 mt-1"
                    style={{ animationDelay: '600ms' }}
                  />
                </div>
              )}

              {/* Error state */}
              {qaError && !isFortressLoading && (
                <div className="px-5 py-4 flex items-center gap-2 text-rose-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="text-xs">{qaError}</span>
                </div>
              )}

              {/* Empty / idle state */}
              {!isFortressLoading && !qaPlanMarkdown && !qaError && (
                <div className="px-5 py-12 flex flex-col items-center justify-center text-center gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-blue-500/8 border border-blue-500/15">
                    <Sparkles className="w-5 h-5 text-slate-400 dark:text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">
                      No test plan generated yet
                    </p>
                    <p className="text-xs text-gray-400 dark:text-slate-600 max-w-sm">
                      Click <span className="font-semibold text-blue-400">Generate BDD Plan</span> to have Fortress
                      analyze your pipeline context and produce a complete test strategy — edge cases, security checks,
                      and Given / When / Then scenarios.
                    </p>
                  </div>
                </div>
              )}

              {/* Rendered markdown */}
              {!isFortressLoading && qaPlanMarkdown && (
                <div className="px-5 py-5">
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none
                      prose-headings:text-gray-900 dark:prose-headings:text-white prose-headings:font-bold
                      prose-h1:text-base prose-h2:text-sm prose-h3:text-xs
                      prose-p:text-gray-600 dark:prose-p:text-slate-400 prose-p:text-xs prose-p:leading-relaxed
                      prose-li:text-gray-600 dark:prose-li:text-slate-400 prose-li:text-xs
                      prose-strong:text-gray-900 dark:prose-strong:text-white
                      prose-code:text-blue-600 dark:prose-code:text-blue-400
                      prose-code:bg-blue-50 dark:prose-code:bg-blue-500/10
                      prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-[11px]
                      prose-blockquote:border-blue-400 prose-blockquote:text-gray-500 dark:prose-blockquote:text-slate-400
                      prose-hr:border-gray-200 dark:prose-hr:border-slate-800"
                  >
                    <ReactMarkdown>{qaPlanMarkdown}</ReactMarkdown>
                  </div>
                </div>
              )}
            </motion.div>

          </div>
        </div>

      </div>
    </div>
  );
}
