import React, { useState, useEffect } from 'react';
import { Bookmark, Trash2, BookOpen, Star, Calendar } from 'lucide-react';
import './SavedWorksView.css';

interface SavedWork {
  id: string;
  title: string;
  subheading?: string | null;
  brief?: string | null;
  creator?: {
    name: string;
  } | null;
  category?: {
    name: string;
  } | null;
  averageRating: number;
  totalRatingsCount: number;
  savedAt: string;
}

interface SavedWorksViewProps {
  user: any;
  onSelectLiterature: (id: string) => void;
  onNavigateExplore: () => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export const SavedWorksView: React.FC<SavedWorksViewProps> = ({
  user,
  onSelectLiterature,
  onNavigateExplore,
  onOpenAuth,
}) => {
  const [savedWorks, setSavedWorks] = useState<SavedWork[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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

      const res = await fetch('/api/reader/saved', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch personal reading sanctuary.');
      }

      const data = await res.json();
      setSavedWorks(data.savedWorks || []);
    } catch (err: any) {
      console.error('Fetch saved works error:', err);
      setError(err.message || 'Error loading saved literature.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (literatureId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem('literature_token');
      const res = await fetch(`/api/reader/literature/${literatureId}/save`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setSavedWorks((prev) => prev.filter((w) => w.id !== literatureId));
      }
    } catch (err) {
      console.error('Failed to remove saved work:', err);
    }
  };

  if (!user) {
    return (
      <div className="saved-empty-state" id="saved-unauth-state">
        <div className="saved-empty-icon">🔖</div>
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
          Your hand-curated collection of preserved manuscripts, essays, and philosophical treatises.
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
          <button className="btn btn-secondary" onClick={fetchSavedWorks}>
            Retry Loading
          </button>
        </div>
      ) : savedWorks.length === 0 ? (
        <div className="saved-empty-state" id="saved-empty-state">
          <div className="saved-empty-icon">📖</div>
          <h2 className="serif-title saved-empty-title">Your Reading Shelf is Empty</h2>
          <p className="saved-empty-desc">
            You have not yet added any manuscripts to your personal collection. Explore the compendium and bookmark works for deep study.
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
              <span>{savedWorks.length} {savedWorks.length === 1 ? 'Manuscript Saved' : 'Manuscripts Saved'}</span>
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

              return (
                <article
                  key={work.id}
                  className="saved-card"
                  id={`saved-card-${work.id}`}
                  data-testid="saved-card"
                >
                  <div className="saved-card-header">
                    {work.category && (
                      <span className="tag-badge burgundy">{work.category.name}</span>
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
                      onClick={() => onSelectLiterature(work.id)}
                      title={`Read ${work.title}`}
                    >
                      {work.title}
                    </h3>

                    {work.creator && (
                      <p className="saved-card-author">
                        By <strong>{work.creator.name}</strong>
                      </p>
                    )}

                    {work.brief && (
                      <p className="saved-card-brief">
                        {work.brief.length > 120 ? `${work.brief.substring(0, 120)}...` : work.brief}
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="saved-card-meta">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Star size={14} fill="var(--accent-gold)" color="var(--accent-gold)" />
                        <strong style={{ color: 'var(--accent-burgundy)' }}>
                          {work.averageRating > 0 ? work.averageRating.toFixed(1) : 'New'}
                        </strong>
                        <span>({work.totalRatingsCount})</span>
                      </div>
                    </div>

                    <div className="saved-card-actions">
                      <button
                        className="btn btn-primary btn-sm btn-read-now"
                        onClick={() => onSelectLiterature(work.id)}
                        id={`btn-read-saved-${work.id}`}
                      >
                        <BookOpen size={14} style={{ marginRight: '4px' }} />
                        Read Work
                      </button>

                      <button
                        className="btn-unsave"
                        onClick={(e) => handleRemove(work.id, e)}
                        title="Remove from Reading Sanctuary"
                        id={`btn-remove-saved-${work.id}`}
                      >
                        <Trash2 size={14} />
                        <span>Remove</span>
                      </button>
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
