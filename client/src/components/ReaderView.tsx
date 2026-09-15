import React, { useState, useEffect } from 'react';
import { ArrowLeft, Star, Bookmark, Calendar, Globe, Tag } from 'lucide-react';
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

  useEffect(() => {
    fetchLiteratureDetail();
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

  return (
    <div className="reader-view-container" id="reader-view-container">
      {/* Top Navigation Bar */}
      <div className="reader-navigation-bar">
        <button className="reader-back-btn" onClick={onBack} id="btn-reader-back">
          <ArrowLeft size={16} />
          <span>Return to Catalog</span>
        </button>

        <div className="reader-actions-quick">
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

      {/* Main Distraction-free Reading Article */}
      <article className="reader-article-wrapper" id="reader-article-content">
        {/* Header */}
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

          {formattedDate && (
            <div className="reader-publish-info">
              <Calendar size={13} style={{ display: 'inline', marginRight: '4px' }} />
              Historical Preserved Edition • {formattedDate}
            </div>
          )}
        </header>

        {/* Cover Showcase if present */}
        {literature.coverImage && (
          <div className="reader-cover-showcase">
            <img
              src={literature.coverImage}
              alt={`Cover for ${literature.title}`}
              className="reader-cover-img"
              id="reader-cover-image"
            />
          </div>
        )}

        {/* Brief Overview */}
        {literature.brief && (
          <div className="reader-brief-callout" id="reader-brief">
            {literature.brief}
          </div>
        )}

        {/* Full Literary Content */}
        <div className="reader-content-body" id="reader-body-paragraphs">
          {literature.content.split('\n\n').map((para, index) => (
            <p key={index}>{para}</p>
          ))}
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
        <div className="reader-ornament-finis">❦ FINIS ❦</div>

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
                {averageRating > 0 ? averageRating.toFixed(1) : 'New'}
              </strong>
              <Star size={14} fill="var(--accent-gold)" color="var(--accent-gold)" style={{ marginLeft: '2px' }} />
            </div>

            <div className="stat-divider">•</div>

            <div className="rating-stat-item">
              <span>Total Evaluations:</span>
              <strong id="display-ratings-count">{totalRatingsCount}</strong>
            </div>

            {userRating > 0 && (
              <>
                <div className="stat-divider">•</div>
                <div className="rating-stat-item">
                  <span>Your Rating:</span>
                  <strong id="display-user-rating">{userRating} ★</strong>
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
      </article>
    </div>
  );
};
