import React, { useState, useEffect } from 'react';
import { Search, X, RotateCcw, Filter } from 'lucide-react';
import { LiteratureCard } from './LiteratureCard';
import type { LiteratureItem } from './LiteratureCard';
import './SearchView.css';

interface SearchViewProps {
  onSelectLiterature?: (item: LiteratureItem) => void;
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
  user,
  onOpenAuth,
  initialFilters,
}) => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState(initialFilters?.author || '');
  const [category, setCategory] = useState(initialFilters?.category || '');
  const [genre, setGenre] = useState('');
  const [subject, setSubject] = useState('');
  const [language, setLanguage] = useState('');
  const [tag, setTag] = useState(initialFilters?.tag || '');

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
    executeSearch();
  }, [author, category, genre, subject, language, tag]);

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
    executeSearch();
  };

  const handleReset = () => {
    setTitle('');
    setAuthor('');
    setCategory('');
    setGenre('');
    setSubject('');
    setLanguage('');
    setTag('');
    // Trigger immediate clean search
    fetch('/api/search/advanced')
      .then((res) => res.json())
      .then((data) => setResults(data.results || []))
      .catch((err) => console.error('Reset error:', err));
  };

  const activeFiltersCount = [title, author, category, genre, subject, language, tag].filter(Boolean).length;

  return (
    <div className="search-view-container" id="advanced-search-view">
      {/* Header */}
      <div className="search-header">
        <span className="ornament-line">✦ ✦ ✦</span>
        <h1 className="serif-title search-main-title">Compendium Archival Search</h1>
        <p className="search-main-subtitle">
          Query our timeless library across Title, Author, Language, Subject, Category, Genre, and Tag with multi-field precision.
        </p>
      </div>

      {/* Search Input Controls Card */}
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

      {/* Results Header & Counter */}
      <div className="search-results-summary" id="search-results-summary">
        <div className="results-count-badge">
          <Filter size={15} />
          <span>
            {loading
              ? 'Filtering archives...'
              : `${results.length} ${results.length === 1 ? 'Manuscript' : 'Manuscripts'} Discovered`}
          </span>
        </div>
      </div>

      {/* Results Grid / Loading / Empty State */}
      {loading ? (
        <div className="search-loading" id="search-loading-indicator">
          <div className="loading-spinner"></div>
          <p className="loading-text">Examining classical folios and inscriptions...</p>
        </div>
      ) : error ? (
        <div className="search-error-state" id="search-error-indicator">
          <p className="error-icon">⚠️</p>
          <p>{error}</p>
          <button className="btn btn-secondary" onClick={executeSearch}>Retry Query</button>
        </div>
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
