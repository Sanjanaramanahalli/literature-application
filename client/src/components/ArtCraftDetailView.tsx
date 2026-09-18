import React from 'react';
import {
  ArrowLeft,
  MapPin,
  Hammer,
  BookOpen,
  Sparkles,
  Package,
  Layers,
  Heart,
} from 'lucide-react';
import type { ArtCraftItem } from './ArtCraftCard';
import './ArtCraftView.css';

interface ArtCraftDetailViewProps {
  craft: ArtCraftItem;
  onBack: () => void;
}

export const ArtCraftDetailView: React.FC<ArtCraftDetailViewProps> = ({ craft, onBack }) => {
  const fallbackCover = 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=1200&q=80';

  // Parse materials string into tags
  const materialsList = craft.materials
    ? craft.materials.split(/,|;/).map((m) => m.trim()).filter(Boolean)
    : [];

  // Parse process steps if numbered (1. 2. 3.)
  const rawSteps = craft.makingProcess ? craft.makingProcess.split(/(?=\d+\.\s)/g) : [];
  const processSteps = rawSteps.length > 1
    ? rawSteps.map((s) => s.trim()).filter(Boolean)
    : [craft.makingProcess];

  return (
    <div className="artcraft-detail-view" id="artcraft-detail-view">
      <button className="artcraft-detail-back-btn" onClick={onBack} id="btn-back-to-crafts">
        <ArrowLeft size={16} /> Back to Art & Craft Catalog
      </button>

      <article className="artcraft-detail-card">
        {/* Hero Header with Imagery */}
        <div className="artcraft-detail-hero">
          <img
            src={craft.coverImage || fallbackCover}
            alt={craft.name}
            className="artcraft-detail-hero-img"
          />
          <div className="artcraft-detail-hero-overlay">
            <span className="artcraft-detail-state-badge">
              {craft.state} • {craft.type}
            </span>
            <h1 className="artcraft-detail-title" id="craft-detail-title">
              {craft.name}
            </h1>
            {craft.localName && (
              <div className="artcraft-detail-local-name" id="craft-detail-local-name">
                {craft.localName}
              </div>
            )}
            <div className="artcraft-detail-location-bar">
              <span>
                <MapPin size={15} style={{ color: 'var(--accent-gold)' }} />
                <strong>Place:</strong> {craft.place}
              </span>
              {craft.district && (
                <span>
                  <strong>District:</strong> {craft.district}
                </span>
              )}
              {craft.region && (
                <span>
                  <strong>Region:</strong> {craft.region}
                </span>
              )}
              <span>
                <strong>State:</strong> {craft.state}
              </span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="artcraft-detail-content">
          {/* Origin Period Callout */}
          <div className="artcraft-origin-callout" id="craft-origin-callout">
            <strong>Historical Period of Origin:</strong>
            {craft.originPeriod}
          </div>

          {/* 1. History & Historical Background */}
          <section className="artcraft-section-block" id="craft-section-history">
            <h2 className="artcraft-section-title">
              <BookOpen size={20} /> History & Historical Development
            </h2>
            <p className="artcraft-prose reading-text">{craft.history}</p>
          </section>

          {/* 2. Cultural Significance & Background */}
          <section className="artcraft-section-block" id="craft-section-culture">
            <h2 className="artcraft-section-title">
              <Heart size={20} /> Cultural Significance & Community Traditions
            </h2>
            <p className="artcraft-prose reading-text">{craft.culturalSignificance}</p>
            {craft.culturalBackground && (
              <div className="artcraft-highlight-box">
                <div className="artcraft-highlight-title">Artisan Communities & Ritual Context</div>
                <p style={{ margin: 0, fontSize: '0.96rem', color: 'var(--text-secondary)' }}>
                  {craft.culturalBackground}
                </p>
              </div>
            )}
          </section>

          {/* 3. Traditional Materials */}
          <section className="artcraft-section-block" id="craft-section-materials">
            <h2 className="artcraft-section-title">
              <Layers size={20} /> Traditional Materials Used
            </h2>
            <p className="artcraft-prose reading-text" style={{ marginBottom: '0.5rem' }}>
              {craft.materials}
            </p>
            {materialsList.length > 0 && (
              <div className="artcraft-materials-list">
                {materialsList.map((mat, idx) => (
                  <span key={idx} className="artcraft-material-pill">
                    ✦ {mat}
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* 4. Traditional Making Process */}
          <section className="artcraft-section-block" id="craft-section-making-process">
            <h2 className="artcraft-section-title">
              <Hammer size={20} /> Traditional Making Process
            </h2>
            <ul className="artcraft-process-steps">
              {processSteps.map((step, idx) => (
                <li key={idx} className="artcraft-process-step">
                  {step}
                </li>
              ))}
            </ul>
          </section>

          {/* 5. Famous Products & Modern Context */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
            {craft.traditionalProducts && (
              <div className="artcraft-highlight-box" style={{ marginTop: 0 }} id="craft-box-products">
                <div className="artcraft-highlight-title" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Package size={16} /> Famous Traditional Products
                </div>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: 1.6, margin: 0 }}>
                  {craft.traditionalProducts}
                </p>
              </div>
            )}

            {craft.modernContext && (
              <div className="artcraft-highlight-box" style={{ marginTop: 0, borderLeft: '4px solid var(--accent-gold)' }} id="craft-box-modern">
                <div className="artcraft-highlight-title" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Sparkles size={16} /> Modern Context & Heritage Preservation
                </div>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  {craft.modernContext}
                </p>
              </div>
            )}
          </div>
        </div>
      </article>
    </div>
  );
};
