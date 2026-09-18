import React from 'react';
import { MapPin, ArrowRight, Sparkles } from 'lucide-react';

export interface ArtCraftItem {
  id: string;
  name: string;
  localName?: string;
  state: string;
  region?: string;
  district?: string;
  place: string;
  type: string;
  originPeriod: string;
  history: string;
  culturalSignificance: string;
  culturalBackground: string;
  materials: string;
  makingProcess: string;
  traditionalProducts: string;
  modernContext: string;
  coverImage?: string;
  status: string;
}

interface ArtCraftCardProps {
  item: ArtCraftItem;
  onClick: () => void;
}

export const ArtCraftCard: React.FC<ArtCraftCardProps> = ({ item, onClick }) => {
  const fallbackCover = 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=800&q=80';

  return (
    <article
      className="artcraft-card"
      onClick={onClick}
      role="button"
      tabIndex={0}
      id={`artcraft-card-${item.id}`}
      data-testid="artcraft-card"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="artcraft-card-cover">
        <img
          src={item.coverImage || fallbackCover}
          alt={item.name}
          className="artcraft-card-img"
          loading="lazy"
        />
        <span className="artcraft-card-badge">{item.state}</span>
        <span className="artcraft-card-type-badge">{item.type.split('&')[0].trim()}</span>
      </div>

      <div className="artcraft-card-body">
        <div className="artcraft-card-header">
          <h3 className="artcraft-card-name">{item.name}</h3>
          {item.localName && (
            <div className="artcraft-card-local-name" title="Local / Vernacular Name">
              {item.localName}
            </div>
          )}
        </div>

        <div className="artcraft-card-location">
          <MapPin size={13} style={{ color: 'var(--accent-burgundy)' }} />
          <span>
            {item.place}{item.district ? `, ${item.district}` : ''} • {item.state}
          </span>
        </div>

        <div className="artcraft-card-origin-period" title={item.originPeriod}>
          <strong>Origin:</strong> {item.originPeriod.replace(/^Origin period:\s*/i, '').slice(0, 75)}...
        </div>

        <p className="artcraft-card-excerpt">
          {item.culturalSignificance || item.history}
        </p>

        <div className="artcraft-card-footer">
          <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
            <Sparkles size={12} style={{ display: 'inline', marginRight: '4px', color: 'var(--accent-gold)' }} />
            Living Heritage
          </span>
          <span className="artcraft-view-link">
            Explore Craft <ArrowRight size={13} />
          </span>
        </div>
      </div>
    </article>
  );
};
