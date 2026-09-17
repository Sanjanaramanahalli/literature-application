import React, { useState, useEffect } from 'react';
import { ArrowLeft, Star, Bookmark, Calendar, Globe, Tag, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { ThreadedComments } from './ThreadedComments';
import type { LiteratureItem } from './LiteratureCard';
import './ReaderView.css';

interface ReaderViewProps {
  literatureId: string;
  user: any;
  onBack: () => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
}

interface DetailedLiterature extends LiteratureItem {
  content: string;
  subject?: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  comments?: any[];
}

export const ReaderView: React.FC<ReaderViewProps> = ({
  literatureId,
  user,
  onBack,
  onOpenAuth,
}) => {
  const [literature, setLiterature] = useState<DetailedLiterature | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Rating State
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [userRating, setUserRating] = useState<number>(0);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [totalRatingsCount, setTotalRatingsCount] = useState<number>(0);
  const [ratingLoading, setRatingLoading] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Save State
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [savesCount, setSavesCount] = useState<number>(0);
  const [saveLoading, setSaveLoading] = useState<boolean>(false);

  // Dedicated Cover Page & Pagination States
  // 'cover' = initial view showing Cover Page first
  // 'content' = user has opened the manuscript to read pages
  const [viewingMode, setViewingMode] = useState<'cover' | 'content'>('cover');
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    fetchLiteratureDetail();
    // Reset to cover page when switching literature
    setViewingMode('cover');
    setCurrentPage(1);
  }, [literatureId, user]);

  const fetchLiteratureDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('literature_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`http://localhost:5000/api/reader/literature/${literatureId}`, { headers });
      if (!res.ok) {
        throw new Error('Failed to retrieve archival manuscript.');
      }

      const data = await res.json();
      const item = data.literature;
      setLiterature(item);
      setAverageRating(item.averageRating || 0);
      setTotalRatingsCount(item.totalRatingsCount || 0);
      setSavesCount(item.totalSavesCount || 0);

      // Check if item is saved in user's library if authenticated
      if (token && user) {
        try {
          const savedRes = await fetch('http://localhost:5000/api/reader/saved', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (savedRes.ok) {
            const savedData = await savedRes.json();
            const exists = (savedData.savedWorks || []).some((w: any) => w.id === literatureId);
            setIsSaved(exists);
          }
        } catch (e) {
          console.error('Error verifying save state:', e);
        }
      }
    } catch (err: any) {
      console.error('Reader detail fetch failure:', err);
      setError(err.message || 'Unable to open reading sanctuary.');
    } finally {
      setLoading(false);
    }
  };

  const handleRate = async (stars: number) => {
    if (!user) {
      setFeedbackMessage('Please sign in to register your scholarly rating.');
      onOpenAuth('login');
      return;
    }

    try {
      setRatingLoading(true);
      setFeedbackMessage(null);

      const token = localStorage.getItem('literature_token');
      const res = await fetch(`http://localhost:5000/api/reader/literature/${literatureId}/ratings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ value: stars }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to submit rating.');
      }

      const result = await res.json();
      setUserRating(result.rating);
      setAverageRating(result.averageRating);
      setTotalRatingsCount(result.totalRatingsCount);
      setFeedbackMessage(`Your ${stars}-star rating was recorded in the Athenæum archives.`);
    } catch (err: any) {
      console.error('Rating error:', err);
      setFeedbackMessage(err.message || 'Error recording rating.');
    } finally {
      setRatingLoading(false);
    }
  };

  const handleToggleSave = async () => {
    if (!user) {
      setFeedbackMessage('Please sign in to save this work to your personal sanctuary.');
      onOpenAuth('login');
      return;
    }

    try {
      setSaveLoading(true);
      const token = localStorage.getItem('literature_token');
      const res = await fetch(`http://localhost:5000/api/reader/literature/${literatureId}/save`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to toggle save.');
      }

      const data = await res.json();
      setIsSaved(data.saved);
      setSavesCount(data.totalSavesCount);
      setFeedbackMessage(data.message);
    } catch (err: any) {
      console.error('Save toggle error:', err);
      setFeedbackMessage(err.message || 'Error updating saved status.');
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="reader-loading" id="reader-loading-state">
        <div className="loading-spinner"></div>
        <p className="loading-text serif-title">Opening manuscript folio...</p>
      </div>
    );
  }

  if (error || !literature) {
    return (
      <div className="reader-error" id="reader-error-state">
        <p style={{ fontSize: '2rem', marginBottom: '1rem' }}>📜</p>
        <h3 className="serif-title" style={{ fontSize: '1.75rem', color: 'var(--accent-burgundy)' }}>
          Manuscript Unavailable
        </h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          {error || 'The requested literary piece is currently preserved or restricted.'}
        </p>
        <button className="btn btn-secondary" onClick={onBack} id="btn-reader-back-error">
          Return to Archives
        </button>
      </div>
    );
  }

  const formattedDate = literature.publicationDate
    ? new Date(literature.publicationDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
      })
    : null;

  // Split content into pages (explicit page breaks OR standard book pagination chunks of ~250 words)
  const getPages = (text: string): string[] => {
    if (!text || !text.trim()) return [''];
    const trimmed = text.trim();
    if (trimmed.includes('---page---') || trimmed.includes('<!-- pagebreak -->') || trimmed.includes('\f')) {
      const parts = trimmed.split(/---page---|<!-- pagebreak -->|\f/g).filter((s) => s.trim().length > 0);
      return parts.length > 0 ? parts : [trimmed];
    }
    // Split into ~250 words chunks per page
    const words = trimmed.split(/\s+/);
    const pagesArr: string[] = [];
    const wordsPerPage = 250;
    for (let i = 0; i < words.length; i += wordsPerPage) {
      pagesArr.push(words.slice(i, i + wordsPerPage).join(' '));
    }
    return pagesArr.length > 0 ? pagesArr : [trimmed];
  };

  const pages = getPages(literature.content);
  const totalPages = pages.length;
  const currentContentPageText = pages[currentPage - 1] || pages[0] || '';

  return (
    <div className="reader-view-container" id="reader-view-container">
      {/* Top Navigation Bar */}
      <div className="reader-navigation-bar">
        <button className="reader-back-btn" onClick={onBack} id="btn-reader-back">
          <ArrowLeft size={16} />
          <span>Return to Catalog</span>
        </button>

        <div className="reader-actions-quick">
          {viewingMode === 'content' && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setViewingMode('cover')}
              id="btn-return-cover-page"
              title="Return to Manuscript Cover Page"
            >
              <BookOpen size={14} style={{ marginRight: '4px' }} />
              <span>Cover Page</span>
            </button>
          )}

          <button
            className={`btn ${isSaved ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={handleToggleSave}
            disabled={saveLoading}
            id="btn-toggle-save-reader"
            title={isSaved ? 'Remove from your reading list' : 'Bookmark to your reading list'}
          >
            <Bookmark
              size={14}
              fill={isSaved ? 'currentColor' : 'transparent'}
              style={{ marginRight: '4px' }}
            />
            <span>{isSaved ? 'Saved in Sanctuary' : 'Save to Sanctuary'}</span>
            <span style={{ opacity: 0.8, marginLeft: '4px' }}>({savesCount})</span>
          </button>
        </div>
      </div>

      {/* VIEWING MODE 1: DEDICATED COVER PAGE (Appears First) */}
      {viewingMode === 'cover' && (
        <section className="reader-cover-page-card" id="reader-cover-page" data-testid="reader-cover-page">
          <div className="cover-page-inner">
            {literature.coverImage ? (
              <div className="cover-page-artwork-container">
                <div className="book-3d-wrapper">
                  <div className="book-spine-shadow" />
                  <div className="book-cover-hardcover">
                    <img
                      src={literature.coverImage}
                      alt={`Cover artwork for ${literature.title}`}
                      className="cover-page-main-img"
                      id="reader-cover-image"
                    />
                    <div className="book-spine-ridge" />
                    <div className="book-glare-overlay" />
                  </div>
                </div>
                <div className="cover-page-folio-tag">
                  {literature.language === 'Kannada' ? 'ಕನ್ನಡ ಸಾಹಿತ್ಯ ಸಂಪುಟ • Athenæum Edition' :
                   literature.language === 'Hindi' ? 'हिंदी साहित्य निधि • Athenæum Edition' :
                   'Athenæum Classical Folio Edition'}
                </div>
              </div>
            ) : (
              <div className="cover-page-placeholder-artwork">
                <BookOpen size={64} className="cover-placeholder-icon" />
                <span>Canonical Manuscript</span>
              </div>
            )}

            <div className="cover-page-details">
              <div className="reader-meta-pills" style={{ justifyContent: 'flex-start', marginBottom: '1rem' }}>
                {literature.category && (
                  <span className="tag-badge burgundy" id="reader-cover-category">
                    {literature.category.name}
                  </span>
                )}
                {literature.genre && <span className="tag-badge">{literature.genre}</span>}
                {literature.language && (
                  <span className="tag-badge">
                    <Globe size={12} style={{ marginRight: '3px' }} />
                    {literature.language}
                  </span>
                )}
              </div>

              <h1 className="cover-page-title" id="cover-page-title">
                {literature.title}
              </h1>

              {literature.subheading && (
                <h2 className="cover-page-subheading" id="cover-page-subheading">
                  {literature.subheading}
                </h2>
              )}

              {literature.creator && (
                <p className="cover-page-author" id="cover-page-author">
                  Authored by <strong>{literature.creator.name}</strong>
                </p>
              )}

              {formattedDate && (
                <p className="cover-page-date">
                  <Calendar size={13} style={{ display: 'inline', marginRight: '4px' }} />
                  Historical Edition • {formattedDate}
                </p>
              )}

              <div className="cover-page-page-count-pill" id="cover-page-total-pages">
                <span>Total Literature Content:</span>
                <strong>{totalPages} Pages</strong>
              </div>

              {literature.brief && (
                <div className="cover-page-brief" id="cover-page-brief">
                  <p>{literature.brief}</p>
                </div>
              )}

              <div className="cover-page-actions">
                <button
                  type="button"
                  className="btn btn-primary btn-open-manuscript"
                  onClick={() => {
                    setViewingMode('content');
                    setCurrentPage(1);
                  }}
                  id="btn-open-manuscript"
                >
                  <BookOpen size={18} />
                  <span>Begin Reading Manuscript</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* VIEWING MODE 2: LITERATURE CONTENT PAGES (Follows Cover Page) */}
      {viewingMode === 'content' && (
        <article className="reader-article-wrapper" id="reader-article-content">
          {/* Header Bar */}
          <header className="reader-article-header">
            <div className="reader-meta-pills">
              {literature.category && (
                <span className="tag-badge burgundy" id="reader-category-badge">
                  {literature.category.name}
                </span>
              )}
              {literature.genre && <span className="tag-badge">{literature.genre}</span>}
              {literature.language && (
                <span className="tag-badge">
                  <Globe size={12} style={{ marginRight: '3px' }} />
                  {literature.language}
                </span>
              )}
            </div>

            <h1 className="reader-title" id="reader-title">{literature.title}</h1>

            {literature.subheading && (
              <h2 className="reader-subheading" id="reader-subheading">{literature.subheading}</h2>
            )}

            {literature.creator && (
              <div className="reader-author-attribution">
                Penned by <strong className="reader-author-name" id="reader-author-name">{literature.creator.name}</strong>
              </div>
            )}
          </header>

          {/* Pagination Controls Top */}
          <div className="reader-page-controls" id="reader-page-controls-top">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              id="btn-prev-page"
            >
              <ChevronLeft size={16} />
              <span>Previous Page</span>
            </button>

            <div className="reader-page-indicator" id="reader-page-indicator">
              Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              id="btn-next-page"
            >
              <span>Next Page</span>
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Current Page Literary Content */}
          <div className="reader-content-body" id="reader-body-paragraphs">
            {currentContentPageText.split('\n\n').map((para, index) => (
              <p key={index}>{para}</p>
            ))}
          </div>

          {/* Pagination Controls Bottom */}
          <div className="reader-page-controls" id="reader-page-controls-bottom" style={{ marginTop: '2rem' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={currentPage <= 1}
              onClick={() => {
                setCurrentPage((prev) => Math.max(1, prev - 1));
                window.scrollTo({ top: 100, behavior: 'smooth' });
              }}
              id="btn-prev-page-bottom"
            >
              <ChevronLeft size={16} />
              <span>Previous Page</span>
            </button>

            <span className="reader-page-indicator">
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={currentPage >= totalPages}
              onClick={() => {
                setCurrentPage((prev) => Math.min(totalPages, prev + 1));
                window.scrollTo({ top: 100, behavior: 'smooth' });
              }}
              id="btn-next-page-bottom"
            >
              <span>Next Page</span>
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Thematic Tags */}
          {literature.tags && literature.tags.length > 0 && (
            <div style={{ marginTop: '2.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <Tag size={14} style={{ color: 'var(--accent-gold)' }} />
              {literature.tags.map((tag, i) => (
                <span key={i} className="tag-badge" style={{ fontSize: '0.8rem' }}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* End Ornament */}
          <div className="reader-ornament-finis">
            {currentPage === totalPages ? '❦ FINIS ❦' : '❦ — Continued next page — ❦'}
          </div>
        </article>
      )}

      {/* Dynamic 1-5 Star Interactive Rating System */}
      <section className="reader-rating-section" id="reader-rating-section">
        <h3 className="rating-section-title">Scholarly Evaluation & Rating</h3>
        <p className="rating-section-desc">
          Rate this classical work on a 1–5 star scale. Each scholar holds one active rating, dynamically contributing to the archival average.
        </p>

        <div className="interactive-stars-widget" id="interactive-stars-widget">
          {[1, 2, 3, 4, 5].map((star) => {
            const isFilled = hoverRating >= star || (!hoverRating && userRating >= star);
            return (
              <button
                key={star}
                type="button"
                className={`star-rating-btn ${isFilled ? 'active' : ''}`}
                id={`star-btn-${star}`}
                aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                disabled={ratingLoading}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => handleRate(star)}
              >
                <Star
                  size={32}
                  fill={isFilled ? 'var(--accent-gold)' : 'transparent'}
                  color={isFilled ? 'var(--accent-gold)' : 'currentColor'}
                />
              </button>
            );
          })}
        </div>

        <div className="rating-summary-bar" id="reader-rating-summary">
          <div className="rating-stat-item">
            <span>Average Rating:</span>
            <strong id="display-average-rating">
              {averageRating > 0 ? averageRating.toFixed(1) : 'No ratings yet'}
            </strong>
          </div>
          <div className="rating-stat-divider">•</div>
          <div className="rating-stat-item">
            <span>Total Scholarly Reviews:</span>
            <strong id="display-total-ratings">{totalRatingsCount}</strong>
          </div>
          {userRating > 0 && (
            <>
              <div className="rating-stat-divider">•</div>
              <div className="rating-stat-item">
                <span>Your Active Rating:</span>
                <span className="user-active-rating-pill" id="display-user-rating">
                  {userRating} ★
                </span>
              </div>
            </>
          )}
        </div>

        {feedbackMessage && (
          <p className="user-feedback-msg" id="rating-feedback-message">
            {feedbackMessage}
          </p>
        )}

        {!user && (
          <div>
            <span
              className="anonymous-login-hint"
              id="hint-login-to-rate"
              onClick={() => onOpenAuth('login')}
            >
              Sign in to submit your evaluation
            </span>
          </div>
        )}
      </section>

      {/* 2-Level Threaded Comments & Dialogues */}
      <ThreadedComments
        literatureId={literatureId}
        comments={literature.comments || []}
        user={user}
        onCommentsUpdated={fetchLiteratureDetail}
        onOpenAuth={onOpenAuth}
      />
    </div>
  );
};
