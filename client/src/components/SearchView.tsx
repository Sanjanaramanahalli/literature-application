import React, { useState, useEffect } from 'react';
import { Search, X, RotateCcw, Filter, BookOpen, Palette, Globe, ExternalLink, BookCheck, Bookmark, User, Feather } from 'lucide-react';
import { LiteratureCard } from './LiteratureCard';
import type { LiteratureItem } from './LiteratureCard';
import { ArtCraftCard } from './ArtCraftCard';
import type { ArtCraftItem } from './ArtCraftCard';
import type { ExternalWorkDetail } from './ExternalLiteratureReader';
import { WikimediaDirectService } from '../services/wikimediaDirectService';
import { SUPPORTED_INDIAN_LANGUAGES, detectIndianLanguageCode, getIndianLanguageByCode } from '../config/indianLanguages';
import './SearchView.css';

export interface UnifiedLiteratureItem {
  id: string;
  title: string;
  originalTitle?: string;
  subheading?: string | null;
  author?: string;
  creator?: { id?: string; name: string; bio?: string | null };
  language: string;
  languageCode?: string;
  description?: string;
  excerpt?: string;
  brief?: string | null;
  content?: string;
  genre?: string;
  subject?: string;
  thumbnail?: string;
  thumbnailUrl?: string;
  coverImage?: string | null;
  itemType?: 'WORK' | 'AUTHOR' | 'LITERATURE';
  literatureType?: string;
  source: 'APPLICATION' | 'WIKIMEDIA';
  sourceLabel: string;
  sourceProject?: string;
  sourceUrl?: string;
  canonicalUrl?: string;
  isFullTextAvailable?: boolean;
  fullTextSource?: 'Wikisource' | 'None';
  fullTextUrl?: string;
  publicationDate?: string;
  category?: { id?: string; name: string; slug?: string } | null;
  averageRating?: number;
  totalRatingsCount?: number;
  totalSavesCount?: number;
  totalCommentsCount?: number;
  likesCount?: number;
  downvotesCount?: number;
  userVote?: 'LIKE' | 'DOWNVOTE' | null;
  isSaved?: boolean;
}

