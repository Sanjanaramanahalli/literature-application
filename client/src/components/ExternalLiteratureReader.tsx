import React, { useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Globe,
  ExternalLink,
  ShieldCheck,
  Type,
  Sun,
  Moon,
  Coffee,
  Share2,
  Check,
} from 'lucide-react';
import './ExternalLiteratureReader.css';

export interface ExternalWorkDetail {
  id: string;
  title: string;
  language: string;
  languageCode: string;
  extract: string;
  thumbnailUrl?: string;
  sourceUrl: string;
  isFullTextAvailable: boolean;
  fullTextSource?: 'Wikisource' | 'None';
  fullTextUrl?: string;
  content?: string;
  sections?: { title: string; content: string }[];
  attribution: {
    source: string;
    license: string;
    url: string;
  };
}

interface ExternalLiteratureReaderProps {
  work: ExternalWorkDetail;
  onBack: () => void;
}

export const ExternalLiteratureReader: React.FC<ExternalLiteratureReaderProps> = ({
  work,
  onBack,
}) => {
  // Reader Settings
  const [fontSize, setFontSize] = useState<number>(18);
  const [fontFamily, setFontFamily] = useState<'serif' | 'sans'>('serif');
  const [readingTheme, setReadingTheme] = useState<'light' | 'sepia' | 'dark'>('sepia');
  const [copied, setCopied] = useState<boolean>(false);

  // Pagination for long full texts
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 3500; // characters per page for smooth reading
  const contentToPaginate = work.content || '';
  const totalPages = Math.max(1, Math.ceil(contentToPaginate.length / pageSize));

  const currentContentSlice = contentToPaginate
    ? contentToPaginate.substring((currentPage - 1) * pageSize, currentPage * pageSize)
    : '';

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`external-reader-container theme-${readingTheme}`}>
      {/* Top Controls Bar */}
      <header className="external-reader-header">
        <button className="btn-back" onClick={onBack} aria-label="Return to Search">
          <ArrowLeft size={18} />
          <span>Return to Catalog</span>
        </button>

        <div className="reader-controls">
          {/* Theme Selector */}
          <div className="theme-toggles">
            <button
              className={`theme-btn ${readingTheme === 'light' ? 'active' : ''}`}
              onClick={() => setReadingTheme('light')}
              title="Light Parchment"
            >
              <Sun size={15} />
            </button>
            <button
              className={`theme-btn ${readingTheme === 'sepia' ? 'active' : ''}`}
              onClick={() => setReadingTheme('sepia')}
              title="Sepia Sanctuary"
            >
              <Coffee size={15} />
            </button>
            <button
              className={`theme-btn ${readingTheme === 'dark' ? 'active' : ''}`}
              onClick={() => setReadingTheme('dark')}
              title="Midnight Archive"
            >
              <Moon size={15} />
            </button>
          </div>

          {/* Typography Controls */}
          <div className="font-controls">
            <button
              className="font-size-btn"
              onClick={() => setFontSize(Math.max(14, fontSize - 2))}
              title="Decrease Font Size"
            >
              A-
            </button>
            <span className="font-size-label">{fontSize}px</span>
            <button
              className="font-size-btn"
              onClick={() => setFontSize(Math.min(28, fontSize + 2))}
              title="Increase Font Size"
            >
              A+
            </button>
            <button
              className="font-family-btn"
              onClick={() => setFontFamily(fontFamily === 'serif' ? 'sans' : 'serif')}
              title="Toggle Typeface"
            >
              <Type size={15} />
              <span>{fontFamily === 'serif' ? 'Serif' : 'Sans'}</span>
            </button>
          </div>

          <button className="btn-share" onClick={handleShare} title="Share link">
            {copied ? <Check size={16} className="text-success" /> : <Share2 size={16} />}
          </button>
        </div>
      </header>

      {/* Main Manuscript Card */}
      <main className="external-manuscript-wrapper">
        <div className="manuscript-card">
          {/* Header Metadata */}
          <div className="manuscript-header">
            <div className="manuscript-title-area">
              <span className="language-badge">
                <Globe size={14} />
                {work.language}
              </span>
              <h1 className="manuscript-title">{work.title}</h1>
              {work.isFullTextAvailable ? (
                <div className="fulltext-status-badge available">
                  <ShieldCheck size={16} />
                  <span>Public Domain • Complete Full Text Available via Wikisource</span>
                </div>
              ) : (
                <div className="fulltext-status-badge reference">
                  <BookOpen size={16} />
                  <span>Encyclopedic Summary & Reference • Protected/Copyrighted Work</span>
                </div>
              )}
            </div>

            {work.thumbnailUrl && (
              <div className="manuscript-thumbnail-box">
                <img src={work.thumbnailUrl} alt={work.title} className="manuscript-thumb" />
              </div>
            )}
          </div>

          {/* If Full Text is available on Wikisource */}
          {work.isFullTextAvailable && work.content ? (
            <div className="full-text-reading-room">
              <div
                className={`prose-content font-${fontFamily}`}
                style={{ fontSize: `${fontSize}px` }}
              >
                {currentContentSlice.split('\n\n').map((para, idx) => (
                  <p key={idx} className="manuscript-paragraph">
                    {para}
                  </p>
                ))}
              </div>

              {/* Pagination if long work */}
              {totalPages > 1 && (
                <div className="reader-pagination-bar">
                  <button
                    className="btn btn-secondary btn-sm"
                    disabled={currentPage === 1}
                    onClick={() => {
                      setCurrentPage(currentPage - 1);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    Previous Section
                  </button>
                  <span className="pagination-text">
                    Part {currentPage} of {totalPages}
                  </span>
                  <button
                    className="btn btn-secondary btn-sm"
                    disabled={currentPage === totalPages}
                    onClick={() => {
                      setCurrentPage(currentPage + 1);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    Next Section
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* If only Wikipedia summary exists (Copyrighted / modern literary works) */
            <div className="summary-reading-room">
              <div className="copyright-safe-banner">
                <div className="banner-icon">
                  <BookOpen size={24} />
                </div>
                <div className="banner-content">
                  <h3>Copyright & Archival Notice</h3>
                  <p>
                    The complete text of <em>{work.title}</em> is protected under international literary copyright
                    and is not in the public domain. Below is the official encyclopedic summary, publication details, and
                    curatorial reference.
                  </p>
                  <a
                    href={work.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-sm external-source-btn"
                  >
                    <span>Read Full Work at Legitimate Source</span>
                    <ExternalLink size={15} />
                  </a>
                </div>
              </div>

              <div
                className={`prose-content summary-text font-${fontFamily}`}
                style={{ fontSize: `${fontSize}px` }}
              >
                <h3 className="section-subtitle">Encyclopedic Synopsis</h3>
                <p className="manuscript-paragraph">{work.extract}</p>
              </div>
            </div>
          )}

          {/* Legal Attribution & Licensing Footer */}
          <footer className="manuscript-attribution-footer">
            <div className="attribution-details">
              <p>
                <strong>Source:</strong> {work.attribution.source}
              </p>
              <p>
                <strong>Licensing:</strong> {work.attribution.license}
              </p>
              <p>
                All imported materials conform to Wikimedia public API distribution guidelines.
              </p>
            </div>
            <a
              href={work.attribution.url}
              target="_blank"
              rel="noopener noreferrer"
              className="link-source"
            >
              <span>View Original Wikimedia Manuscript</span>
              <ExternalLink size={14} />
            </a>
          </footer>
        </div>
      </main>
    </div>
  );
};
