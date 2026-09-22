import React, { useState, useEffect } from 'react';
import { Search, X, RotateCcw, Filter, BookOpen, Palette, Globe, ExternalLink, BookCheck } from 'lucide-react';
import { LiteratureCard } from './LiteratureCard';
import type { LiteratureItem } from './LiteratureCard';
import { ArtCraftCard } from './ArtCraftCard';
import type { ArtCraftItem } from './ArtCraftCard';
import type { ExternalWorkDetail } from './ExternalLiteratureReader';
import { WikimediaDirectService } from '../services/wikimediaDirectService';
import './SearchView.css';

export interface ExternalSearchResult {
  id: string;
  title: string;
  snippet: string;
  extract?: string;
  language: string;
  languageCode: string;
  thumbnailUrl?: string;
  sourceUrl: string;
  isFullTextAvailable: boolean;
  fullTextSource?: 'Wikisource' | 'None';
  fullTextUrl?: string;
  attribution: {
    source: string;
    license: string;
    url: string;
  };
}

interface SearchViewProps {
  initialMode?: 'literature' | 'artcraft' | 'external';
  onSelectLiterature?: (item: LiteratureItem) => void;
  onSelectArtCraft?: (craft: ArtCraftItem) => void;
  onSelectExternalWork?: (work: ExternalWorkDetail) => void;
  user?: any;
  onOpenAuth?: (mode: 'login' | 'register') => void;
  initialFilters?: {
    category?: string;
    tag?: string;
    author?: string;
  };
}

