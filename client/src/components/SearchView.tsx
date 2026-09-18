import React, { useState, useEffect } from 'react';
import { Search, X, RotateCcw, Filter, BookOpen, Palette } from 'lucide-react';
import { LiteratureCard } from './LiteratureCard';
import type { LiteratureItem } from './LiteratureCard';
import { ArtCraftCard } from './ArtCraftCard';
import type { ArtCraftItem } from './ArtCraftCard';
import './SearchView.css';

interface SearchViewProps {
  onSelectLiterature?: (item: LiteratureItem) => void;
  onSelectArtCraft?: (craft: ArtCraftItem) => void;
  user?: any;
  onOpenAuth?: (mode: 'login' | 'register') => void;
  initialFilters?: {
    category?: string;
    tag?: string;
    author?: string;
  };
}

export const SearchView: React.FC<SearchViewProps> = ({
  onSelectLiterature,
  onSelectArtCraft,
  user,
  onOpenAuth,
  initialFilters,
}) => {
  const [searchMode, setSearchMode] = useState<'literature' | 'artcraft'>('literature');

  // Literature search states
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState(initialFilters?.author || '');
  const [category, setCategory] = useState(initialFilters?.category || '');
  const [genre, setGenre] = useState('');
  const [subject, setSubject] = useState('');
  const [language, setLanguage] = useState('');
  const [tag, setTag] = useState(initialFilters?.tag || '');

  // Art & Craft search states
  const [craftName, setCraftName] = useState('');
  const [craftState, setCraftState] = useState('ALL');
  const [craftPlace, setCraftPlace] = useState('');
  const [craftType, setCraftType] = useState('ALL');
  const [craftResults, setCraftResults] = useState<ArtCraftItem[]>([]);

  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [results, setResults] = useState<LiteratureItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available categories for dropdown
  useEffect(() => {
    fetch('/api/literature/categories')
      .then((res) => res.json())
      .then((data) => {
        if (data.categories) setCategoriesList(data.categories);
      })
      .catch((err) => console.error('Error fetching categories:', err));
  }, []);

  // Execute search on mount or when filters change
  useEffect(() => {
    if (searchMode === 'literature') {
      executeSearch();
    } else {
      executeCraftSearch();
    }
  }, [searchMode, author, category, genre, subject, language, tag, craftState, craftType]);

  const executeCraftSearch = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (craftName.trim()) params.append('name', craftName.trim());
      if (craftState !== 'ALL') params.append('state', craftState);
      if (craftPlace.trim()) params.append('place', craftPlace.trim());
      if (craftType !== 'ALL') params.append('type', craftType);

      const res = await fetch(`/api/search/art-craft?${params.toString()}`);
      if (!res.ok) throw new Error('Art & Craft search failed.');
      const data = await res.json();
      setCraftResults(data.results || []);
    } catch (err: any) {
      console.error('Craft search error:', err);
      setError(err.message || 'Failed to search Art & Craft archives.');
    } finally {
      setLoading(false);
    }
  };

  const executeSearch = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (title.trim()) params.append('title', title.trim());
      if (author.trim()) params.append('author', author.trim());
      if (category.trim()) params.append('category', category.trim());
      if (genre.trim()) params.append('genre', genre.trim());
      if (subject.trim()) params.append('subject', subject.trim());
      if (language.trim()) params.append('language', language.trim());
      if (tag.trim()) params.append('tag', tag.trim());

      const res = await fetch(`/api/search/advanced?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Search request was rejected by server.');
      }

      const data = await res.json();
      setResults(data.results || []);
    } catch (err: any) {
      console.error('Search failure:', err);
      setError(err.message || 'Failed to query literature archives.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchMode === 'literature') {
      executeSearch();
    } else {
      executeCraftSearch();
    }
  };

  const handleReset = () => {
    if (searchMode === 'literature') {
      setTitle('');
      setAuthor('');
      setCategory('');
      setGenre('');
      setSubject('');
      setLanguage('');
      setTag('');
      fetch('/api/search/advanced')
        .then((res) => res.json())
        .then((data) => setResults(data.results || []))
        .catch((err) => console.error('Reset error:', err));
    } else {
      setCraftName('');
      setCraftState('ALL');
      setCraftPlace('');
      setCraftType('ALL');
      fetch('/api/search/art-craft')
        .then((res) => res.json())
        .then((data) => setCraftResults(data.results || []))
        .catch((err) => console.error('Reset error:', err));
    }
  };

  const activeFiltersCount = [title, author, category, genre, subject, language, tag].filter(Boolean).length;

  return (
    <div className="search-view-container" id="advanced-search-view">
      {/* Header */}
      <div className="search-header">
        <span className="ornament-line">✦ ✦ ✦</span>
        <h1 className="serif-title search-main-title">Compendium Archival Search</h1>
        <p className="search-main-subtitle">
          Query our timeless library across Classical Literature or explore Regional Indian Art & Craft traditions with multi-field precision.
        </p>

        {/* Scope Selector */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginTop: '1.25rem' }}>
          <button
            type="button"
            className={`btn ${searchMode === 'literature' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSearchMode('literature')}
            id="tab-search-literature"
          >
            <BookOpen size={15} style={{ marginRight: '6px' }} />
            Classical Literature
          </button>
          <button
            type="button"
            className={`btn ${searchMode === 'artcraft' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSearchMode('artcraft')}
            id="tab-search-artcraft"
          >
            <Palette size={15} style={{ marginRight: '6px' }} />
            Indian Art & Craft
          </button>
        </div>
      </div>

      {searchMode === 'artcraft' ? (
        /* ART & CRAFT SEARCH FORM */
        <div className="search-control-card">
          <form onSubmit={handleFormSubmit} className="search-form" id="artcraft-search-form">
            <div className="main-search-input-group">
              <Search className="search-input-icon" size={20} />
              <input
                type="text"
                id="search-input-craftname"
                className="main-search-input"
                placeholder="Search art/craft name, local name, or keywords (e.g. Channapatna, Madhubani)..."
                value={craftName}
                onChange={(e) => setCraftName(e.target.value)}
              />
              {craftName && (
                <button
                  type="button"
                  className="clear-input-btn"
                  onClick={() => setCraftName('')}
                  title="Clear craft input"
                >
                  <X size={16} />
                </button>
              )}
              <button type="submit" className="btn btn-primary btn-search" id="btn-submit-craft-search">
                Search Crafts
              </button>
            </div>

            <div className="filters-grid">
              <div className="filter-field">
                <label htmlFor="search-select-craft-state" className="filter-label">State</label>
                <select
                  id="search-select-craft-state"
                  className="input-field select-field"
                  value={craftState}
                  onChange={(e) => setCraftState(e.target.value)}
                >
                  <option value="ALL">All 28 Indian States</option>
                  <option value="Andhra Pradesh">Andhra Pradesh</option>
                  <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                  <option value="Assam">Assam</option>
                  <option value="Bihar">Bihar</option>
                  <option value="Chhattisgarh">Chhattisgarh</option>
                  <option value="Goa">Goa</option>
                  <option value="Gujarat">Gujarat</option>
                  <option value="Haryana">Haryana</option>
                  <option value="Himachal Pradesh">Himachal Pradesh</option>
                  <option value="Jharkhand">Jharkhand</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Kerala">Kerala</option>
                  <option value="Madhya Pradesh">Madhya Pradesh</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Manipur">Manipur</option>
                  <option value="Meghalaya">Meghalaya</option>
                  <option value="Mizoram">Mizoram</option>
                  <option value="Nagaland">Nagaland</option>
                  <option value="Odisha">Odisha</option>
                  <option value="Punjab">Punjab</option>
                  <option value="Rajasthan">Rajasthan</option>
                  <option value="Sikkim">Sikkim</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Telangana">Telangana</option>
                  <option value="Tripura">Tripura</option>
                  <option value="Uttar Pradesh">Uttar Pradesh</option>
                  <option value="Uttarakhand">Uttarakhand</option>
                  <option value="West Bengal">West Bengal</option>
                </select>
              </div>

              <div className="filter-field">
                <label htmlFor="search-input-place" className="filter-label">Place of Origin / Town</label>
                <input
                  type="text"
                  id="search-input-place"
                  className="input-field"
                  placeholder="e.g. Channapatna, Jaipur, Kondapalli"
                  value={craftPlace}
                  onChange={(e) => setCraftPlace(e.target.value)}
                />
              </div>

              <div className="filter-field">
                <label htmlFor="search-select-craft-type" className="filter-label">Craft Type</label>
                <select
                  id="search-select-craft-type"
                  className="input-field select-field"
                  value={craftType}
                  onChange={(e) => setCraftType(e.target.value)}
                >
                  <option value="ALL">All Craft Types</option>
                  <option value="Woodcraft">Woodcraft & Lacquerware</option>
                  <option value="Painting">Traditional Painting & Folk Art</option>
                  <option value="Textile">Textile Weaving & Embroidery</option>
                  <option value="Pottery">Pottery & Terracotta</option>
                  <option value="Metal">Metalwork & Casting</option>
                  <option value="Cane">Cane & Bamboo</option>
                </select>
              </div>
            </div>

            <div className="search-actions-bar">
              <div className="quick-suggest-group">
                <span className="suggest-label">Curated Searches:</span>
                <button
                  type="button"
                  className="chip-btn"
                  onClick={() => { setCraftState('Karnataka'); setCraftName('Channapatna'); }}
                >
                  Channapatna (Karnataka)
                </button>
                <button
                  type="button"
                  className="chip-btn"
                  onClick={() => { setCraftState('Rajasthan'); setCraftName('Jaipur'); }}
                >
                  Jaipur (Rajasthan)
                </button>
                <button
                  type="button"
                  className="chip-btn"
                  onClick={() => { setCraftState('Bihar'); setCraftName('Madhubani'); }}
                >
                  Madhubani (Bihar)
                </button>
              </div>

              {(craftName || craftState !== 'ALL' || craftPlace || craftType !== 'ALL') && (
                <button
                  type="button"
                  className="btn btn-secondary btn-reset"
                  onClick={handleReset}
                  id="btn-reset-craft-filters"
                >
                  <RotateCcw size={14} /> Clear Craft Filters
                </button>
              )}
            </div>
          </form>
        </div>
      ) : (
        /* LITERATURE SEARCH FORM */
        <div className="search-control-card">
          <form onSubmit={handleFormSubmit} className="search-form" id="search-form">
            {/* Main Keyword Input */}
            <div className="main-search-input-group">
              <Search className="search-input-icon" size={20} />
              <input
                type="text"
                id="search-input-title"
                className="main-search-input"
                placeholder="Search by manuscript title, keywords, or phrase..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            {title && (
              <button
                type="button"
                className="clear-input-btn"
                onClick={() => setTitle('')}
                title="Clear title input"
              >
                <X size={16} />
              </button>
            )}
            <button type="submit" className="btn btn-primary btn-search" id="btn-submit-search">
              Search Archives
            </button>
          </div>

          {/* Detailed Filters Grid */}
          <div className="filters-grid">
            {/* Author */}
            <div className="filter-field">
              <label htmlFor="search-input-author" className="filter-label">Author / Creator</label>
              <input
                type="text"
                id="search-input-author"
                className="input-field"
                placeholder="e.g. Shakespeare, Tolstoy"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
              />
            </div>

            {/* Category */}
            <div className="filter-field">
              <label htmlFor="search-select-category" className="filter-label">Category</label>
              <select
                id="search-select-category"
                className="input-field select-field"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {categoriesList.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div className="filter-field">
              <label htmlFor="search-input-subject" className="filter-label">Subject & Motif</label>
              <input
                type="text"
                id="search-input-subject"
                className="input-field"
                placeholder="e.g. Mortality, Revenge"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            {/* Tag */}
            <div className="filter-field">
              <label htmlFor="search-input-tag" className="filter-label">Thematic Tag</label>
              <input
                type="text"
                id="search-input-tag"
                className="input-field"
                placeholder="e.g. Modernism, Tragedy"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
              />
            </div>

            {/* Genre */}
            <div className="filter-field">
              <label htmlFor="search-input-genre" className="filter-label">Genre</label>
              <input
                type="text"
                id="search-input-genre"
                className="input-field"
                placeholder="e.g. Tragedy, Essay"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
              />
            </div>

            {/* Language (LIT-15 Indian Languages) */}
            <div className="filter-field">
              <label htmlFor="search-input-language" className="filter-label">Language</label>
              <select
                id="search-input-language"
                className="input-field select-field"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="">All Languages</option>
                <option value="English">English</option>
                <option value="Hindi">Hindi (हिंदी)</option>
                <option value="Kannada">Kannada (ಕನ್ನಡ)</option>
                <option value="Sanskrit">Sanskrit (संस्कृतम्)</option>
                <option value="Tamil">Tamil (தமிழ்)</option>
                <option value="Bengali">Bengali (বাংলা)</option>
              </select>
            </div>
          </div>

          {/* Quick-suggest chips & Reset Action */}
          <div className="search-actions-bar">
            <div className="quick-suggest-group">
              <span className="suggest-label">Curated Prompts:</span>
              <button
                type="button"
                className="chip-btn"
                onClick={() => { setAuthor('Shakespeare'); setCategory('Drama'); }}
                id="chip-shakespeare-drama"
              >
                Shakespeare (Drama)
              </button>
              <button
                type="button"
                className="chip-btn"
                onClick={() => { handleReset(); setSubject('Mortality'); }}
                id="chip-mortality"
              >
                Subject: Mortality
              </button>
              <button
                type="button"
                className="chip-btn"
                onClick={() => { handleReset(); setTag('Modernism'); }}
                id="chip-modernism"
              >
                Tag: Modernism
              </button>
            </div>

            {activeFiltersCount > 0 && (
              <button
                type="button"
                className="btn btn-secondary btn-reset"
                onClick={handleReset}
                id="btn-reset-filters"
              >
                <RotateCcw size={14} />
                Clear All Filters ({activeFiltersCount})
              </button>
            )}
          </div>
        </form>
      </div>
    )}

      {/* Results Header & Counter */}
      <div className="search-results-summary" id="search-results-summary">
        <div className="results-count-badge">
          <Filter size={15} />
          <span>
            {loading
              ? 'Filtering archives...'
              : searchMode === 'artcraft'
              ? `${craftResults.length} ${craftResults.length === 1 ? 'Craft Tradition' : 'Craft Traditions'} Discovered`
              : `${results.length} ${results.length === 1 ? 'Manuscript' : 'Manuscripts'} Discovered`}
          </span>
        </div>
      </div>

      {/* Results Grid / Loading / Empty State */}
      {loading ? (
        <div className="search-loading" id="search-loading-indicator">
          <div className="loading-spinner"></div>
          <p className="loading-text">Examining classical folios and living cultural archives...</p>
        </div>
      ) : error ? (
        <div className="search-error-state" id="search-error-indicator">
          <p className="error-icon">⚠️</p>
          <p>{error}</p>
          <button className="btn btn-secondary" onClick={searchMode === 'artcraft' ? executeCraftSearch : executeSearch}>
            Retry Query
          </button>
        </div>
      ) : searchMode === 'artcraft' ? (
        craftResults.length > 0 ? (
          <div className="artcraft-grid" id="search-craft-results-grid" style={{ marginTop: '1.5rem' }}>
            {craftResults.map((craft) => (
              <ArtCraftCard
                key={`craft-search-${craft.id}`}
                item={craft}
                onClick={() => onSelectArtCraft && onSelectArtCraft(craft)}
              />
            ))}
          </div>
        ) : (
          <div className="empty-search-state" id="empty-craft-search-state">
            <p className="empty-icon">🎨</p>
            <h3 className="serif-title empty-title">No Arts or Crafts Found</h3>
            <p className="empty-desc">
              No regional craft entries match the specified filter or keywords. Try searching by state name (e.g. Karnataka, Rajasthan) or craft origin (e.g. Channapatna).
            </p>
            <button className="btn btn-secondary" onClick={handleReset} id="btn-empty-craft-reset">
              Reset Filters & View All
            </button>
          </div>
        )
      ) : results.length > 0 ? (
        <div className="literature-grid search-results-grid" id="search-results-grid">
          {results.map((item) => (
            <LiteratureCard
              key={`search-${item.id}`}
              item={item}
              onSelect={onSelectLiterature}
              user={user}
              onOpenAuth={onOpenAuth}
            />
          ))}
        </div>
      ) : (
        <div className="empty-search-state" id="empty-search-state">
          <p className="empty-icon">📜</p>
          <h3 className="serif-title empty-title">No Works Found</h3>
          <p className="empty-desc">
            No published manuscripts match the specified query combination. Try clearing some criteria or searching by a broader keyword.
          </p>
          <button
            className="btn btn-secondary"
            onClick={handleReset}
            id="btn-empty-reset"
          >
            Reset Filters & View All
          </button>
        </div>
      )}
    </div>
  );
};
