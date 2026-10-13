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
  ExternalLink,
  ZoomIn,
  ZoomOut,
  Sun,
  Moon,
  Coffee,
  Volume2,
  VolumeX,
  Search,
  Sliders,
  MoreHorizontal,
} from 'lucide-react';
import { ThreadedComments } from './ThreadedComments';
import { WhatsAppAiAssistant } from './WhatsAppAiAssistant';
import type { LiteratureItem } from './LiteratureCard';
import './ReaderView.css';

interface ReaderViewProps {
  literatureId: string;
  user: any;
  onBack: () => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onSearchExternal?: (queryText: string, languageCode?: string) => void;
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
  onSearchExternal,
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
  const [wordsPerPage, setWordsPerPage] = useState<number>(85);
  const [jumpPageInput, setJumpPageInput] = useState<string>('');
  const [showReaderSettings, setShowReaderSettings] = useState<boolean>(false);

  // Text Selection / Scholar Wikimedia Discovery Tooltip State
  const [selectedText, setSelectedText] = useState<string>('');
  const [selectionTooltipPos, setSelectionTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Text Selection Listener
  const handleSelectionChange = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setSelectionTooltipPos(null);
      setSelectedText('');
      return;
    }

    const text = selection.toString().trim();
    if (!text || text.length < 2) {
      setSelectionTooltipPos(null);
      setSelectedText('');
      return;
    }

