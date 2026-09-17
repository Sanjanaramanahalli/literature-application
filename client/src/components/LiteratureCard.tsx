import React from 'react';
import './LiteratureCard.css';

export interface LiteratureItem {
  id: string;
  title: string;
  subheading?: string | null;
  brief?: string | null;
  language: string;
  genre: string;
  coverImage?: string | null;
  publicationDate: string;
  creator?: {
    id: string;
    name: string;
    bio?: string | null;
  } | null;
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  tags?: string[];
  totalRatingsCount: number;
  averageRating: number;
  totalSavesCount: number;
  totalCommentsCount: number;
  likesCount?: number;
  downvotesCount?: number;
  userVote?: 'LIKE' | 'DOWNVOTE' | null;
  popularityScore?: number;
}

interface LiteratureCardProps {
  item: LiteratureItem;
  badge?: string;
  badgeType?: 'popularity' | 'release' | 'category';
  onSelect?: (item: LiteratureItem) => void;
  layout?: 'card' | 'plate' | 'compact';
}

export const LiteratureCard: React.FC<LiteratureCardProps> = ({
  item,
  badge,
  badgeType = 'category',
  onSelect,
  layout = 'card',
}) => {
  const formattedDate = item.publicationDate
    ? new Date(item.publicationDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
      })
    : null;

  // Fallback cover if image fails or not provided
  let coverSrc = item.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80';
  if (coverSrc.startsWith('/uploads')) {
    coverSrc = `${coverSrc}`;
  }

  return (
    <article
      className={`literature-card layout-${layout}`}
      data-testid="literature-card"
      id={`literature-card-${item.id}`}
      onClick={() => onSelect && onSelect(item)}
    >
      <div className="card-cover-wrapper">
        <img
          src={coverSrc}
          alt={`Cover for ${item.title}`}
          className="card-cover-img"
          loading="lazy"
          onError={(e) => {
            // graceful fallback to placeholder book cover
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80';
          }}
        />
        {badge && (
          <span className={`card-ribbon ribbon-${badgeType}`}>
            {badge}
          </span>
        )}
      </div>

      <div className="card-content">
        <div className="card-meta-top">
          {item.category && (
            <span className="tag-badge category-pill" data-testid="card-category">
              {item.category.name}
            </span>
          )}
          {item.genre && (
            <span className="card-genre">{item.genre}</span>
          )}
        </div>

        <h3 className="card-title" title={item.title}>
          {item.title}
        </h3>

        {item.subheading && (
          <p className="card-subheading">{item.subheading}</p>
        )}

        {item.creator && (
          <p className="card-author" data-testid="card-author">
            <span className="by-prefix">By</span>{' '}
            <strong className="author-name">{item.creator.name}</strong>
          </p>
        )}

        {item.brief && layout !== 'compact' && (
          <p className="card-brief">
            {item.brief.length > 140 ? `${item.brief.substring(0, 140)}...` : item.brief}
          </p>
        )}

        <div className="card-footer">
          <div className="card-rating" title={`${item.averageRating} average rating from ${item.totalRatingsCount} reviews`}>
            <span className="star-icon">★</span>
            <span className="rating-val">
              {item.averageRating > 0 ? item.averageRating.toFixed(1) : 'New'}
            </span>
            <span className="rating-count">({item.totalRatingsCount})</span>
          </div>

          <div className="card-metrics">
            <span className="metric-item" title={`${item.totalSavesCount} readers saved this work`}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
              </svg>
              <span>{item.totalSavesCount}</span>
            </span>

            <span className="metric-item" title={`${item.totalCommentsCount} scholarly comments`}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              <span>{item.totalCommentsCount}</span>
            </span>

            {item.likesCount !== undefined && (
              <span className="metric-item" title={`${item.likesCount} readers liked this work`}>
                <span style={{ fontSize: '0.82rem' }}>👍</span>
                <span>{item.likesCount}</span>
              </span>
            )}

            {item.popularityScore !== undefined && (
              <span className="metric-score" title="Popularity Score (Ratings + Saves + Comments + Likes)">
                Score: {item.popularityScore}
              </span>
            )}
          </div>
        </div>

        {/* Quick Action Interactive Toolbar: Like, Downvote, Share */}
        <div className="card-quick-actions" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="card-action-btn"
            title={`Read and like ${item.title}`}
            onClick={(e) => {
              e.stopPropagation();
              if (onSelect) onSelect(item);
            }}
          >
            <span>👍 Like</span>
            {item.likesCount ? <span className="action-pill-count">{item.likesCount}</span> : null}
          </button>

          <button
            type="button"
            className="card-action-btn"
            title={`Read and downvote ${item.title}`}
            onClick={(e) => {
              e.stopPropagation();
              if (onSelect) onSelect(item);
            }}
          >
            <span>👎 Downvote</span>
            {item.downvotesCount ? <span className="action-pill-count">{item.downvotesCount}</span> : null}
          </button>

          <button
            type="button"
            className="card-action-btn btn-card-share"
            title="Share this literature"
            onClick={async (e) => {
              e.stopPropagation();
              const shareUrl = `${window.location.origin}/#literature-${item.id}`;
              const shareData = {
                title: item.title,
                text: `Read "${item.title}" ${item.creator ? `by ${item.creator.name}` : ''} on Athenæum Classic Literature Sanctuary.`,
                url: shareUrl,
              };

              if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
                try {
                  await navigator.share(shareData);
                  return;
                } catch (err) {
                  // User dismissed or fallback
                }
              }

              try {
                await navigator.clipboard.writeText(shareUrl);
                const btn = e.currentTarget;
                const originalText = btn.innerHTML;
                btn.innerHTML = '<span>✓ Copied!</span>';
                setTimeout(() => {
                  btn.innerHTML = originalText;
                }, 2000);
              } catch (err) {
                alert(`Share URL: ${shareUrl}`);
              }
            }}
          >
            <span>🔗 Share</span>
          </button>
        </div>

        {formattedDate && (
          <div className="card-pub-date">
            <span>Published: {formattedDate}</span>
          </div>
        )}
      </div>
    </article>
  );
};
