import React, { useState, useEffect } from 'react';
import { Sparkles, BookOpen, HelpCircle, Languages, X, RefreshCw, Copy, Check, AlertCircle, ShieldCheck } from 'lucide-react';
import { getApiUrl } from '../config/api';
import './AiAssistantModal.css';

export type AiMode = 'summarize' | 'explain' | 'translate';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  literatureTitle: string;
  literatureContent: string;
  selectedPassage?: string;
  initialMode?: AiMode;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  literatureTitle,
  literatureContent,
  selectedPassage,
  initialMode = 'summarize',
}) => {
  const [activeTab, setActiveTab] = useState<AiMode>(initialMode);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Results State
  const [summaryData, setSummaryData] = useState<{ summary: string; keyThemes: string[] } | null>(null);
  const [explainData, setExplainData] = useState<{
    explanation: string;
    simplifiedTerms: { term: string; meaning: string }[];
  } | null>(null);
  const [translationData, setTranslationData] = useState<{
    translatedText: string;
    targetLanguage: string;
    notes?: string;
  } | null>(null);

  // Translation options
  const [targetLang, setTargetLang] = useState<'Hindi' | 'Kannada' | 'English'>('Hindi');

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialMode);
      // Auto-trigger generation if not already loaded for this mode
      if (initialMode === 'summarize' && !summaryData) {
        handleSummarize();
      } else if (initialMode === 'explain' && !explainData) {
        handleExplain();
      } else if (initialMode === 'translate' && !translationData) {
        handleTranslate('Hindi');
      }
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const getAuthToken = (): string | null => {
    return localStorage.getItem('literature_token');
  };

  const handleSummarize = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getAuthToken();
      if (!token) {
        throw new Error('Please sign in to access the Literature AI Assistant.');
      }

      const res = await fetch(getApiUrl('/api/ai/summarize'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: literatureTitle,
          content: (literatureContent || '').slice(0, 10000),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'AI service is temporarily unavailable. Please try again later.');
      }

      setSummaryData(data.data);
    } catch (err: any) {
      setError(err.message || 'AI service is temporarily unavailable. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleExplain = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getAuthToken();
      if (!token) {
        throw new Error('Please sign in to access the Literature AI Assistant.');
      }

      const res = await fetch(getApiUrl('/api/ai/explain'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: literatureTitle,
          content: (literatureContent || '').slice(0, 10000),
          section: selectedPassage || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'AI service is temporarily unavailable. Please try again later.');
      }

      setExplainData(data.data);
    } catch (err: any) {
      setError(err.message || 'AI service is temporarily unavailable. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleTranslate = async (lang: 'Hindi' | 'Kannada' | 'English') => {
    try {
      setLoading(true);
      setError(null);
      const token = getAuthToken();
      if (!token) {
        throw new Error('Please sign in to access the Literature AI Assistant.');
      }

      const textToTranslate = selectedPassage && selectedPassage.trim()
        ? selectedPassage
        : literatureContent.slice(0, 3000);

      const res = await fetch(getApiUrl('/api/ai/translate'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          text: textToTranslate,
          targetLanguage: lang,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'AI service is temporarily unavailable. Please try again later.');
      }

      setTranslationData(data.data);
    } catch (err: any) {
      setError(err.message || 'AI service is temporarily unavailable. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="ai-modal-overlay" onClick={onClose} id="ai-assistant-overlay">
      <div className="ai-modal-card" onClick={(e) => e.stopPropagation()} id="ai-assistant-modal">
        {/* Header */}
        <div className="ai-modal-header">
          <div className="ai-modal-header-left">
            <div className="ai-modal-icon-badge">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="ai-modal-title">Literature AI Assistant</h3>
              <p className="ai-modal-subtitle">
                Powered by Google Gemini &bull; Archival Scholarly Companion
              </p>
            </div>
          </div>
          <button className="ai-modal-close-btn" onClick={onClose} aria-label="Close Assistant">
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="ai-modal-tabs">
          <button
            className={`ai-tab-btn ${activeTab === 'summarize' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('summarize');
              if (!summaryData) handleSummarize();
            }}
            id="btn-ai-tab-summary"
          >
            <BookOpen size={15} />
            ✨ AI Summary
          </button>
          <button
            className={`ai-tab-btn ${activeTab === 'explain' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('explain');
              if (!explainData) handleExplain();
            }}
            id="btn-ai-tab-explain"
          >
            <HelpCircle size={15} />
            ✨ Explain
          </button>
          <button
            className={`ai-tab-btn ${activeTab === 'translate' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('translate');
              if (!translationData) handleTranslate(targetLang);
            }}
            id="btn-ai-tab-translate"
          >
            <Languages size={15} />
            ✨ Translate
          </button>
        </div>

        {/* Body Content */}
        <div className="ai-modal-body">
          {error && (
            <div className="ai-error-box" id="ai-error-message">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="ai-loading-state" id="ai-loading-indicator">
              <div className="ai-spinner"></div>
              <p className="ai-loading-text">Consulting the Athenæum Scholarly Intellect...</p>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Generating archival insights...</p>
            </div>
          ) : (
            <>
              {/* SUMMARIZE TAB */}
              {activeTab === 'summarize' && (
                <div id="ai-summary-content">
                  <div className="ai-disclaimer-badge">
                    <ShieldCheck size={14} />
                    <span>Scholarly synopsis preserves the integrity of original archival text.</span>
                  </div>

                  {summaryData ? (
                    <div className="ai-result-card">
                      <h4 style={{ fontFamily: 'var(--font-serif)', color: 'var(--accent-burgundy)', marginBottom: '0.75rem', fontSize: '1.1rem' }}>
                        Executive Curatorial Synopsis
                      </h4>
                      <p style={{ whiteSpace: 'pre-line' }}>{summaryData.summary}</p>

                      {summaryData.keyThemes && summaryData.keyThemes.length > 0 && (
                        <div>
                          <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-burgundy)', marginTop: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Core Literary Themes
                          </p>
                          <div className="ai-themes-list">
                            {summaryData.keyThemes.map((theme, i) => (
                              <span key={i} className="ai-theme-pill">
                                &bull; {theme}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                      Click <strong>Generate Summary</strong> to analyze this literature.
                    </div>
                  )}
                </div>
              )}

              {/* EXPLAIN TAB */}
              {activeTab === 'explain' && (
                <div id="ai-explain-content">
                  <div className="ai-disclaimer-badge">
                    <ShieldCheck size={14} />
                    <span>{selectedPassage ? 'Analyzing selected manuscript passage.' : 'Analyzing manuscript sections.'}</span>
                  </div>

                  {explainData ? (
                    <div className="ai-result-card">
                      <h4 style={{ fontFamily: 'var(--font-serif)', color: 'var(--accent-burgundy)', marginBottom: '0.75rem', fontSize: '1.1rem' }}>
                        Scholarly Interpretation
                      </h4>
                      <p style={{ whiteSpace: 'pre-line' }}>{explainData.explanation}</p>

                      {explainData.simplifiedTerms && explainData.simplifiedTerms.length > 0 && (
                        <div style={{ marginTop: '1.25rem' }}>
                          <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-burgundy)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                            Clarified Metaphors & Archaic Expressions
                          </p>
                          <table className="ai-terms-table">
                            <thead>
                              <tr>
                                <th>Expression / Word</th>
                                <th>Simplified Meaning</th>
                              </tr>
                            </thead>
                            <tbody>
                              {explainData.simplifiedTerms.map((t, idx) => (
                                <tr key={idx}>
                                  <td className="term-name">{t.term}</td>
                                  <td>{t.meaning}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                      Click <strong>Explain Literature</strong> to generate a simplified interpretation.
                    </div>
                  )}
                </div>
              )}

              {/* TRANSLATE TAB */}
              {activeTab === 'translate' && (
                <div id="ai-translate-content">
                  <div className="ai-disclaimer-badge">
                    <ShieldCheck size={14} />
                    <span>AI-Generated Translation (Draft). Original text remains completely unaltered.</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div className="lang-select-group">
                      <label htmlFor="ai-target-lang-select">Target Language:</label>
                      <select
                        id="ai-target-lang-select"
                        value={targetLang}
                        onChange={(e) => {
                          const val = e.target.value as 'Hindi' | 'Kannada' | 'English';
                          setTargetLang(val);
                          handleTranslate(val);
                        }}
                        className="lang-select"
                      >
                        <option value="Hindi">Hindi (हिन्दी)</option>
                        <option value="Kannada">Kannada (ಕನ್ನಡ)</option>
                        <option value="English">English</option>
                      </select>
                    </div>

                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Supports English &bull; Hindi &bull; Kannada
                    </span>
                  </div>

                  {translationData ? (
                    <div className="ai-result-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-burgundy)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Translation: {translationData.targetLanguage}
                        </span>
                        <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: 'rgba(212, 175, 55, 0.15)', borderRadius: '4px', color: '#7a5c1e' }}>
                          AI Draft
                        </span>
                      </div>

                      <div style={{ fontSize: '1rem', lineHeight: '1.8', whiteSpace: 'pre-line', color: 'var(--text-primary)', marginBottom: '1rem' }}>
                        {translationData.translatedText}
                      </div>

                      {translationData.notes && (
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-classic)', paddingTop: '0.65rem', fontStyle: 'italic' }}>
                          Note: {translationData.notes}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                      Select a language above to generate translation draft.
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="ai-modal-footer">
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {((activeTab === 'summarize' && summaryData) ||
              (activeTab === 'explain' && explainData) ||
              (activeTab === 'translate' && translationData)) && (
              <button
                type="button"
                className="btn-ai-secondary"
                onClick={() => {
                  if (activeTab === 'summarize' && summaryData) {
                    handleCopy(summaryData.summary);
                  } else if (activeTab === 'explain' && explainData) {
                    handleCopy(explainData.explanation);
                  } else if (activeTab === 'translate' && translationData) {
                    handleCopy(translationData.translatedText);
                  }
                }}
                id="btn-ai-copy-result"
              >
                {copied ? <Check size={14} color="green" /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            )}

            <button
              type="button"
              className="btn-ai-secondary"
              disabled={loading}
              onClick={() => {
                if (activeTab === 'summarize') handleSummarize();
                else if (activeTab === 'explain') handleExplain();
                else if (activeTab === 'translate') handleTranslate(targetLang);
              }}
              id="btn-ai-regenerate"
            >
              <RefreshCw size={14} />
              <span>Regenerate</span>
            </button>
          </div>

          <button type="button" className="btn-ai-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
