import React, { useState, useEffect } from 'react';
import { Globe, ArrowRight } from 'lucide-react';
import { LiteratureCard } from './LiteratureCard';
import type { LiteratureItem } from './LiteratureCard';
import { ArtCraftCard } from './ArtCraftCard';
import type { ArtCraftItem } from './ArtCraftCard';
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
  onSelectArtCraft?: (item: ArtCraftItem) => void;
  onNavigateWorldLiterature?: () => void;
  user?: any;
  onOpenAuth?: (mode: 'login' | 'register') => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({
  currentTab,
  onSelectLiterature,
  onSelectArtCraft,
  onNavigateWorldLiterature,
  user,
  onOpenAuth,
}) => {
  const [featured, setFeatured] = useState<LiteratureItem | null>(null);
  const [popular, setPopular] = useState<LiteratureItem[]>([]);
  const [newReleases, setNewReleases] = useState<LiteratureItem[]>([]);
  const [allLiteratures, setAllLiteratures] = useState<LiteratureItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [artCrafts, setArtCrafts] = useState<ArtCraftItem[]>([]);
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

      // Fetch featured, popular, new releases, all literature, categories, and art-craft in parallel
      const [featRes, popRes, newRes, allRes, catRes, craftRes] = await Promise.all([
        fetch('/api/literature/featured'),
        fetch('/api/literature/popular'),
        fetch('/api/literature/new-releases?limit=6'),
        fetch('/api/literature'),
        fetch('/api/literature/categories'),
        fetch('/api/art-craft?limit=6'),
      ]);

      if (!featRes.ok || !popRes.ok || !newRes.ok || !allRes.ok || !catRes.ok) {
        throw new Error('Failed to load literary catalog resources.');
      }

      const [featData, popData, newData, allData, catData, craftData] = await Promise.all([
        featRes.json(),
        popRes.json(),
        newRes.json(),
        allRes.json(),
        catRes.json(),
        craftRes.ok ? craftRes.json() : Promise.resolve({ items: [] }),
      ]);

      setFeatured(featData.featured || null);
      setPopular(popData.popular || []);
      setNewReleases(newData.newReleases || []);
      setAllLiteratures(allData.literatures || []);
      setCategories(catData.categories || []);
      setArtCrafts(craftData.items || craftData.artCrafts || (Array.isArray(craftData) ? craftData : []));
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
      {currentTab === 'home' && popular.length > 0 && (
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
                user={user}
                onOpenAuth={onOpenAuth}
              />
            ))}
          </div>
        </section>
      )}

      {/* 3. New Releases Section (Latest published works by publicationDate DESC) */}
      {currentTab === 'home' && newReleases.length > 0 && (
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
                user={user}
                onOpenAuth={onOpenAuth}
              />
            ))}
          </div>
        </section>
      )}

      {/* Wikipedia & World Literature Showcase Banner (Home) */}
      {currentTab === 'home' && (
        <section
          className="world-literature-banner-card"
          id="world-literature-wikipedia-banner"
          style={{
            margin: '2.5rem 0',
            padding: '2rem 2.5rem',
            background: 'linear-gradient(135deg, rgba(74, 25, 39, 0.05) 0%, rgba(212, 175, 55, 0.12) 100%)',
            border: '1px solid var(--border-classic)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.5rem',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div style={{ maxWidth: '680px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '0.25rem 0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '20px', border: '1px solid var(--border-classic)', marginBottom: '0.75rem' }}>
              <Globe size={14} style={{ color: 'var(--accent-burgundy)' }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-burgundy)' }}>
                Wikipedia & Wikisource Connected
              </span>
            </div>
            <h3 className="serif-title" style={{ fontSize: '1.65rem', color: 'var(--accent-burgundy)', margin: '0 0 0.5rem 0' }}>
              Universal Multilingual Literature Repository
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.96rem', lineHeight: '1.6', margin: 0 }}>
              Search for any literary work, poet, novelist, or epic across <strong>Kannada (ಕನ್ನಡ)</strong>, <strong>Hindi (हिन्दी)</strong>, <strong>Sanskrit (संस्कृतम्)</strong>, <strong>Tamil (தமிழ்)</strong>, English, and world languages. Public domain works feature unabridged full text verified legally from <strong>Wikisource</strong>.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={onNavigateWorldLiterature}
            id="btn-explore-world-literature-home"
            style={{ padding: '0.75rem 1.4rem', fontSize: '0.95rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <span>Explore World Literature</span>
            <ArrowRight size={16} />
          </button>
        </section>
      )}

      {/* 4. Indian Art & Craft Heritage Showcase (Displayed on Home) */}
      {currentTab === 'home' && artCrafts.length > 0 && (
        <section className="catalog-section" id="home-artcraft-section" style={{ marginTop: '2.5rem' }}>
          <div className="section-header-classic">
            <span className="ornament-line">❖ ❖ ❖</span>
            <h2 className="section-title">Indian Art & Craft Heritage</h2>
            <p className="section-subtitle">
              Authentic cultural traditions, master craft heritage, and geographical craft expressions across India.
            </p>
          </div>

          <div className="artcraft-grid" id="home-artcraft-grid">
            {artCrafts.map((craft) => (
              <ArtCraftCard
                key={`craft-${craft.id}`}
                item={craft}
                onClick={() => onSelectArtCraft && onSelectArtCraft(craft)}
              />
            ))}
          </div>
        </section>
      )}

      {/* 5. Complete Catalog Showcase & Category Filter Engine (Shown in Categories, excluded from Home) */}
      {currentTab !== 'home' && (
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
                user={user}
                onOpenAuth={onOpenAuth}
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
      )}
        </>
      )}
    </div>
  );
};
