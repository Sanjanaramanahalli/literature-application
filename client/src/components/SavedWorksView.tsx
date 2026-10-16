import React, { useState, useEffect } from 'react';
import { Bookmark, Trash2, BookOpen, Star, Calendar, Globe, Tag } from 'lucide-react';
import type { ExternalWorkDetail } from './ExternalLiteratureReader';
import { getApiUrl } from '../config/api';
import './SavedWorksView.css';

interface SavedWork {
  id: string;
  externalId?: string;
  title: string;
  originalTitle?: string;
  subheading?: string | null;
  brief?: string | null;
  language?: string | null;
  languageCode?: string | null;
  genre?: string | null;
  coverImage?: string | null;
  publicationDate?: string | null;
  creator?: {
    name: string;
  } | null;
  category?: {
    name: string;
  } | null;
  averageRating: number;
  totalRatingsCount: number;
  savedAt: string;
  source?: 'APPLICATION' | 'WIKIMEDIA';
  sourceLabel?: string;
  sourceUrl?: string;
  canonicalUrl?: string;
  isFullTextAvailable?: boolean;
  fullTextSource?: 'Wikisource' | 'None';
  fullTextUrl?: string;
}

interface SavedWorksViewProps {
  user: any;
  onSelectLiterature: (id: string) => void;
  onSelectExternalWork?: (work: ExternalWorkDetail) => void;
  onNavigateExplore: () => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export const SavedWorksView: React.FC<SavedWorksViewProps> = ({
  user,
  onSelectLiterature,
  onSelectExternalWork,
  onNavigateExplore,
  onOpenAuth,
}) => {
  const [savedWorks, setSavedWorks] = useState<SavedWork[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      fetchSavedWorks();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchSavedWorks = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('literature_token');

      if (!token) {
        setError('Your session has expired or you are not signed in. Please sign in again.');
        return;
      }

      const res = await fetch(getApiUrl('/api/reader/saved'), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          setError('Your session has expired. Please sign in again to access your reading sanctuary.');
          return;
        }
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch personal reading sanctuary.');
      }

      const data = await res.json();
      const serverSaved = data.savedWorks || [];

      // Dual-Persistence: Cache saved works by user ID in localStorage so they survive serverless cold starts
      const userKey = `literature_saved_${user?.id || user?.email || 'default'}`;
      let cachedWorks: SavedWork[] = [];
      try {
        const rawCached = localStorage.getItem(userKey);
        if (rawCached) cachedWorks = JSON.parse(rawCached);
      } catch (e) {
        // ignore parse error
      }

      // Merge server works with locally cached works to prevent cold-start loss
      const mergedMap = new Map<string, SavedWork>();
      cachedWorks.forEach((w) => mergedMap.set(w.externalId || w.id, w));
      serverSaved.forEach((w: SavedWork) => mergedMap.set(w.externalId || w.id, w));
      const combined = Array.from(mergedMap.values());

      try {
        localStorage.setItem(userKey, JSON.stringify(combined));
      } catch (e) {
        // ignore quota error
      }

      setSavedWorks(combined);
    } catch (err: any) {
      console.error('Fetch saved works error:', err);
      // Fallback to locally cached saved works if server had a cold-boot disconnect
      const userKey = `literature_saved_${user?.id || user?.email || 'default'}`;
      try {
        const rawCached = localStorage.getItem(userKey);
        if (rawCached) {
          const cached = JSON.parse(rawCached);
          if (cached.length > 0) {
            setSavedWorks(cached);
            return;
          }
        }
      } catch (e) {}
      setError(err.message || 'Error loading saved literature.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (work: SavedWork, e: React.MouseEvent) => {
    e.stopPropagation();
    const workKey = work.externalId || work.id;

    if (removingIds.has(workKey)) return;
    setRemovingIds((prev) => new Set(prev).add(workKey));

    try {
      const token = localStorage.getItem('literature_token');
      if (work.source === 'WIKIMEDIA' || work.externalId) {
        // Remove external saved work
        const res = await fetch(getApiUrl('/api/reader/external/save'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            externalId: work.externalId || work.id,
            title: work.title,
            sourceUrl: work.sourceUrl || work.canonicalUrl || 'https://wikipedia.org',
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (!data.saved) {
            setSavedWorks((prev) => prev.filter((w) => (w.externalId || w.id) !== workKey));
          }
        }
      } else {
        // Remove standard DB literature
        const res = await fetch(getApiUrl(`/api/reader/literature/${work.id}/save`), {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (!data.saved) {
            setSavedWorks((prev) => {
              const next = prev.filter((w) => w.id !== work.id);
              const userKey = `literature_saved_${user?.id || user?.email || 'default'}`;
              try {
                localStorage.setItem(userKey, JSON.stringify(next));
              } catch (e) {}
              return next;
            });
          }
        }
      }
    } catch (err) {
      console.error('Failed to remove saved work:', err);
    } finally {
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(workKey);
        return next;
      });
    }
  };

  const handleOpenWork = async (work: SavedWork) => {
    if (work.source === 'WIKIMEDIA' || work.externalId) {
      if (onSelectExternalWork) {
        // Fetch or build ExternalWorkDetail
        const langCode = work.languageCode || 'kn';
        try {
          const res = await fetch(`/api/external/work/${encodeURIComponent(langCode)}/${encodeURIComponent(work.title)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.work) {
              onSelectExternalWork(data.work);
              return;
            }
          }
        } catch (e) {
          console.warn('Could not fetch work full details:', e);
        }

        // Fallback construct
        onSelectExternalWork({
          id: work.externalId || work.id,
          title: work.title,
          language: work.language || 'Classical Literature',
          languageCode: langCode,
          extract: work.brief || '',
          thumbnailUrl: work.coverImage || undefined,
          sourceUrl: work.sourceUrl || work.canonicalUrl || `https://${langCode}.wikipedia.org`,
          isFullTextAvailable: !!work.isFullTextAvailable,
          fullTextSource: work.fullTextSource,
          fullTextUrl: work.fullTextUrl,
          attribution: {
            source: work.sourceLabel || 'Wikimedia',
            license: 'CC BY-SA 4.0',
            url: work.sourceUrl || `https://${langCode}.wikipedia.org`,
          },
        });
      }
    } else {
      onSelectLiterature(work.id);
    }
  };

  if (!user) {
    return (
      <div className="saved-empty-state" id="saved-unauth-state">
        <div className="saved-empty-icon">📖</div>
        <h2 className="serif-title saved-empty-title">Personal Reading Sanctuary</h2>
        <p className="saved-empty-desc">
          Sign in or create an account to curate your private library of classic manuscripts and philosophical reflections.
        </p>
        <button
          className="btn btn-primary"
          onClick={() => onOpenAuth('login')}
          id="btn-saved-login-prompt"
        >
          Sign In to Access Saved Works
        </button>
      </div>
    );
  }

  return (
    <div className="saved-works-container" id="saved-works-view">
      <header className="saved-header">
        <span className="ornament-line">✦ ✦ ✦</span>
        <h1 className="serif-title saved-main-title">Personal Reading Sanctuary</h1>
        <p className="saved-main-subtitle">
          Your curated collection of preserved manuscripts and discovered literary works.
        </p>
      </header>

      {loading ? (
        <div className="saved-loading" id="saved-loading-state">
          <div className="loading-spinner"></div>
          <p className="loading-text serif-title">Retrieving your personal collection...</p>
        </div>
      ) : error ? (
        <div className="saved-empty-state" id="saved-error-state">
          <p>⚠️ {error}</p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1rem', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={fetchSavedWorks}>
              Retry Loading
            </button>
            {error.includes('session') || error.includes('sign in') ? (
              <button className="btn btn-primary" onClick={() => onOpenAuth('login')}>
                Sign In
              </button>
            ) : null}
          </div>
        </div>
      ) : savedWorks.length === 0 ? (
        <div className="saved-empty-state" id="saved-empty-state">
          <div className="saved-empty-icon">📖</div>
          <h2 className="serif-title saved-empty-title">Your Reading Shelf is Empty</h2>
          <p className="saved-empty-desc">
            You have not yet bookmarked any literature to your personal collection. Explore the compendium and bookmark works for deep study.
          </p>
          <button
            className="btn btn-primary"
            onClick={onNavigateExplore}
            id="btn-explore-from-saved"
          >
            Explore Literature Catalog
          </button>
        </div>
      ) : (
        <>
          <div style={{ textAlign: 'center' }}>
            <div className="saved-count-badge" id="saved-count-badge">
              <Bookmark size={15} fill="var(--accent-burgundy)" color="var(--accent-burgundy)" />
              <span>{savedWorks.length} {savedWorks.length === 1 ? 'Work Saved' : 'Works Saved'}</span>
            </div>
          </div>

          <div className="saved-grid" id="saved-works-grid">
            {savedWorks.map((work) => {
              const formattedDate = work.savedAt
                ? new Date(work.savedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : null;

              const workKey = work.externalId || work.id;
              const isRemoving = removingIds.has(workKey);

              return (
                <article
                  key={workKey}
                  className="saved-card"
                  id={`saved-card-${workKey}`}
                  data-testid="saved-card"
                >
                  {work.coverImage && (
                    <div
                      className="saved-card-cover"
                      onClick={() => handleOpenWork(work)}
                      title={`Read ${work.title}`}
                      style={{ cursor: 'pointer' }}
                    >
                      <img
                        src={work.coverImage}
                        alt={`Cover of ${work.title}`}
                        className="saved-card-cover-img"
                        onError={(e) => {
                          (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  <div className="saved-card-body">
                    <div className="saved-card-header">
                      {work.category && (
                        <span className="tag-badge burgundy">{work.category.name}</span>
                      )}
                      {work.sourceLabel && (
                        <span className="tag-badge" style={{ backgroundColor: 'var(--accent-gold-subtle)', color: 'var(--accent-burgundy)' }}>
                          {work.sourceLabel}
                        </span>
                      )}
                      {formattedDate && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          <Calendar size={12} style={{ display: 'inline', marginRight: '3px' }} />
                          {formattedDate}
                        </span>
                      )}
                    </div>

                    <div>
                      <h3
                        className="saved-card-title"
                        onClick={() => handleOpenWork(work)}
                        title={`Read ${work.title}`}
                      >
                        {work.title}
                      </h3>

                      {work.creator && (
                        <p className="saved-card-author">
                          By <strong>{work.creator.name}</strong>
                        </p>
                      )}

                      {(work.language || work.genre) && (
                        <div className="saved-card-metadata">
                          {work.language && (
                            <span className="saved-meta-chip">
                              <Globe size={11} style={{ marginRight: '3px' }} />
                              {work.language}
                            </span>
                          )}
                          {work.genre && (
                            <span className="saved-meta-chip">
                              <Tag size={11} style={{ marginRight: '3px' }} />
                              {work.genre}
                            </span>
                          )}
                        </div>
                      )}

                      {work.brief && (
                        <p className="saved-card-brief">
                          {work.brief.length > 120 ? `${work.brief.substring(0, 120)}...` : work.brief}
                        </p>
                      )}
                    </div>

                    <div>
                      {work.totalRatingsCount > 0 && (
                        <div className="saved-card-meta">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Star size={14} fill="var(--accent-gold)" color="var(--accent-gold)" />
                            <strong style={{ color: 'var(--accent-burgundy)' }}>
                              {work.averageRating.toFixed(1)}
                            </strong>
                            <span>({work.totalRatingsCount})</span>
                          </div>
                        </div>
                      )}

                      <div className="saved-card-actions">
                        <button
                          className="btn btn-primary btn-sm btn-read-now"
                          onClick={() => handleOpenWork(work)}
                          id={`btn-read-saved-${workKey}`}
                        >
                          <BookOpen size={14} style={{ marginRight: '4px' }} />
                          Read Work
                        </button>

                        <button
                          className="btn-unsave"
                          onClick={(e) => handleRemove(work, e)}
                          disabled={isRemoving}
                          title={isRemoving ? 'Removing...' : 'Remove from Reading Sanctuary'}
                          id={`btn-remove-saved-${workKey}`}
                          style={{ opacity: isRemoving ? 0.6 : 1, cursor: isRemoving ? 'not-allowed' : 'pointer' }}
                        >
                          <Trash2 size={14} />
                          <span>{isRemoving ? 'Removing...' : 'Remove'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