interface SearchViewProps {
  initialMode?: 'literature' | 'artcraft';
  onSelectLiterature?: (item: LiteratureItem) => void;
  onSelectArtCraft?: (craft: ArtCraftItem) => void;
  onSelectExternalWork?: (work: ExternalWorkDetail) => void;
  user?: any;
  onOpenAuth?: (mode: 'login' | 'register') => void;
  initialFilters?: {
    query?: string;
    language?: string;
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
  const [searchMode, setSearchMode] = useState<'literature' | 'artcraft'>(initialMode);

  // Literature search states
  const [query, setQuery] = useState(initialFilters?.query || '');
  const [author, setAuthor] = useState(initialFilters?.author || '');
  const [category, setCategory] = useState(initialFilters?.category || '');
  const [genre, setGenre] = useState('');
  const [subject, setSubject] = useState('');
  const [language, setLanguage] = useState(initialFilters?.language || 'auto');
  const [isManualLanguage, setIsManualLanguage] = useState(false);
  const [detectedLanguageCode, setDetectedLanguageCode] = useState<string | null>(null);
  const [tag, setTag] = useState(initialFilters?.tag || '');
  const [resultType, setResultType] = useState<'ALL' | 'WORK' | 'AUTHOR'>('ALL');

  // Art & Craft search states
  const [craftName, setCraftName] = useState('');
  const [craftState, setCraftState] = useState('ALL');
  const [craftPlace, setCraftPlace] = useState('');
  const [craftType, setCraftType] = useState('ALL');
  const [craftResults, setCraftResults] = useState<ArtCraftItem[]>([]);

  // Results & pagination
  const [results, setResults] = useState<UnifiedLiteratureItem[]>([]);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [loadingExternalId, setLoadingExternalId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedExternalMap, setSavedExternalMap] = useState<Record<string, boolean>>({});

  const PAGE_SIZE = 20;

  // Fetch available categories
  useEffect(() => {
    fetch('/api/literature/categories')
      .then((res) => res.json())
      .then((data) => {
        if (data.categories) setCategoriesList(data.categories);
      })
      .catch((err) => console.error('Error fetching categories:', err));
  }, []);

  // Debounced search when query changes in literature search mode
  useEffect(() => {
    if (searchMode !== 'literature') return;
    const timer = setTimeout(() => {
      executeCombinedSearch(0, false, query);
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  // Execute search on mount or when mode/filters change
  useEffect(() => {
    if (searchMode === 'literature') {
      executeCombinedSearch(0, false);
    } else if (searchMode === 'artcraft') {
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

  const executeCombinedSearch = async (offset = 0, isAppend = false, queryOverride?: string) => {
    try {
      if (isAppend) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError(null);
      }

      const effectiveQ = (queryOverride !== undefined ? queryOverride : query).trim();
      const auth = author.trim();
      const params = new URLSearchParams();
      if (effectiveQ) params.append('q', effectiveQ);
      if (auth) params.append('author', auth);
      if (language && language !== 'auto') params.append('lang', language);
      params.append('limit', String(PAGE_SIZE));
      params.append('offset', String(offset));

      let fetchedResults: UnifiedLiteratureItem[] = [];

      try {
        const res = await fetch(`/api/search/combined?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          fetchedResults = data.results || [];
          if (data.detectedLanguage && !isManualLanguage) {
            setDetectedLanguageCode(data.detectedLanguage);
            if (language === 'auto') {
              setLanguage(data.detectedLanguage);
            }
          }
        }
      } catch (backendErr) {
        console.warn('[SearchView] Combined backend search error, attempting direct fallback:', backendErr);
      }

      // If backend was unreachable or returned empty on an external Indian language query, try Direct Wikimedia fallback
      if (fetchedResults.length === 0 && effectiveQ) {
        try {
          const directItems = await WikimediaDirectService.search(effectiveQ, language);
          fetchedResults = directItems.map((item) => ({
            id: item.id,
            title: item.title,
            originalTitle: item.title,
            author: item.author,
            language: item.language,
            languageCode: item.languageCode,
            description: item.extract || item.snippet,
            brief: item.extract || item.snippet,
            thumbnail: item.thumbnailUrl,
            thumbnailUrl: item.thumbnailUrl,
            coverImage: item.thumbnailUrl,
            itemType: item.itemType,
            literatureType: item.literatureType,
            source: 'WIKIMEDIA' as const,
            sourceLabel: `Wikimedia / ${item.language.split(' ')[0]} Wikipedia`,
            sourceUrl: item.sourceUrl,
            canonicalUrl: item.sourceUrl,
            isFullTextAvailable: item.isFullTextAvailable,
            fullTextSource: item.fullTextSource,
            fullTextUrl: item.fullTextUrl,
          }));
        } catch (directErr) {
          console.warn('[SearchView] Direct fallback error:', directErr);
        }
      }

      // Filter granular categories if selected for application items
      if (category) {
        fetchedResults = fetchedResults.filter((item) =>
          item.source === 'WIKIMEDIA' ||
          (item.category && item.category.name.toLowerCase() === category.toLowerCase())
        );
      }

      if (isAppend) {
        setResults((prev) => [...prev, ...fetchedResults]);
      } else {
        setResults(fetchedResults);
      }

      setCurrentOffset(offset);
      setHasMore(fetchedResults.length >= PAGE_SIZE);
    } catch (err: any) {
      console.error('Search failure:', err);
      setError(err.message || 'Failed to query literature archives.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    const nextOffset = currentOffset + PAGE_SIZE;
    executeCombinedSearch(nextOffset, true);
  };

  const handleOpenExternalWork = async (item: UnifiedLiteratureItem) => {
    try {
      setLoadingExternalId(item.id);
      const langCode = item.languageCode || 'kn';

      try {
        const res = await fetch(`/api/external/work/${encodeURIComponent(langCode)}/${encodeURIComponent(item.title)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.work && onSelectExternalWork) {
            onSelectExternalWork(data.work);
            return;
          }
        }
      } catch (backendErr) {
        console.warn('[SearchView] Backend work details unavailable, trying direct API:', backendErr);
      }

      // Direct fallback
      const directWork = await WikimediaDirectService.getWorkDetail(langCode, item.title);
      if (directWork && onSelectExternalWork) {
        onSelectExternalWork(directWork);
      } else {
        throw new Error('Could not load work details from Indian Wikimedia archives.');
      }
    } catch (err: any) {
      console.error('Error opening external work:', err);
      alert('Could not open full literature reader: ' + (err.message || 'Network error'));
    } finally {
      setLoadingExternalId(null);
    }
  };

  const handleToggleSaveExternal = async (e: React.MouseEvent, item: UnifiedLiteratureItem) => {
    e.stopPropagation();
    if (!user) {
      if (onOpenAuth) onOpenAuth('login');
      return;
    }

    try {
      setSavingId(item.id);
      const token = localStorage.getItem('literature_token');
      const res = await fetch('/api/reader/external/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          externalId: item.id,
          title: item.title,
          originalTitle: item.originalTitle || item.title,
          author: item.author || (item.creator ? item.creator.name : null),
          language: item.language,
          languageCode: item.languageCode || 'kn',
          excerpt: item.brief || item.description,
          thumbnailUrl: item.thumbnailUrl || item.coverImage,
          sourceUrl: item.sourceUrl || item.canonicalUrl,
          canonicalUrl: item.canonicalUrl,
          isFullTextAvailable: item.isFullTextAvailable,
          fullTextSource: item.fullTextSource,
          fullTextUrl: item.fullTextUrl,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSavedExternalMap((prev) => ({ ...prev, [item.id]: data.saved }));
      }
    } catch (err) {
      console.error('Failed to toggle save on external work:', err);
    } finally {
      setSavingId(null);
    }
  };

  // Real-time script & language detection handler
  const handleQueryChange = (val: string) => {
    setQuery(val);
    const detected = detectIndianLanguageCode(val) || detectIndianLanguageCode(author);
    setDetectedLanguageCode(detected);

    if (detected) {
      setLanguage(detected);
    } else if (!val.trim() && !author.trim()) {
      setLanguage('auto');
      setIsManualLanguage(false);
    }
  };

  const handleAuthorChange = (val: string) => {
    setAuthor(val);
    const detected = detectIndianLanguageCode(query) || detectIndianLanguageCode(val);
    setDetectedLanguageCode(detected);

    if (detected) {
      setLanguage(detected);
    } else if (!query.trim() && !val.trim()) {
      setLanguage('auto');
      setIsManualLanguage(false);
    }
  };

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    if (newLang === 'auto') {
      setIsManualLanguage(false);
      const detected = detectIndianLanguageCode(query) || detectIndianLanguageCode(author);
      if (detected) {
        setLanguage(detected);
      }
    } else {
      setIsManualLanguage(true);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchMode === 'literature') {
      executeCombinedSearch(0, false);
    } else {
      executeCraftSearch();
    }
  };

  const handleReset = () => {
    if (searchMode === 'literature') {
      setQuery('');
      setAuthor('');
      setCategory('');
      setGenre('');
      setSubject('');
      setLanguage('auto');
      setIsManualLanguage(false);
      setDetectedLanguageCode(null);
      setTag('');
      executeCombinedSearch(0, false);
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

  const activeFiltersCount = [query, author, category, genre, subject, language !== 'auto' ? language : '', tag].filter(Boolean).length;

  return (
    <div className="search-view-container" id="advanced-search-view">
      {/* Header */}
      <div className="search-header">
        <span className="ornament-line">✦ ✦ ✦</span>
        <h1 className="serif-title search-main-title">Literature Compendium</h1>
        <p className="search-main-subtitle">
          Dynamically explore published classics and discover literary masterpieces across regional and classical languages via Wikimedia.
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
            Literature & Wikimedia Discovery
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
        /* UNIFIED INDIAN LITERATURE SEARCH FORM */
        <div className="search-control-card" id="unified-search-control-card">
          <form onSubmit={handleFormSubmit} className="search-form" id="unified-literature-search-form">
            {/* Title / Keyword Search Bar */}
            <div className="main-search-input-group">
              <Search className="search-input-icon" size={20} />
              <input
                type="text"
                id="search-input-title"
                className="main-search-input"
                placeholder="Search classical literature in native script or English (e.g. Hamlet, Iliad, ಮಲೆಗಳಲ್ಲಿ ಮದುಮಗಳು, गोदान)..."
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
              />
              {detectedLanguageCode && detectedLanguageCode !== 'en' && (
                <div
                  className="detected-language-pill"
                  style={{
                    position: 'absolute',
                    right: query ? '220px' : '190px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    backgroundColor: 'var(--accent-burgundy-subtle, rgba(128, 0, 32, 0.08))',
                    border: '1px solid var(--accent-gold, #c5a059)',
                    color: 'var(--accent-burgundy, #6b1d2f)',
                    padding: '3px 10px',
                    borderRadius: '14px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                    zIndex: 2,
                  }}
                  id="search-detected-lang-pill"
                >
                  <Globe size={13} />
                  <span>Language: <strong>{getIndianLanguageByCode(detectedLanguageCode)?.name || detectedLanguageCode}</strong> ({getIndianLanguageByCode(detectedLanguageCode)?.nativeName})</span>
                </div>
              )}
              {query && (
                <button
                  type="button"
                  className="clear-input-btn"
                  onClick={() => handleQueryChange('')}
                  title="Clear search text"
                >
                  <X size={16} />
                </button>
              )}
              <button type="submit" className="btn btn-primary btn-search" id="btn-submit-search">
                Search Literature
              </button>
            </div>

            {/* Granular Field Filters Grid */}
            <div className="filters-grid">
              <div className="filter-field">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label htmlFor="search-select-language" className="filter-label">Indian Language</label>
                </div>
                <select
                  id="search-select-language"
                  className="input-field select-field"
                  value={language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                >
                  <option value="auto">
                    {detectedLanguageCode && detectedLanguageCode !== 'en'
                      ? `✨ Auto Detect (${getIndianLanguageByCode(detectedLanguageCode)?.name || detectedLanguageCode} detected)`
                      : '✨ Auto Detect (from input script)'}
                  </option>
                  {SUPPORTED_INDIAN_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.name} ({l.nativeName}) — {l.code}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-field">
                <label htmlFor="search-input-author" className="filter-label">Author / Creator</label>
                <input
                  type="text"
                  id="search-input-author"
                  className="input-field"
                  placeholder="e.g. ಕುವೆಂಪು, प्रेमचंद, ಭಾರತಿ..."
                  value={author}
                  onChange={(e) => handleAuthorChange(e.target.value)}
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
                  placeholder="e.g. Novel, Epic, Poetry, Play..."
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                />
              </div>

              <div className="filter-field">
                <label htmlFor="search-select-result-type" className="filter-label">Result Classification</label>
                <select
                  id="search-select-result-type"
                  className="input-field select-field"
                  value={resultType}
                  onChange={(e) => setResultType(e.target.value as any)}
                >
                  <option value="ALL">All Literature Entries</option>
                  <option value="WORK">📖 Literature Works (Novels, Poems, Plays, Epics)</option>
                  <option value="AUTHOR">✍️ Literary Authors & Poets</option>
                </select>
              </div>
            </div>

            {/* Quick-suggest chips & Reset Action */}
            <div className="search-actions-bar">
              <div className="quick-suggest-group">
                <span className="suggest-label">Explore Classics:</span>
                <button
                  type="button"
                  className="chip-btn"
                  onClick={() => {
                    setQuery('ಮಲೆಗಳಲ್ಲಿ ಮದುಮಗಳು');
                    setLanguage('kn');
                    setDetectedLanguageCode('kn');
                    setIsManualLanguage(false);
                    executeCombinedSearch(0, false);
                  }}
                  id="chip-malegalalli"
                >
                  ಮಲೆಗಳಲ್ಲಿ ಮದುಮಗಳು (Kannada)
                </button>
                <button
                  type="button"
                  className="chip-btn"
                  onClick={() => {
                    setQuery('ಕುವೆಂಪು');
                    setLanguage('kn');
                    setDetectedLanguageCode('kn');
                    setIsManualLanguage(false);
                    executeCombinedSearch(0, false);
                  }}
                  id="chip-kuvempu"
                >
                  ಕುವೆಂಪು (Author)
                </button>
                <button
                  type="button"
                  className="chip-btn"
                  onClick={() => {
                    setQuery('गोदान');
                    setLanguage('hi');
                    setDetectedLanguageCode('hi');
                    setIsManualLanguage(false);
                    executeCombinedSearch(0, false);
                  }}
                  id="chip-godan"
                >
                  गोदान (Premchand - Hindi)
                </button>
                <button
                  type="button"
                  className="chip-btn"
                  onClick={() => {
                    setQuery('சிலப்பதிகாரம்');
                    setLanguage('ta');
                    setDetectedLanguageCode('ta');
                    setIsManualLanguage(false);
                    executeCombinedSearch(0, false);
                  }}
                  id="chip-silappadikaram"
                >
                  சிலப்பதிகாரம் (Tamil Epic)
                </button>
                <button
                  type="button"
                  className="chip-btn"
                  onClick={() => {
                    setQuery('వేమన');
                    setLanguage('te');
                    setDetectedLanguageCode('te');
                    setIsManualLanguage(false);
                    executeCombinedSearch(0, false);
                  }}
                  id="chip-vemana"
                >
                  వేమన (Telugu)
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
      <div className="search-results-summary" id="search-results-summary" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div className="results-count-badge">
          <Filter size={15} />
          <span>
            {loading
              ? 'Searching Indian archives & Wikimedia...'
              : searchMode === 'artcraft'
              ? `${craftResults.length} ${craftResults.length === 1 ? 'Craft Tradition' : 'Craft Traditions'} Discovered`
              : `${results.length} ${results.length === 1 ? 'Literature Work' : 'Literature Works'} Discovered`}
          </span>
        </div>

        {searchMode === 'literature' && (detectedLanguageCode || (language && language !== 'auto')) && (
          <div
            className="search-active-lang-badge"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--accent-gold, #c5a059)',
              padding: '4px 12px',
              borderRadius: '16px',
              fontSize: '0.82rem',
              color: 'var(--accent-burgundy)',
              fontWeight: 600,
            }}
            id="search-summary-lang-badge"
          >
            <Globe size={13} />
            <span>
              Literature Language: <strong>{getIndianLanguageByCode(detectedLanguageCode || language)?.name || (detectedLanguageCode || language)}</strong> ({getIndianLanguageByCode(detectedLanguageCode || language)?.nativeName})
            </span>
          </div>
        )}
      </div>

      {/* Results Grid / Loading / Empty State */}
      {loading ? (
        <div className="search-loading" id="search-loading-indicator">
          <div className="loading-spinner"></div>
          <p className="loading-text">
            Examining published manuscripts and querying Indian Wikimedia repositories...
          </p>
        </div>
      ) : error ? (
        <div className="search-error-state" id="search-error-indicator">
          <p className="error-icon">⚠️</p>
          <p>{error}</p>
          <button
            className="btn btn-secondary"
            onClick={
              searchMode === 'artcraft'
                ? executeCraftSearch
                : () => executeCombinedSearch(0, false)
            }
          >
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
        <>
          {/* Result Filter Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`chip-btn ${resultType === 'ALL' ? 'active' : ''}`}
              style={{
                backgroundColor: resultType === 'ALL' ? 'var(--accent-burgundy)' : 'var(--bg-secondary)',
                color: resultType === 'ALL' ? '#fff' : 'var(--text-primary)',
                fontWeight: 600,
              }}
              onClick={() => setResultType('ALL')}
            >
              All Discovered ({results.length})
            </button>
            <button
              type="button"
              className={`chip-btn ${resultType === 'WORK' ? 'active' : ''}`}
              style={{
                backgroundColor: resultType === 'WORK' ? 'var(--accent-burgundy)' : 'var(--bg-secondary)',
                color: resultType === 'WORK' ? '#fff' : 'var(--text-primary)',
                fontWeight: 600,
              }}
              onClick={() => setResultType('WORK')}
            >
              📖 Literature Works ({results.filter(r => r.itemType !== 'AUTHOR').length})
            </button>
            <button
              type="button"
              className={`chip-btn ${resultType === 'AUTHOR' ? 'active' : ''}`}
              style={{
                backgroundColor: resultType === 'AUTHOR' ? 'var(--accent-burgundy)' : 'var(--bg-secondary)',
                color: resultType === 'AUTHOR' ? '#fff' : 'var(--text-primary)',
                fontWeight: 600,
              }}
              onClick={() => setResultType('AUTHOR')}
            >
              ✍️ Literary Figures & Authors ({results.filter(r => r.itemType === 'AUTHOR').length})
            </button>
          </div>

          <div className="literature-grid search-results-grid" id="search-results-grid">
            {results
              .filter((item) => {
                if (resultType === 'ALL') return true;
                if (resultType === 'AUTHOR') return item.itemType === 'AUTHOR';
                return item.itemType !== 'AUTHOR';
              })
              .map((item) => {
              if (item.source === 'APPLICATION') {
                return (
                  <LiteratureCard
                    key={`search-app-${item.id}`}
                    item={{
                      id: item.id,
                      title: item.title,
                      subheading: item.subheading,
                      brief: item.brief,
                      language: item.language,
                      genre: item.genre || 'Literature',
                      coverImage: item.coverImage,
                      publicationDate: item.publicationDate || new Date().toISOString(),
                      creator: item.creator ? { id: item.creator.id || '', name: item.creator.name, bio: item.creator.bio } : null,
                      category: item.category ? { id: item.category.id || '', name: item.category.name, slug: item.category.slug || '' } : null,
                      totalRatingsCount: item.totalRatingsCount || 0,
                      averageRating: item.averageRating || 0,
                      totalSavesCount: item.totalSavesCount || 0,
                      totalCommentsCount: item.totalCommentsCount || 0,
                      likesCount: item.likesCount,
                      downvotesCount: item.downvotesCount,
                    }}
                    badge="Published Literature"
                    badgeType="category"
                    onSelect={() => onSelectLiterature && onSelectLiterature(item as any)}
                    user={user}
                    onOpenAuth={onOpenAuth}
                  />
                );
              }

              // WIKIMEDIA Dynamic Result Card
              const isSaved = savedExternalMap[item.id] || false;
              const isSaving = savingId === item.id;
              const isAuthor = item.itemType === 'AUTHOR';

              return (
                <div
                  key={`search-wiki-${item.id}`}
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

                        {isAuthor ? (
                          <span className="tag-badge" style={{ fontSize: '0.75rem', backgroundColor: '#eef2ff', color: '#4338ca', borderColor: '#c7d2fe', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <User size={11} /> {item.literatureType || 'Literary Author'}
                          </span>
                        ) : (
                          <span className="tag-badge" style={{ fontSize: '0.75rem', backgroundColor: '#fef3c7', color: '#92400e', borderColor: '#fde68a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Feather size={11} /> {item.literatureType || 'Literary Work'}
                          </span>
                        )}

                        <span className="tag-badge" style={{ fontSize: '0.75rem', backgroundColor: 'var(--accent-gold-subtle)', color: 'var(--accent-burgundy)', borderColor: 'var(--accent-gold)' }}>
                          {item.sourceLabel}
                        </span>

                        {item.isFullTextAvailable ? (
                          <span className="tag-badge" style={{ fontSize: '0.75rem', backgroundColor: '#e6f4ea', color: '#137333', borderColor: '#ceead6', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <BookCheck size={11} /> Full Text (Wikisource)
                          </span>
                        ) : null}
                      </div>

                      {/* Bookmark Save Button */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleSaveExternal(e, item)}
                        disabled={isSaving}
                        title={isSaved ? 'Saved to Sanctuary' : 'Save to Sanctuary'}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: isSaved ? 'var(--accent-burgundy)' : 'var(--text-muted)',
                          padding: '4px',
                        }}
                      >
                        <Bookmark size={18} fill={isSaved ? 'var(--accent-burgundy)' : 'none'} />
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.85rem' }}>
                      {item.thumbnailUrl ? (
                        <img
                          src={item.thumbnailUrl}
                          alt={item.title}
                          style={{
                            width: '65px',
                            height: '85px',
                            objectFit: 'cover',
                            borderRadius: isAuthor ? '50%' : '4px',
                            border: '1px solid var(--border-classic)',
                            flexShrink: 0,
                          }}
                          onError={(e) => {
                            // Safe fallback to placeholder on image failure
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                          loading="lazy"
                        />
                      ) : (
                        <div
                          style={{
                            width: '65px',
                            height: '85px',
                            borderRadius: isAuthor ? '50%' : '4px',
                            backgroundColor: 'var(--bg-secondary)',
                            border: '1px solid var(--border-classic)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            color: 'var(--text-muted)',
                            flexShrink: 0,
                            padding: '4px',
                            textAlign: 'center',
                          }}
                          title={isAuthor ? 'Author Portrait Placeholder' : 'Literature Book Placeholder'}
                        >
                          {isAuthor ? <User size={22} /> : <BookOpen size={22} />}
                          <span style={{ fontSize: '0.62rem', lineHeight: '1' }}>{isAuthor ? 'Author' : 'Work'}</span>
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3
                          className="serif-title"
                          style={{ fontSize: '1.2rem', color: 'var(--accent-burgundy)', margin: '0 0 0.35rem 0', lineHeight: '1.3' }}
                        >
                          {item.title}
                        </h3>
                        {item.author && (
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 0.3rem 0' }}>
                            By <strong>{item.author}</strong>
                          </p>
                        )}
                        {isAuthor && item.literatureType && (
                          <p style={{ fontSize: '0.82rem', color: 'var(--accent-burgundy)', margin: '0 0 0.3rem 0', fontWeight: 600 }}>
                            {item.literatureType} • Literary Figure
                          </p>
                        )}
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
                          {item.excerpt || item.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-classic)', paddingTop: '1rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <a
                      href={item.sourceUrl || item.canonicalUrl}
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
                      disabled={loadingExternalId === item.id}
                    >
                      {loadingExternalId === item.id ? (
                        'Loading Folio...'
                      ) : (
                        <>
                          <BookOpen size={14} style={{ marginRight: '5px' }} />
                          {item.isFullTextAvailable ? 'Read Full Work' : isAuthor ? 'Explore Author' : 'Read Literature'}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Load More Pagination */}
          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleLoadMore}
                disabled={loadingMore}
                id="btn-load-more-literature"
                style={{ padding: '0.75rem 2rem', fontSize: '0.95rem' }}
              >
                {loadingMore ? 'Retrieving More Literature...' : 'Load More Literature'}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="empty-search-state" id="empty-search-state">
          <p className="empty-icon">📜</p>
          <h3 className="serif-title empty-title">No Literature Found</h3>
          <p className="empty-desc">
            No manuscripts matched your query across published literature or Indian-language Wikimedia sources. Try searching with a broader title, author name, or native Indian script.
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