export const SearchView: React.FC<SearchViewProps> = ({
  initialMode = 'literature',
  onSelectLiterature,
  onSelectArtCraft,
  onSelectExternalWork,
  user,
  onOpenAuth,
  initialFilters,
}) => {
  const [searchMode, setSearchMode] = useState<'literature' | 'artcraft' | 'external'>(initialMode);

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

  // Global Literature (Wikimedia/Wikisource) search states
  const [externalQuery, setExternalQuery] = useState('');
  const [externalLang, setExternalLang] = useState('auto');
  const [externalResults, setExternalResults] = useState<ExternalSearchResult[]>([]);
  const [availableLanguages, setAvailableLanguages] = useState<{ code: string; name: string; nativeName: string }[]>([]);
  const [loadingExternalWork, setLoadingExternalWork] = useState<string | null>(null);

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

  // Fetch available languages for external literature dropdown
  useEffect(() => {
    fetch('/api/external/languages')
      .then((res) => res.json())
      .then((data) => {
        if (data.languages) setAvailableLanguages(data.languages);
      })
      .catch((err) => console.error('Error fetching external languages:', err));
  }, []);

  // Execute search on mount or when filters change
  useEffect(() => {
    if (searchMode === 'literature') {
      executeSearch();
    } else if (searchMode === 'artcraft') {
      executeCraftSearch();
    } else if (searchMode === 'external') {
      if (externalQuery.trim()) {
        executeExternalSearch();
      } else if (externalResults.length === 0) {
        setExternalQuery('Hamlet');
        executeExternalSearch('Hamlet');
      }
    }
  }, [searchMode, author, category, genre, subject, language, tag, craftState, craftType, externalLang]);

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

  const executeExternalSearch = async (overrideQuery?: string) => {
    const q = (overrideQuery !== undefined ? overrideQuery : externalQuery).trim();
    if (!q) return;

    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({ q });
      if (externalLang && externalLang !== 'auto') {
        params.append('lang', externalLang);
      }

      try {
        const res = await fetch(`/api/external/search?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (data.results && data.results.length > 0) {
            setExternalResults(data.results);
            return;
          }
        }
      } catch (backendErr) {
        console.warn('[SearchView] Backend search unavailable, falling back to direct Wikimedia API:', backendErr);
      }

      // Direct Wikimedia fallback (guaranteed to succeed in any network/deployment context)
      const directResults = await WikimediaDirectService.search(q, externalLang);
      setExternalResults(directResults);
    } catch (err: any) {
      console.error('Global search failure:', err);
      setError(err.message || 'Failed to query global literature archives.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenExternalWork = async (item: ExternalSearchResult) => {
    try {
      setLoadingExternalWork(item.id);

      try {
        const res = await fetch(`/api/external/work/${encodeURIComponent(item.languageCode)}/${encodeURIComponent(item.title)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.work && onSelectExternalWork) {
            onSelectExternalWork(data.work);
            return;
          }
        }
      } catch (backendErr) {
        console.warn('[SearchView] Backend work details unavailable, falling back to direct API:', backendErr);
      }

      // Direct fallback
      const directWork = await WikimediaDirectService.getWorkDetail(item.languageCode, item.title);
      if (directWork && onSelectExternalWork) {
        onSelectExternalWork(directWork);
      } else {
        throw new Error('Could not load work details from external archives.');
      }
    } catch (err: any) {
      console.error('Error opening external work:', err);
      alert('Could not open full literature reader: ' + (err.message || 'Network error'));
    } finally {
      setLoadingExternalWork(null);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchMode === 'literature') {
      executeSearch();
    } else if (searchMode === 'artcraft') {
      executeCraftSearch();
    } else {
      executeExternalSearch();
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
    } else if (searchMode === 'artcraft') {
      setCraftName('');
      setCraftState('ALL');
      setCraftPlace('');
      setCraftType('ALL');
      fetch('/api/search/art-craft')
        .then((res) => res.json())
        .then((data) => setCraftResults(data.results || []))
        .catch((err) => console.error('Reset error:', err));
    } else {
      setExternalQuery('');
      setExternalLang('auto');
      setExternalResults([]);
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
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
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
          <button
            type="button"
            className={`btn ${searchMode === 'external' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => {
              setSearchMode('external');
              if (!externalQuery) {
                setExternalQuery('Hamlet');
                executeExternalSearch('Hamlet');
              }
            }}
            id="tab-search-external"
          >
            <Globe size={15} style={{ marginRight: '6px' }} />
            Global Literature (Multilingual)
          </button>
        </div>
      </div>

      {searchMode === 'external' ? (
        /* GLOBAL LITERATURE SEARCH FORM */
        <div className="search-control-card" id="external-search-control-card">
          <form onSubmit={handleFormSubmit} className="search-form" id="external-search-form">
            <div className="main-search-input-group">
              <Search className="search-input-icon" size={20} />
              <input
                type="text"
                id="search-input-external"
                className="main-search-input"
                placeholder="Search any literary work or author in any language (e.g. Hamlet, ಮಲೆಗಳಲ್ಲಿ ಮದುಮಗಳು, गोदान, Thirukkural)..."
                value={externalQuery}
                onChange={(e) => setExternalQuery(e.target.value)}
              />
              {externalQuery && (
                <button
                  type="button"
                  className="clear-input-btn"
                  onClick={() => setExternalQuery('')}
                  title="Clear input"
                >
                  <X size={16} />
                </button>
              )}
              <button type="submit" className="btn btn-primary btn-search" id="btn-submit-external-search">
                Search World Literature
              </button>
            </div>

            <div className="filters-grid" style={{ gridTemplateColumns: 'minmax(260px, 1fr) 2fr' }}>
              <div className="filter-field">
                <label htmlFor="search-select-external-lang" className="filter-label">
                  Language Filter / Auto Detect
                </label>
                <select
                  id="search-select-external-lang"
                  className="input-field select-field"
                  value={externalLang}
                  onChange={(e) => {
                    setExternalLang(e.target.value);
                  }}
                >
                  <option value="auto">✨ Auto Detect (from input script)</option>
                  {availableLanguages.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.name} ({l.nativeName}) — {l.code}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-field" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  📖 <strong>Public Domain & Legal Sourcing:</strong> Public domain works connect automatically to <strong>Wikisource</strong> for complete full texts. Copyrighted literature displays encyclopedic summaries and legitimate source links.
                </span>
              </div>
            </div>

            <div className="search-actions-bar">
              <div className="quick-suggest-group">
                <span className="suggest-label">Try Exploring:</span>
                <button
                  type="button"
                  className="chip-btn"
                  onClick={() => {
                    setExternalQuery('ಮಲೆಗಳಲ್ಲಿ ಮದುಮಗಳು');
                    setExternalLang('kn');
                    executeExternalSearch('ಮಲೆಗಳಲ್ಲಿ ಮದುಮಗಳು');
                  }}
                >
                  ಮಲೆಗಳಲ್ಲಿ ಮದುಮಗಳು (Kannada)
                </button>
                <button
                  type="button"
                  className="chip-btn"
                  onClick={() => {
                    setExternalQuery('गोदान');
                    setExternalLang('hi');
                    executeExternalSearch('गोदान');
                  }}
                >
                  गोदान (Premchand - Hindi)
                </button>
                <button
                  type="button"
                  className="chip-btn"
                  onClick={() => {
                    setExternalQuery('Thirukkural');
                    setExternalLang('ta');
                    executeExternalSearch('Thirukkural');
                  }}
                >
                  Thirukkural (Tamil)
                </button>
                <button
                  type="button"
                  className="chip-btn"
                  onClick={() => {
                    setExternalQuery('The Divine Comedy');
                    setExternalLang('en');
                    executeExternalSearch('The Divine Comedy');
                  }}
                >
                  The Divine Comedy (Dante)
                </button>
              </div>

              {externalQuery && (
                <button
                  type="button"
                  className="btn btn-secondary btn-reset"
                  onClick={handleReset}
                  id="btn-reset-external"
                >
                  <RotateCcw size={14} />
                  Clear Query
                </button>
              )}
            </div>
          </form>
        </div>
      ) : searchMode === 'artcraft' ? (
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
                <label htmlFor="search-input-craft-place" className="filter-label">Origin / Place</label>
                <input
                  type="text"
                  id="search-input-craft-place"
                  className="input-field"
                  placeholder="e.g. Ramanagara, Bastar..."
                  value={craftPlace}
                  onChange={(e) => setCraftPlace(e.target.value)}
                />
              </div>

              <div className="filter-field">
                <label htmlFor="search-select-craft-type" className="filter-label">Art & Craft Domain</label>
                <select
                  id="search-select-craft-type"
                  className="input-field select-field"
                  value={craftType}
                  onChange={(e) => setCraftType(e.target.value)}
                >
                  <option value="ALL">All Domains & Traditions</option>
                  <option value="Toycraft & Woodwork">Toycraft & Woodwork</option>
                  <option value="Textiles & Weaving">Textiles & Weaving</option>
                  <option value="Metalware & Metallurgy">Metalware & Metallurgy</option>
                  <option value="Painting & Folk Art">Painting & Folk Art</option>
                  <option value="Stone Carving & Sculpture">Stone Carving & Sculpture</option>
                  <option value="Pottery & Terracotta">Pottery & Terracotta</option>
                  <option value="Embroidery & Needlecraft">Embroidery & Needlecraft</option>
                  <option value="Cane & Bamboo Craft">Cane & Bamboo Craft</option>
                </select>
              </div>
            </div>

            <div className="search-actions-bar">
              <div className="quick-suggest-group">
                <span className="suggest-label">GI & Heritage:</span>
                <button
                  type="button"
                  className="chip-btn"
                  onClick={() => { setCraftName('Channapatna'); setCraftState('Karnataka'); }}
                >
                  Channapatna Toys
                </button>
                <button
                  type="button"
                  className="chip-btn"
                  onClick={() => { setCraftName('Bidriware'); setCraftState('Karnataka'); }}
                >
                  Bidriware Metalcraft
                </button>
                <button
                  type="button"
                  className="chip-btn"
                  onClick={() => { setCraftName('Kalamkari'); setCraftState('Andhra Pradesh'); }}
                >
                  Kalamkari Painting
                </button>
                <button
                  type="button"
                  className="chip-btn"
                  onClick={() => { setCraftName('Madhubani'); setCraftState('Bihar'); }}
                >
                  Madhubani Painting
                </button>
              </div>

              {(craftName || craftState !== 'ALL' || craftPlace || craftType !== 'ALL') && (
                <button
                  type="button"
                  className="btn btn-secondary btn-reset"
                  onClick={handleReset}
                  id="btn-reset-craft-filters"
                >
                  <RotateCcw size={14} />
                  Reset Craft Filters
                </button>
              )}
            </div>
          </form>
        </div>
      ) : (
        /* LITERATURE ADVANCED SEARCH FORM */
        <div className="search-control-card">
          <form onSubmit={handleFormSubmit} className="search-form" id="advanced-search-form">
            {/* Title / Global Keyword Search Bar */}
            <div className="main-search-input-group">
              <Search className="search-input-icon" size={20} />
              <input
                type="text"
                id="search-input-title"
                className="main-search-input"
                placeholder="Search by manuscript title, keywords, or classical themes..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              {title && (
                <button
                  type="button"
                  className="clear-input-btn"
                  onClick={() => setTitle('')}
                  title="Clear search text"
                >
                  <X size={16} />
                </button>
              )}
              <button type="submit" className="btn btn-primary btn-search" id="btn-submit-search">
                Filter Archive
              </button>
            </div>

            {/* Granular Field Filters Grid */}
            <div className="filters-grid">
              <div className="filter-field">
                <label htmlFor="search-input-author" className="filter-label">Author / Creator</label>
                <input
                  type="text"
                  id="search-input-author"
                  className="input-field"
                  placeholder="e.g. Shakespeare, Dante, Homer..."
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                />
              </div>

              <div className="filter-field">
                <label htmlFor="search-select-category" className="filter-label">Primary Category</label>
                <select
                  id="search-select-category"
                  className="input-field select-field"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="">All Archival Categories</option>
                  {categoriesList.map((cat: any) => (
                    <option key={cat.name} value={cat.name}>
                      {cat.name} ({cat.count})
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-field">
                <label htmlFor="search-input-genre" className="filter-label">Literary Genre</label>
                <input
                  type="text"
                  id="search-input-genre"
                  className="input-field"
                  placeholder="e.g. Tragedy, Epic, Romance..."
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                />
              </div>

              <div className="filter-field">
                <label htmlFor="search-input-subject" className="filter-label">Curated Subject</label>
                <input
                  type="text"
                  id="search-input-subject"
                  className="input-field"
                  placeholder="e.g. Mortality, Philosophy..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div className="filter-field">
                <label htmlFor="search-select-language" className="filter-label">Primary Language</label>
                <select
                  id="search-select-language"
                  className="input-field select-field"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <option value="">All Languages</option>
                  <option value="Kannada">Kannada (ಕನ್ನಡ)</option>
                  <option value="Hindi">Hindi (हिंदी)</option>
                  <option value="Tamil">Tamil (தமிழ்)</option>
                  <option value="Telugu">Telugu (తెలుగు)</option>
                  <option value="Malayalam">Malayalam (മലയാളം)</option>
                  <option value="Bengali">Bengali (বাংলা)</option>
                  <option value="Marathi">Marathi (मराठी)</option>
                  <option value="Gujarati">Gujarati (ગુજરાતી)</option>
                  <option value="Punjabi">Punjabi (ਪੰਜਾਬੀ)</option>
                  <option value="Urdu">Urdu (اردو)</option>
                  <option value="Sanskrit">Sanskrit (संस्कृतम्)</option>
                  <option value="English">English</option>
                  <option value="Ancient Greek">Ancient Greek</option>
                  <option value="Latin">Latin</option>
                  <option value="Italian">Italian</option>
                  <option value="French">French</option>
                  <option value="German">German</option>
                  <option value="Russian">Russian</option>
                </select>
              </div>

              <div className="filter-field">
                <label htmlFor="search-input-tag" className="filter-label">Thematic Tag</label>
                <input
                  type="text"
                  id="search-input-tag"
                  className="input-field"
                  placeholder="e.g. Philosophy, Mythology..."
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                />
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
              ? 'Searching archives...'
              : searchMode === 'external'
              ? `${externalResults.length} ${externalResults.length === 1 ? 'Global Literary Work' : 'Global Literary Works'} Discovered`
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
          <p className="loading-text">
            {searchMode === 'external'
              ? 'Querying multilingual encyclopedias and legal public-domain folios...'
              : 'Examining classical folios and living cultural archives...'}
          </p>
        </div>
      ) : error ? (
        <div className="search-error-state" id="search-error-indicator">
          <p className="error-icon">⚠️</p>
          <p>{error}</p>
          <button
            className="btn btn-secondary"
            onClick={
              searchMode === 'external'
                ? () => executeExternalSearch()
                : searchMode === 'artcraft'
                ? executeCraftSearch
                : executeSearch
            }
          >
            Retry Query
          </button>
        </div>
      ) : searchMode === 'external' ? (
        externalResults.length > 0 ? (
          <div className="external-literature-grid" id="search-external-results-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
            {externalResults.map((item) => (
              <div
                key={`external-${item.id}`}
                className="external-work-card"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-classic)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: 'var(--shadow-card)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  position: 'relative',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span className="tag-badge burgundy" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Globe size={11} /> {item.language}
                      </span>
                      {item.isFullTextAvailable ? (
                        <span className="tag-badge" style={{ fontSize: '0.75rem', backgroundColor: '#e6f4ea', color: '#137333', borderColor: '#ceead6', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <BookCheck size={11} /> Full Text (Wikisource)
                        </span>
                      ) : (
                        <span className="tag-badge" style={{ fontSize: '0.75rem', backgroundColor: '#f1f3f4', color: '#5f6368', borderColor: '#dadce0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          Encyclopedic Reference
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.85rem' }}>
                    {item.thumbnailUrl && (
                      <img
                        src={item.thumbnailUrl}
                        alt={item.title}
                        style={{ width: '60px', height: '80px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-classic)' }}
                        loading="lazy"
                      />
                    )}
                    <div>
                      <h3
                        className="serif-title"
                        style={{ fontSize: '1.25rem', color: 'var(--accent-burgundy)', margin: '0 0 0.4rem 0', lineHeight: '1.3' }}
                      >
                        {item.title}
                      </h3>
                      <p
                        style={{
                          fontSize: '0.88rem',
                          color: 'var(--text-secondary)',
                          lineHeight: '1.5',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {item.extract || item.snippet}
                      </p>
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-classic)', paddingTop: '1rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                  >
                    View Source <ExternalLink size={12} />
                  </a>

                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.88rem' }}
                    onClick={() => handleOpenExternalWork(item)}
                    disabled={loadingExternalWork === item.id}
                  >
                    {loadingExternalWork === item.id ? (
                      'Loading Folio...'
                    ) : item.isFullTextAvailable ? (
                      <>
                        <BookOpen size={14} style={{ marginRight: '5px' }} />
                        Read Work
                      </>
                    ) : (
                      <>
                        <BookOpen size={14} style={{ marginRight: '5px' }} />
                        View Literature
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-search-state" id="empty-external-search-state">
            <p className="empty-icon">🌍</p>
            <h3 className="serif-title empty-title">Explore World Literature</h3>
            <p className="empty-desc">
              Search any literary work, author, epic, or drama in any language above, or pick one of the curated prompts.
            </p>
          </div>
        )
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