    // Check that selection is inside literature reader
    try {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (rect && rect.width > 0) {
        // Intelligent extraction for paragraphs: if longer than 120 chars, extract salient keywords
        let queryToSearch = text;
        if (text.length > 120) {
          const sentences = text.split(/[।.\n]/).filter(s => s.trim().length > 0);
          queryToSearch = sentences[0]?.trim() || text.substring(0, 80);
        }

        setSelectedText(queryToSearch);
        setSelectionTooltipPos({
          x: Math.max(10, rect.left + rect.width / 2),
          y: Math.max(10, rect.top + window.scrollY - 46),
        });
      }
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    const handleMouseUp = () => {
      setTimeout(handleSelectionChange, 100);
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchend', handleMouseUp);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchend', handleMouseUp);
    };
  }, []);

  // Professional Reader Customization States (Font size, Theme, Audio Narration)
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large' | 'xlarge'>('medium');
  const [readerTheme, setReaderTheme] = useState<'parchment' | 'ivory' | 'sepia' | 'night'>('parchment');
  const [isNarrating, setIsNarrating] = useState<boolean>(false);

  // Text-To-Speech Narration Toggle
  const handleToggleNarration = () => {
    if (!('speechSynthesis' in window)) {
      setFeedbackMessage('Audio narration is not supported in this browser.');
      return;
    }

    if (isNarrating) {
      window.speechSynthesis.cancel();
      setIsNarrating(false);
      setFeedbackMessage('Audio narration paused.');
    } else {
      window.speechSynthesis.cancel();
      const textToRead = displayMode === 'paginated' ? (pages[currentPage - 1] || literature?.content || '') : (literature?.content || '');
      const utterance = new SpeechSynthesisUtterance(textToRead.slice(0, 3000));
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsNarrating(false);
      utterance.onerror = () => setIsNarrating(false);
      window.speechSynthesis.speak(utterance);
      setIsNarrating(true);
      setFeedbackMessage('Classical audio narration started.');
    }
  };

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);



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
      // isSaved and userRating come directly from the detail endpoint (server-side, DB-sourced).
      // DO NOT re-fetch /api/reader/saved to overwrite this — that second fetch was redundant
      // and could race with the first, silently reverting isSaved to false on token edge-cases.
      setIsSaved(item.isSaved === true);
      if (item.userRating) setUserRating(item.userRating);
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
      if (!token) {
        setFeedbackMessage('Please sign in to register your scholarly rating.');
        onOpenAuth('login');
        return;
      }

      const res = await fetch(`/api/reader/literature/${literatureId}/ratings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ value: stars }),
      });

      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('literature_token');
        localStorage.removeItem('literature_user');
        setFeedbackMessage('Your session has expired. Please sign in again to submit your rating.');
        onOpenAuth('login');
        return;
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
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
      if (!token) {
        setFeedbackMessage('Please sign in to save this work to your personal sanctuary.');
        onOpenAuth('login');
        return;
      }

      const res = await fetch(`/api/reader/literature/${literatureId}/save`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('literature_token');
        localStorage.removeItem('literature_user');
        setFeedbackMessage('Your session has expired. Please sign in again to save this work.');
        onOpenAuth('login');
        return;
      }

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
      if (!token) {
        setFeedbackMessage(`Please sign in to ${type === 'LIKE' ? 'like' : 'downvote'} this classical work.`);
        onOpenAuth('login');
        return;
      }

      const res = await fetch(`/api/reader/literature/${literatureId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type }),
      });

      if (res.status === 401 || res.status === 403) {
        // Session token is invalid or expired
        localStorage.removeItem('literature_token');
        localStorage.removeItem('literature_user');
        setFeedbackMessage('Your session has expired. Please sign in again to record your vote.');
        onOpenAuth('login');
        return;
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to record vote.');
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

  // Split content into pages (explicit page breaks OR standard book pagination chunks)
  const getPages = (text: string, chunkSize: number = 85): string[] => {
    if (!text || !text.trim()) return [''];
    const trimmed = text.trim();
    if (trimmed.includes('---page---') || trimmed.includes('<!-- pagebreak -->') || trimmed.includes('\f')) {
      const parts = trimmed.split(/---page---|<!-- pagebreak -->|\f/g).filter((s) => s.trim().length > 0);
      // If explicit pages exist but user wants more granularity (e.g. 100-200 pages)
      if (parts.length < 50 && chunkSize <= 100) {
        const expanded: string[] = [];
        for (const part of parts) {
          const w = part.trim().split(/\s+/);
          for (let i = 0; i < w.length; i += chunkSize) {
            expanded.push(w.slice(i, i + chunkSize).join(' '));
          }
        }
        return expanded.length > 0 ? expanded : parts;
      }
      return parts.length > 0 ? parts : [trimmed];
    }
    // Split into granular chunks per page
    const words = trimmed.split(/\s+/);
    const pagesArr: string[] = [];
    for (let i = 0; i < words.length; i += chunkSize) {
      pagesArr.push(words.slice(i, i + chunkSize).join(' '));
    }
    return pagesArr.length > 0 ? pagesArr : [trimmed];
  };

  const pages = getPages(literature.content, wordsPerPage);
  const totalPages = pages.length;
  const currentContentPageText = pages[currentPage - 1] || pages[0] || '';

  const handleJumpToPage = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseInt(jumpPageInput.trim(), 10);
    if (!isNaN(target) && target >= 1 && target <= totalPages) {
      handlePageChange(target, target > currentPage ? 'next' : 'prev', true);
      setJumpPageInput('');
    }
  };

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
                    <span>Page-by-Page</span>
                  </>
                ) : (
                  <>
                    <AlignLeft size={14} style={{ marginRight: '4px' }} />
                    <span>Full View</span>
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
                <span>Cover</span>
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
            <span>Like ({likesCount})</span>
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
            <span>({downvotesCount})</span>
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

          {/* Save Action */}
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
            <span>{isSaved ? 'Saved' : 'Save'}</span>
            <span style={{ opacity: 0.8, marginLeft: '4px' }}>({savesCount})</span>
          </button>

          {/* Settings / Display Toggle (Theme, Audio, Font) */}
          <div style={{ position: 'relative' }}>
            <button
              className={`btn ${showReaderSettings ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => setShowReaderSettings(!showReaderSettings)}
              id="btn-reader-settings-toggle"
              title="Reading Sanctuary Display Options (Theme, Audio Narration, Font Scale)"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <Sliders size={14} />
              <span>Options</span>
            </button>

            {showReaderSettings && (
              <div
                className="reader-settings-dropdown"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-classic)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.15)',
                  padding: '12px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  zIndex: 200,
                  minWidth: '240px',
                }}
              >
                {/* Audio Narration inside Options */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Audio Narration:</span>
                  <button
                    className={`btn ${isNarrating ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                    onClick={handleToggleNarration}
                    id="btn-reader-narration"
                    style={{ padding: '3px 8px', fontSize: '0.78rem' }}
                  >
                    {isNarrating ? (
                      <>
                        <VolumeX size={12} style={{ marginRight: '4px' }} />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Volume2 size={12} style={{ marginRight: '4px' }} />
                        <span>Listen</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Theme Selector */}
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Theme:</div>
                  <div className="reader-theme-switcher" style={{ display: 'flex', gap: '4px' }}>
                    <button
                      type="button"
                      className={`theme-pill ${readerTheme === 'parchment' ? 'active' : ''}`}
                      onClick={() => setReaderTheme('parchment')}
                      title="Parchment Theme"
                      style={{ flex: 1, padding: '4px 6px', borderRadius: '4px', border: readerTheme === 'parchment' ? '2px solid var(--accent-burgundy)' : '1px solid var(--border-classic)', background: '#fcf9f2', cursor: 'pointer', fontSize: '0.75rem' }}
                    >
                      📜 Parch
                    </button>
                    <button
                      type="button"
                      className={`theme-pill ${readerTheme === 'ivory' ? 'active' : ''}`}
                      onClick={() => setReaderTheme('ivory')}
                      title="Clean Ivory Theme"
                      style={{ flex: 1, padding: '4px 6px', borderRadius: '4px', border: readerTheme === 'ivory' ? '2px solid var(--accent-burgundy)' : '1px solid var(--border-classic)', background: '#ffffff', cursor: 'pointer', fontSize: '0.75rem' }}
                    >
                      <Sun size={11} style={{ marginRight: '2px', display: 'inline' }} /> Ivory
                    </button>
                    <button
                      type="button"
                      className={`theme-pill ${readerTheme === 'sepia' ? 'active' : ''}`}
                      onClick={() => setReaderTheme('sepia')}
                      title="Warm Sepia Theme"
                      style={{ flex: 1, padding: '4px 6px', borderRadius: '4px', border: readerTheme === 'sepia' ? '2px solid var(--accent-burgundy)' : '1px solid var(--border-classic)', background: '#f4ecd8', cursor: 'pointer', fontSize: '0.75rem' }}
                    >
                      <Coffee size={11} style={{ marginRight: '2px', display: 'inline' }} /> Sepia
                    </button>
                    <button
                      type="button"
                      className={`theme-pill ${readerTheme === 'night' ? 'active' : ''}`}
                      onClick={() => setReaderTheme('night')}
                      title="Scholarly Dark / Night Theme"
                      style={{ flex: 1, padding: '4px 6px', borderRadius: '4px', border: readerTheme === 'night' ? '2px solid #c5a059' : '1px solid var(--border-classic)', background: '#1e140c', color: '#c5a059', cursor: 'pointer', fontSize: '0.75rem' }}
                    >
                      <Moon size={11} style={{ marginRight: '2px', display: 'inline' }} /> Night
                    </button>
                  </div>
                </div>

                {/* Font Scaling */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Text Size:</span>
                  <div className="reader-font-controls" style={{ display: 'inline-flex', gap: '3px', background: 'var(--bg-secondary)', padding: '2px 4px', borderRadius: '4px', border: '1px solid var(--border-classic)' }}>
                    <button
                      type="button"
                      onClick={() => {
                        const sizes: Array<'small' | 'medium' | 'large' | 'xlarge'> = ['small', 'medium', 'large', 'xlarge'];
                        const curIdx = sizes.indexOf(fontSize);
                        if (curIdx > 0) setFontSize(sizes[curIdx - 1]);
                      }}
                      disabled={fontSize === 'small'}
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '2px 6px' }}
                    >
                      <ZoomOut size={13} />
                    </button>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0 6px', alignSelf: 'center', color: 'var(--text-secondary)' }}>
                      {fontSize === 'small' ? '85%' : fontSize === 'medium' ? '100%' : fontSize === 'large' ? '120%' : '140%'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const sizes: Array<'small' | 'medium' | 'large' | 'xlarge'> = ['small', 'medium', 'large', 'xlarge'];
                        const curIdx = sizes.indexOf(fontSize);
                        if (curIdx < sizes.length - 1) setFontSize(sizes[curIdx + 1]);
                      }}
                      disabled={fontSize === 'xlarge'}
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '2px 6px' }}
                    >
                      <ZoomIn size={13} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating / Sticky Alert Toast for Reader Reactions & Actions */}
      {feedbackMessage && (
        <div
          style={{
            maxWidth: '680px',
            margin: '0 auto 1.5rem',
            padding: '0.75rem 1.25rem',
            backgroundColor: '#fcf8e3',
            border: '1px solid #faebcc',
            borderLeft: '4px solid var(--accent-burgundy)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            boxShadow: '0 4px 12px rgba(44, 24, 16, 0.08)',
            animation: 'fadeIn 0.2s ease',
          }}
          id="reader-floating-feedback"
        >
          <span style={{ color: 'var(--accent-burgundy)', fontSize: '0.92rem', fontWeight: 500 }}>
            {feedbackMessage}
          </span>
          {!user && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => onOpenAuth('login')}
              style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
            >
              Sign In
            </button>
          )}
        </div>
      )}

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
                   literature.language === 'Tamil' ? 'தமிழ் இலக்கியத் திரட்டு • Athenæum Edition' :
                   literature.language === 'Telugu' ? 'తెలుగు సాహిత్య సంపుటి • Athenæum Edition' :
                   literature.language === 'Malayalam' ? 'മലയാള സാഹിത്യ ശേഖരം • Athenæum Edition' :
                   literature.language === 'Bengali' ? 'বাংলা সাহিত্য ভাণ্ডার • Athenæum Edition' :
                   literature.language === 'Sanskrit' ? 'संस्कृत साहित्य रत्नावली • Athenæum Edition' :
                   literature.language === 'Marathi' ? 'मराठी साहित्य संग्रह • Athenæum Edition' :
                   literature.language === 'Gujarati' ? 'ગુજરાતી સાહિત્ય વારસો • Athenæum Edition' :
                   literature.language === 'Punjabi' ? 'ਪੰਜਾਬੀ ਸਾਹਿਤ ਸੰਗ੍ਰਹਿ • Athenæum Edition' :
                   literature.language === 'Odia' ? 'ଓଡ଼ିଆ ସାହିତ୍ୟ ସମ୍ଭାର • Athenæum Edition' :
                   literature.language === 'Assamese' ? 'অসমীয়া সাহিত্য সম্ভাৰ • Athenæum Edition' :
                   literature.language === 'Konkani' ? 'कोंकणी साहित्य संग्रह • Athenæum Edition' :
                   `Athenæum Classical ${literature.language || 'Literature'} Edition`}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                  <p className="cover-page-author" id="cover-page-author" style={{ margin: 0 }}>
                    Authored by <strong>{literature.creator.name}</strong>
                  </p>
                  {(() => {
                    const langCodeMap: Record<string, string> = {
                      Kannada: 'kn',
                      Hindi: 'hi',
                      Tamil: 'ta',
                      Telugu: 'te',
                      Malayalam: 'ml',
                      Bengali: 'bn',
                      Marathi: 'mr',
                      Gujarati: 'gu',
                      Punjabi: 'pa',
                      Odia: 'or',
                      Assamese: 'as',
                      Sanskrit: 'sa',
                      Konkani: 'gom',
                      Kashmiri: 'ks',
                      Nepali: 'ne',
                      Sindhi: 'sd',
                      Maithili: 'mai',
                      Manipuri: 'mni',
                      Santali: 'sat',
                      Dogri: 'doi',
                      French: 'fr',
                      German: 'de',
                      Spanish: 'es',
                      Italian: 'it',
                      Russian: 'ru',
                      English: 'en',
                    };
                    const wikiLang = langCodeMap[literature.language] || 'en';
                    return (
                      <a
                        href={`https://${wikiLang}.wikipedia.org/wiki/${encodeURIComponent(literature.creator.name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tag-badge"
                        style={{ fontSize: '0.75rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        title={`Read ${literature.creator.name}'s biography on Wikipedia`}
                      >
                        <span>Author on Wikipedia</span>
                        <ExternalLink size={11} />
                      </a>
                    );
                  })()}
                </div>
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
        <article className={`reader-article-wrapper theme-${readerTheme} font-${fontSize}`} id="reader-article-content">
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


          {displayMode === 'paginated' ? (
            <>
              {/* Pagination Controls Top */}
              <div className="reader-page-controls" id="reader-page-controls-top" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={currentPage <= 1 || isFlipping}
                    onClick={() => handlePageChange(currentPage - 1, 'prev')}
                    id="btn-prev-page"
                  >
                    <ChevronLeft size={16} />
                    <span>Previous</span>
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
                    <span>Next</span>
                    <ChevronRight size={16} />
                  </button>
                </div>

                {/* Direct Jump to Page Input Form */}
                <form onSubmit={handleJumpToPage} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Go to page:</span>
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={jumpPageInput}
                    onChange={(e) => setJumpPageInput(e.target.value)}
                    placeholder={String(currentPage)}
                    style={{
                      width: '60px',
                      padding: '3px 6px',
                      fontSize: '0.82rem',
                      textAlign: 'center',
                      border: '1px solid var(--border-classic)',
                      borderRadius: '4px',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <button type="submit" className="btn btn-secondary btn-sm" style={{ padding: '3px 8px', fontSize: '0.8rem' }}>
                    Go
                  </button>
                </form>

                {/* Page Density Selector: 100-200 pages vs standard */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Manuscript Length:</span>
                  <button
                    type="button"
                    className={`btn ${wordsPerPage === 40 ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                    style={{ padding: '2px 7px', fontSize: '0.75rem' }}
                    onClick={() => { setWordsPerPage(40); setCurrentPage(1); }}
                    title="Compact folios: creates ~150-250 detailed pages"
                  >
                    150-200+ Pages
                  </button>
                  <button
                    type="button"
                    className={`btn ${wordsPerPage === 85 ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                    style={{ padding: '2px 7px', fontSize: '0.75rem' }}
                    onClick={() => { setWordsPerPage(85); setCurrentPage(1); }}
                    title="Classic folios: creates ~80-120 pages"
                  >
                    80-120 Pages
                  </button>
                  <button
                    type="button"
                    className={`btn ${wordsPerPage === 200 ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                    style={{ padding: '2px 7px', fontSize: '0.75rem' }}
                    onClick={() => { setWordsPerPage(200); setCurrentPage(1); }}
                    title="Standard chapters"
                  >
                    Standard
                  </button>
                </div>
              </div>

              {/* Current Page Literary Content with 3D Physical Parchment Page Turn Animation */}
              <div className="book-page-viewport">
                <div className={`book-page-sheet theme-${readerTheme} font-${fontSize} ${isFlipping ? (flipDirection === 'next' ? 'flipping-next' : 'flipping-prev') : 'page-settled'}`}>
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
              <div className="reader-page-controls" id="reader-page-controls-bottom" style={{ marginTop: '2.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
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

                <form onSubmit={handleJumpToPage} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Jump to folio:</span>
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={jumpPageInput}
                    onChange={(e) => setJumpPageInput(e.target.value)}
                    placeholder={String(currentPage)}
                    style={{
                      width: '60px',
                      padding: '3px 6px',
                      fontSize: '0.82rem',
                      textAlign: 'center',
                      border: '1px solid var(--border-classic)',
                      borderRadius: '4px',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <button type="submit" className="btn btn-secondary btn-sm" style={{ padding: '3px 8px', fontSize: '0.8rem' }}>
                    Turn
                  </button>
                </form>
              </div>
            </>
          ) : (
            /* FULL LITERATURE CONTINUOUS DISPLAY: Displays all pages/chapters in chronological manuscript sequence */
            <div className="full-literature-container" id="full-literature-container">

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



      {/* WhatsApp-Style Floating Literature AI Chat Assistant */}
      <WhatsAppAiAssistant
        literatureTitle={literature.title}
        literatureContent={literature.content}
        user={user}
        onOpenAuth={onOpenAuth}
      />

      {/* Floating Text Selection Wikimedia Discovery Tooltip */}
      {selectionTooltipPos && selectedText && onSearchExternal && (
        <div
          className="text-selection-discovery-popup"
          style={{
            position: 'absolute',
            left: `${selectionTooltipPos.x}px`,
            top: `${selectionTooltipPos.y}px`,
            transform: 'translateX(-50%)',
            zIndex: 9999,
            backgroundColor: 'var(--accent-burgundy)',
            color: '#fff',
            borderRadius: '24px',
            boxShadow: '0 4px 18px rgba(0,0,0,0.3)',
            padding: '6px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            border: '1px solid var(--accent-gold)',
          }}
          onClick={(e) => {
            e.stopPropagation();
            onSearchExternal(selectedText);
            setSelectionTooltipPos(null);
          }}
          title={`Search Wikimedia for "${selectedText}"`}
        >
          <Search size={14} style={{ color: 'var(--accent-gold)' }} />
          <span>Search Wikimedia: &ldquo;{selectedText.length > 25 ? `${selectedText.slice(0, 25)}…` : selectedText}&rdquo;</span>
        </div>
      )}
    </div>
  );
};
