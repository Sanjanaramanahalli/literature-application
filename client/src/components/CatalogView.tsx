import React, { useState, useEffect } from 'react';
import { LiteratureCard } from './LiteratureCard';
import type { LiteratureItem } from './LiteratureCard';
import './CatalogView.css';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  literatureCount?: number;
}

interface CatalogViewProps {
  currentTab: string;
  onSelectLiterature?: (item: LiteratureItem) => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({
  currentTab,
  onSelectLiterature,
}) => {
  const [featured, setFeatured] = useState<LiteratureItem | null>(null);
  const [popular, setPopular] = useState<LiteratureItem[]>([]);
  const [newReleases, setNewReleases] = useState<LiteratureItem[]>([]);
  const [allLiteratures, setAllLiteratures] = useState<LiteratureItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCatalogData();
  }, []);

  const fetchCatalogData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch featured, popular, new releases, all literature, and categories in parallel
      const [featRes, popRes, newRes, allRes, catRes] = await Promise.all([
        fetch('http://localhost:5000/api/literature/featured'),
        fetch('http://localhost:5000/api/literature/popular'),
        fetch('http://localhost:5000/api/literature/new-releases?limit=6'),
        fetch('http://localhost:5000/api/literature'),
        fetch('http://localhost:5000/api/literature/categories'),
      ]);

      if (!featRes.ok || !popRes.ok || !newRes.ok || !allRes.ok || !catRes.ok) {
        throw new Error('Failed to load literary catalog resources.');
      }

      const [featData, popData, newData, allData, catData] = await Promise.all([
        featRes.json(),
        popRes.json(),
        newRes.json(),
        allRes.json(),
        catRes.json(),
      ]);

      setFeatured(featData.featured || null);
      setPopular(popData.popular || []);
      setNewReleases(newData.newReleases || []);
      setAllLiteratures(allData.literatures || []);
      setCategories(catData.categories || []);
    } catch (err: any) {
      console.error('Catalog fetch error:', err);
      setError(err.message || 'Unable to connect to the literary repository.');
    } finally {
      setLoading(false);
    }
  };

  // Filter all catalog works based on selected category and language
  const filteredCatalog = allLiteratures.filter((item) => {
    const matchesCategory =
      selectedCategory === 'all' ||
      item.category?.slug.toLowerCase() === selectedCategory.toLowerCase();
    const matchesLanguage =
      selectedLanguage === 'all' ||
      item.language?.toLowerCase().includes(selectedLanguage.toLowerCase());
    return matchesCategory && matchesLanguage;
  });

  return (
    <div className="catalog-container" id="catalog-view">
      {loading && (
        <div className="catalog-loading" id="catalog-loading-state">
          <div className="loading-spinner"></div>
          <p className="loading-text serif-title">
            Retrieving classical works from the Athenæum archives...
          </p>
        </div>
      )}

      {error && (
        <div className="catalog-error-state" id="catalog-error-state">
          <p className="error-icon">⚠️</p>
          <h3 className="error-title">Archive Retrieval Error</h3>
          <p className="error-msg">{error}</p>
          <button
            className="btn btn-secondary"
            onClick={fetchCatalogData}
            id="btn-retry-catalog"
          >
            Attempt Re-connection
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* 1. Featured Work Hero Section (Displayed on Home or when available) */}
      {featured && currentTab !== 'categories' && (
        <section className="featured-hero-section" id="featured-literature-section">
          <div className="featured-card-plate">
            <div className="featured-cover-box">
              <img
                src={
                  featured.coverImage ||
                  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80'
                }
                alt={featured.title}
                className="featured-cover-img"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80';
                }}
              />
              <span className="featured-laurel-badge">Featured Archival Work</span>
            </div>

            <div className="featured-details">
              <div className="featured-badge-row">
                {featured.category && (
                  <span className="tag-badge burgundy">{featured.category.name}</span>
                )}
                <span className="tag-badge">{featured.genre}</span>
                <span className="featured-lang">{featured.language}</span>
              </div>

              <h2 className="featured-title">{featured.title}</h2>

              {featured.subheading && (
                <h2 className="featured-subheading">{featured.subheading}</h2>
              )}

              {featured.creator && (
                <p className="featured-author">
                  Penned by <strong className="serif-title">{featured.creator.name}</strong>
                </p>
              )}

              {featured.brief && (
                <p className="featured-brief reading-text drop-cap">
                  {featured.brief}
                </p>
              )}

              <div className="featured-metrics-bar">
                <div className="featured-stat">
                  <span className="star-icon">★</span>
                  <strong>{featured.averageRating > 0 ? featured.averageRating.toFixed(1) : 'New'}</strong>
                  <span className="stat-label">({featured.totalRatingsCount} ratings)</span>
                </div>
                <div className="stat-divider">•</div>
                <div className="featured-stat">
                  <strong>{featured.totalSavesCount}</strong>
                  <span className="stat-label">Saves</span>
                </div>
                <div className="stat-divider">•</div>
                <div className="featured-stat">
                  <strong>{featured.totalCommentsCount}</strong>
                  <span className="stat-label">Discussions</span>
                </div>
              </div>

              <div className="featured-actions">
                <button
                  className="btn btn-primary"
                  id="btn-read-featured"
                  onClick={() => onSelectLiterature && onSelectLiterature(featured)}
                >
                  Enter Sanctuary & Read Work
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 2. Popular Literature Section (Strictly sorted by Ratings + Saves + Comments) */}
      {(currentTab === 'home' || currentTab === 'explore') && popular.length > 0 && (
        <section className="catalog-section" id="popular-literature-section">
          <div className="section-header-classic">
            <span className="ornament-line">✦ ✦ ✦</span>
            <h2 className="section-title">Most Celebrated Works</h2>
            <p className="section-subtitle">
              Calculated dynamically by scholarly engagement: Total Ratings, Saves, and Community Dialogues.
            </p>
          </div>

          <div className="literature-grid" id="popular-literature-grid">
            {popular.map((item, index) => (
              <LiteratureCard
                key={`pop-${item.id}`}
                item={item}
                badge={`#${index + 1} Popular`}
                badgeType="popularity"
                onSelect={onSelectLiterature}
              />
            ))}
          </div>
        </section>
      )}

      {/* 3. New Releases Section (Latest published works by publicationDate DESC) */}
      {(currentTab === 'home' || currentTab === 'explore') && newReleases.length > 0 && (
        <section className="catalog-section" id="new-releases-section">
          <div className="section-header-classic">
            <span className="ornament-line">❖ ❖ ❖</span>
            <h2 className="section-title">New Releases & Recent Additions</h2>
            <p className="section-subtitle">
              Freshly archived editions cataloged in chronological order of preservation.
            </p>
          </div>

          <div className="literature-grid" id="new-releases-grid">
            {newReleases.map((item) => (
              <LiteratureCard
                key={`new-${item.id}`}
                item={item}
                badge="New Edition"
                badgeType="release"
                onSelect={onSelectLiterature}
              />
            ))}
          </div>
        </section>
      )}

      {/* 4. Complete Catalog Showcase & Category Filter Engine */}
      <section className="catalog-section" id="full-catalog-section">
        <div className="section-header-classic">
          <span className="ornament-line">❦ ❦ ❦</span>
          <h2 className="section-title">The Complete Athenæum Compendium</h2>
          <p className="section-subtitle">
            Browse our full repertoire of classical texts across foundational genres.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="category-filter-bar" id="category-filter-bar">
          <button
            className={`category-filter-btn ${selectedCategory === 'all' ? 'active' : ''}`}
            id="cat-filter-all"
            onClick={() => setSelectedCategory('all')}
          >
            All Archives ({allLiteratures.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`category-filter-btn ${selectedCategory === cat.slug ? 'active' : ''}`}
              id={`cat-filter-${cat.slug}`}
              onClick={() => setSelectedCategory(cat.slug)}
            >
              {cat.name} {cat.literatureCount !== undefined ? `(${cat.literatureCount})` : ''}
            </button>
          ))}
        </div>

        {/* Language Filter Pills (LIT-15) */}
        <div className="language-filter-bar" id="language-filter-bar" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', margin: '0.75rem 0 1.5rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-burgundy)', alignSelf: 'center', marginRight: '0.25rem' }}>
            Language:
          </span>
          <button
            className={`category-filter-btn ${selectedLanguage === 'all' ? 'active' : ''}`}
            id="lang-filter-all"
            onClick={() => setSelectedLanguage('all')}
          >
            All Languages
          </button>
          <button
            className={`category-filter-btn ${selectedLanguage === 'English' ? 'active' : ''}`}
            id="lang-filter-english"
            onClick={() => setSelectedLanguage('English')}
          >
            English
          </button>
          <button
            className={`category-filter-btn ${selectedLanguage === 'Hindi' ? 'active' : ''}`}
            id="lang-filter-hindi"
            onClick={() => setSelectedLanguage('Hindi')}
          >
            हिंदी (Hindi)
          </button>
          <button
            className={`category-filter-btn ${selectedLanguage === 'Kannada' ? 'active' : ''}`}
            id="lang-filter-kannada"
            onClick={() => setSelectedLanguage('Kannada')}
          >
            ಕನ್ನಡ (Kannada)
          </button>
        </div>

        {/* Filtered Grid */}
        {filteredCatalog.length > 0 ? (
          <div className="literature-grid" id="compendium-grid">
            {filteredCatalog.map((item) => (
              <LiteratureCard
                key={`all-${item.id}`}
                item={item}
                onSelect={onSelectLiterature}
              />
            ))}
          </div>
        ) : (
          <div className="empty-catalog-state" id="empty-catalog-notice">
            <p className="empty-icon">📜</p>
            <h3 className="empty-title">No Works Found In This Category</h3>
            <p className="empty-desc">
              No published manuscripts match the selected filter. Try choosing "All Archives".
            </p>
            <button
              className="btn btn-secondary"
              onClick={() => setSelectedCategory('all')}
            >
              Reset Category Filters
            </button>
          </div>
        )}
      </section>
        </>
      )}
    </div>
  );
};
