import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Star,
  Bookmark,
  Calendar,
  Globe,
  Tag,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  AlignLeft,
  Layers,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Check,
} from 'lucide-react';
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

  // Like & Downvote Reaction States
  const [userVote, setUserVote] = useState<'LIKE' | 'DOWNVOTE' | null>(null);
  const [likesCount, setLikesCount] = useState<number>(0);
  const [downvotesCount, setDownvotesCount] = useState<number>(0);
  const [voteLoading, setVoteLoading] = useState<boolean>(false);

  // Share notification state
  const [copiedShare, setCopiedShare] = useState<boolean>(false);

  // Dedicated Cover Page & Pagination States
  // 'cover' = initial view showing Cover Page first
  // 'content' = user has opened the manuscript to read pages
  const [viewingMode, setViewingMode] = useState<'cover' | 'content'>('cover');
  const [displayMode, setDisplayMode] = useState<'paginated' | 'full'>('full');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isFlipping, setIsFlipping] = useState<boolean>(false);
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev'>('next');

  const handlePageChange = (newPage: number, direction: 'next' | 'prev', scroll: boolean = false) => {
    if (newPage === currentPage || isFlipping) return;
    setFlipDirection(direction);
    setIsFlipping(true);
    setTimeout(() => {
      setCurrentPage(newPage);
      setIsFlipping(false);
      if (scroll) {
        window.scrollTo({ top: 180, behavior: 'smooth' });
      }
    }, 280);
  };

  useEffect(() => {
    fetchLiteratureDetail();
    // Reset to cover page when switching literature
    setViewingMode('cover');
    setCurrentPage(1);
    setIsFlipping(false);
  }, [literatureId, user]);

  const fetchLiteratureDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('literature_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/reader/literature/${literatureId}`, { headers });
      if (!res.ok) {
        throw new Error('Failed to retrieve archival manuscript.');
      }

      const data = await res.json();
      const item = data.literature;
      setLiterature(item);
      setAverageRating(item.averageRating || 0);
      setTotalRatingsCount(item.totalRatingsCount || 0);
      setSavesCount(item.totalSavesCount || 0);
      setLikesCount(item.likesCount || 0);
      setDownvotesCount(item.downvotesCount || 0);
      if (item.userVote) setUserVote(item.userVote);
      if (item.isSaved !== undefined) setIsSaved(item.isSaved);
      if (item.userRating) setUserRating(item.userRating);

      // Check if item is saved in user's library if authenticated
      if (token && user) {
        try {
          const savedRes = await fetch('/api/reader/saved', {
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
      const res = await fetch(`/api/reader/literature/${literatureId}/ratings`, {
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
      const res = await fetch(`/api/reader/literature/${literatureId}/save`, {
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

  // Vote System: Like and Downvote Handler
  const handleVote = async (type: 'LIKE' | 'DOWNVOTE') => {
    if (!user) {
      setFeedbackMessage(`Please sign in to ${type === 'LIKE' ? 'like' : 'downvote'} this classical work.`);
      onOpenAuth('login');
      return;
    }

    try {
      setVoteLoading(true);
      setFeedbackMessage(null);
      const token = localStorage.getItem('literature_token');
      const res = await fetch(`/api/reader/literature/${literatureId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to register vote.');
      }

      const data = await res.json();
      setUserVote(data.userVote);
      setLikesCount(data.likesCount);
      setDownvotesCount(data.downvotesCount);
      setFeedbackMessage(data.message);
    } catch (err: any) {
      console.error('Vote error:', err);
      setFeedbackMessage(err.message || 'Error recording vote.');
    } finally {
      setVoteLoading(false);
    }
  };

  // Share Handler with Native Web Share API + Clipboard Fallback
  const handleShare = async () => {
    if (!literature) return;
    const shareUrl = `${window.location.origin}/#literature-${literature.id}`;
    const shareData = {
      title: literature.title,
      text: `Read "${literature.title}" ${literature.creator ? `by ${literature.creator.name}` : ''} on Athenæum Classic Literature Sanctuary.`,
      url: shareUrl,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        setFeedbackMessage('Shared successfully.');
        return;
      } catch (err) {
        // Dismissed by user
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedShare(true);
      setFeedbackMessage('Sanctuary share link copied to clipboard!');
      setTimeout(() => setCopiedShare(false), 2500);
    } catch (err) {
      setFeedbackMessage(`Share link: ${shareUrl}`);
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
            <>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setDisplayMode(displayMode === 'full' ? 'paginated' : 'full')}
                id="btn-toggle-display-mode"
                title={displayMode === 'full' ? 'Switch to 3D Page-by-Page View' : 'Switch to Full Literature View'}
              >
                {displayMode === 'full' ? (
                  <>
                    <BookOpen size={14} style={{ marginRight: '4px' }} />
                    <span>Page-by-Page View</span>
                  </>
                ) : (
                  <>
                    <AlignLeft size={14} style={{ marginRight: '4px' }} />
                    <span>Full Literature View</span>
                  </>
                )}
              </button>

              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setViewingMode('cover')}
                id="btn-return-cover-page"
                title="Return to Manuscript Cover Page"
              >
                <Layers size={14} style={{ marginRight: '4px' }} />
                <span>Cover Page</span>
              </button>
            </>
          )}

          {/* Reader Like Action */}
          <button
            className={`btn ${userVote === 'LIKE' ? 'btn-primary' : 'btn-secondary'} btn-sm btn-vote-like`}
            onClick={() => handleVote('LIKE')}
            disabled={voteLoading}
            id="btn-reader-like"
            title={userVote === 'LIKE' ? 'Unlike this literature' : 'Like this literature'}
          >
            <ThumbsUp
              size={14}
              fill={userVote === 'LIKE' ? 'currentColor' : 'transparent'}
              style={{ marginRight: '4px' }}
            />
            <span>Like</span>
            <span style={{ opacity: 0.9, marginLeft: '4px', fontWeight: 600 }}>({likesCount})</span>
          </button>

          {/* Reader Downvote Action */}
          <button
            className={`btn ${userVote === 'DOWNVOTE' ? 'btn-primary' : 'btn-secondary'} btn-sm btn-vote-downvote`}
            onClick={() => handleVote('DOWNVOTE')}
            disabled={voteLoading}
            id="btn-reader-downvote"
            title={userVote === 'DOWNVOTE' ? 'Remove downvote' : 'Downvote this literature'}
          >
            <ThumbsDown
              size={14}
              fill={userVote === 'DOWNVOTE' ? 'currentColor' : 'transparent'}
              style={{ marginRight: '4px' }}
            />
            <span>Downvote</span>
            <span style={{ opacity: 0.9, marginLeft: '4px', fontWeight: 600 }}>({downvotesCount})</span>
          </button>

          {/* Reader Share Action */}
          <button
            className="btn btn-secondary btn-sm btn-reader-share"
            onClick={handleShare}
            id="btn-reader-share"
            title="Share this literature"
          >
            {copiedShare ? (
              <>
                <Check size={14} style={{ marginRight: '4px', color: 'var(--accent-gold)' }} />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Share2 size={14} style={{ marginRight: '4px' }} />
                <span>Share</span>
              </>
            )}
          </button>

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
                      src={
                        literature.coverImage.startsWith('http') || literature.coverImage.startsWith('data:')
                          ? literature.coverImage
                          : literature.coverImage.startsWith('/uploads')
                          ? `${literature.coverImage}`
                          : literature.coverImage
                      }
                      alt={`Cover artwork for ${literature.title}`}
                      className="cover-page-main-img"
                      id="reader-cover-image"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=85';
                      }}
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

              <div className="cover-page-actions" style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-open-manuscript"
                  onClick={() => {
                    setViewingMode('content');
                    setDisplayMode('full');
                    setCurrentPage(1);
                  }}
                  id="btn-open-full-literature"
                  title="Open and read the entire literary work in continuous folio view"
                >
                  <AlignLeft size={18} />
                  <span>Read Full Literature</span>
                </button>

                <button
                  type="button"
                  className="btn btn-secondary btn-open-manuscript"
                  onClick={() => {
                    setViewingMode('content');
                    setDisplayMode('paginated');
                    setCurrentPage(1);
                  }}
                  id="btn-open-manuscript"
                  title="Open manuscript in traditional 3D page-by-page physical book view"
                >
                  <BookOpen size={18} />
                  <span>Begin Reading Manuscript (Page by Page)</span>
                </button>
              </div>

              {/* Cover Page Reaction Toolbar: Like, Downvote, Share */}
              <div className="cover-page-reactions-toolbar" style={{ marginTop: '1.25rem', display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={`btn-reader-reaction ${userVote === 'LIKE' ? 'active-like' : ''}`}
                  onClick={() => handleVote('LIKE')}
                  disabled={voteLoading}
                  id="btn-cover-like"
                  title={userVote === 'LIKE' ? 'Unlike this literature' : 'Like this literature'}
                >
                  <ThumbsUp
                    size={16}
                    fill={userVote === 'LIKE' ? 'currentColor' : 'transparent'}
                  />
                  <span>Like</span>
                  <span className="reaction-count-pill">({likesCount})</span>
                </button>

                <button
                  type="button"
                  className={`btn-reader-reaction ${userVote === 'DOWNVOTE' ? 'active-downvote' : ''}`}
                  onClick={() => handleVote('DOWNVOTE')}
                  disabled={voteLoading}
                  id="btn-cover-downvote"
                  title={userVote === 'DOWNVOTE' ? 'Remove downvote' : 'Downvote this literature'}
                >
                  <ThumbsDown
                    size={16}
                    fill={userVote === 'DOWNVOTE' ? 'currentColor' : 'transparent'}
                  />
                  <span>Downvote</span>
                  <span className="reaction-count-pill">({downvotesCount})</span>
                </button>

                <button
                  type="button"
                  className="btn-reader-reaction btn-reader-share"
                  onClick={handleShare}
                  id="btn-cover-share"
                  title="Share this literature"
                >
                  {copiedShare ? (
                    <>
                      <Check size={16} style={{ color: '#27ae60' }} />
                      <span style={{ color: '#27ae60', fontWeight: 600 }}>Copied Link!</span>
                    </>
                  ) : (
                    <>
                      <Share2 size={16} />
                      <span>Share</span>
                    </>
                  )}
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

          {/* View Mode Banner / Selector inside Article */}
          <div className="reader-view-mode-bar" id="reader-view-mode-bar">
            <div className="view-mode-tab-group">
              <button
                type="button"
                className={`view-mode-tab ${displayMode === 'full' ? 'active' : ''}`}
                onClick={() => setDisplayMode('full')}
                id="tab-mode-full"
                title="Reads the entire work in continuous, scrollable layout"
              >
                <span>📜 Full Literature View</span>
              </button>
              <button
                type="button"
                className={`view-mode-tab ${displayMode === 'paginated' ? 'active' : ''}`}
                onClick={() => setDisplayMode('paginated')}
                id="tab-mode-paginated"
                title="Interactive 3D physical book page-turn animation with flip transitions"
              >
                <span>📖 Page-by-Page Book View</span>
              </button>
            </div>
          </div>

          {displayMode === 'paginated' ? (
            <>
              {/* Pagination Controls Top */}
              <div className="reader-page-controls" id="reader-page-controls-top">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={currentPage <= 1 || isFlipping}
                  onClick={() => handlePageChange(currentPage - 1, 'prev')}
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
                  disabled={currentPage >= totalPages || isFlipping}
                  onClick={() => handlePageChange(currentPage + 1, 'next')}
                  id="btn-next-page"
                >
                  <span>Next Page</span>
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Current Page Literary Content with 3D Physical Parchment Page Turn Animation */}
              <div className="book-page-viewport">
                <div className={`book-page-sheet ${isFlipping ? (flipDirection === 'next' ? 'flipping-next' : 'flipping-prev') : 'page-settled'}`}>
                  <div className="book-page-inner-folio">
                    <div className="folio-header-indicator">
                      <span>Folio {currentPage}</span>
                      <span>{literature.title}</span>
                      <span>{literature.language}</span>
                    </div>

                    <div className="reader-content-body" id="reader-body-paragraphs">
                      {currentContentPageText.split('\n\n').map((para, index) => (
                        <p key={index}>{para}</p>
                      ))}
                    </div>

                    <div className="folio-footer-indicator">
                      <span>Athenæum Classic Manuscript Edition</span>
                      <span>— {currentPage} —</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pagination Controls Bottom */}
              <div className="reader-page-controls" id="reader-page-controls-bottom" style={{ marginTop: '2.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={currentPage <= 1 || isFlipping}
                  onClick={() => handlePageChange(currentPage - 1, 'prev', true)}
                  id="btn-prev-page-bottom"
                >
                  <ChevronLeft size={16} />
                  <span>Previous Page</span>
                </button>

                <span className="reader-page-indicator">
                  Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
                </span>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={currentPage >= totalPages || isFlipping}
                  onClick={() => handlePageChange(currentPage + 1, 'next', true)}
                  id="btn-next-page-bottom"
                >
                  <span>Next Page</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </>
          ) : (
            /* FULL LITERATURE CONTINUOUS DISPLAY: Displays all pages/chapters in chronological manuscript sequence */
            <div className="full-literature-container" id="full-literature-container">
              {/* Quick Jump Index Pill Bar */}
              <div className="folio-quick-index-bar">
                <span className="quick-index-label">Folios & Chapters:</span>
                <div className="quick-index-chips">
                  {pages.map((_, idx) => (
                    <a
                      key={idx}
                      href={`#folio-section-${idx + 1}`}
                      className="folio-chip-link"
                    >
                      {idx + 1}
                    </a>
                  ))}
                </div>
              </div>

              {/* All Pages Rendered Chronologically */}
              <div className="full-literature-folios-list" id="reader-body-paragraphs">
                {pages.map((pageText, pageIndex) => (
                  <section
                    key={pageIndex}
                    id={`folio-section-${pageIndex + 1}`}
                    className="full-literature-folio-card"
                  >
                    <div className="full-folio-header">
                      <div className="full-folio-badge">
                        <span>Folio {pageIndex + 1} of {totalPages}</span>
                      </div>
                      <div className="full-folio-title-mini">
                        <span>{literature.title}</span>
                      </div>
                    </div>

                    <div className="reader-content-body full-mode-body">
                      {pageText.split('\n\n').map((para, pIdx) => (
                        <p key={pIdx}>{para}</p>
                      ))}
                    </div>

                    <div className="full-folio-footer">
                      <span className="full-folio-rule">❦</span>
                      <span className="full-folio-page-num">— {pageIndex + 1} —</span>
                    </div>
                  </section>
                ))}
              </div>
            </div>
          )}

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

        <div className="reader-reaction-section" style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          <button
            type="button"
            className={`btn-reader-reaction ${userVote === 'LIKE' ? 'active-like' : ''}`}
            onClick={() => handleVote('LIKE')}
            disabled={voteLoading}
            id="btn-eval-like"
            title={userVote === 'LIKE' ? 'Unlike this literature' : 'Like this literature'}
          >
            <ThumbsUp
              size={18}
              fill={userVote === 'LIKE' ? 'currentColor' : 'transparent'}
            />
            <span>Like Work</span>
            <span className="reaction-count-pill">({likesCount})</span>
          </button>

          <button
            type="button"
            className={`btn-reader-reaction ${userVote === 'DOWNVOTE' ? 'active-downvote' : ''}`}
            onClick={() => handleVote('DOWNVOTE')}
            disabled={voteLoading}
            id="btn-eval-downvote"
            title={userVote === 'DOWNVOTE' ? 'Remove downvote' : 'Downvote this literature'}
          >
            <ThumbsDown
              size={18}
              fill={userVote === 'DOWNVOTE' ? 'currentColor' : 'transparent'}
            />
            <span>Downvote Work</span>
            <span className="reaction-count-pill">({downvotesCount})</span>
          </button>

          <button
            type="button"
            className="btn-reader-reaction btn-reader-share"
            onClick={handleShare}
            id="btn-eval-share"
            title="Share this literature with colleagues"
          >
            {copiedShare ? (
              <>
                <Check size={18} style={{ color: '#27ae60' }} />
                <span style={{ color: '#27ae60', fontWeight: 600 }}>Copied Link!</span>
              </>
            ) : (
              <>
                <Share2 size={18} />
                <span>Share Literature</span>
              </>
            )}
          </button>
        </div>

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
