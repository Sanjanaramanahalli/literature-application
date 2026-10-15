import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Feather,
  Archive,
  Users,
  Star,
  TrendingUp,
  MessageSquare,
  BookmarkCheck,
  Search,
  RotateCcw,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { getApiUrl } from '../config/api';
import './AdminStatDetailView.css';

export type StatSubView =
  | 'total-literature'
  | 'published-literature'
  | 'draft-literature'
  | 'unpublished-literature'
  | 'registered-readers'
  | 'total-ratings'
  | 'average-rating'
  | 'total-comments'
  | 'total-saves';

interface AdminStatDetailViewProps {
  view: StatSubView;
  onBack: () => void;
  onViewLiterature?: (id: string) => void;
  onPreviewLiterature?: (lit: any) => void;
  onRefreshDashboard?: () => void;
}

export const AdminStatDetailView: React.FC<AdminStatDetailViewProps> = ({
  view,
  onBack,
  onViewLiterature,
}) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedRating, setSelectedRating] = useState('ALL');
  const [sortBy, setSortBy] = useState('default');

  // Stats meta returned by server (e.g. overall average)
  const [serverMeta, setServerMeta] = useState<any>({});

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const getPageConfig = () => {
    switch (view) {
      case 'total-literature':
        return {
          title: 'Total Literature Directory',
          subtitle: 'All cataloged literary works, including published masterworks, active curatorial drafts, and archived manuscripts.',
          breadcrumb: 'Total Literature',
          icon: <BookOpen size={24} />,
          endpoint: '/api/admin/literature',
        };
      case 'published-literature':
        return {
          title: 'Published Works Catalog',
          subtitle: 'All literature actively published and accessible to global readers in the Athenæum public sanctuary.',
          breadcrumb: 'Published Works',
          icon: <CheckCircle2 size={24} />,
          endpoint: '/api/admin/literature?status=PUBLISHED',
        };
      case 'draft-literature':
        return {
          title: 'Curatorial Draft Literature',
          subtitle: 'In-progress manuscripts currently being authored, annotated, and translated before official publication.',
          breadcrumb: 'Draft Literature',
          icon: <Feather size={24} />,
          endpoint: '/api/admin/literature?status=DRAFT',
        };
      case 'unpublished-literature':
        return {
          title: 'Unpublished & Decommissioned Literature',
          subtitle: 'Literary works preserved in sanctuary cold storage or withdrawn from public view.',
          breadcrumb: 'Unpublished Literature',
          icon: <Archive size={24} />,
          endpoint: '/api/admin/literature?status=UNPUBLISHED',
        };
      case 'registered-readers':
        return {
          title: 'Registered Readers & Scholars',
          subtitle: 'Curated roster of active reader accounts. Administrator accounts are strictly excluded from this directory.',
          breadcrumb: 'Registered Readers',
          icon: <Users size={24} />,
          endpoint: '/api/admin/readers',
        };
      case 'total-ratings':
        return {
          title: 'Scholar Rating Logs',
          subtitle: 'Every individual rating cast by registered readers across the classical literature sanctuary.',
          breadcrumb: 'Total Ratings',
          icon: <Star size={24} />,
          endpoint: '/api/admin/ratings',
        };
      case 'average-rating':
        return {
          title: 'Literature Rating Summaries & Averages',
          subtitle: 'Granular evaluation metrics, per-work average star ratings, and cumulative sanctuary score distribution.',
          breadcrumb: 'Average Rating',
          icon: <TrendingUp size={24} />,
          endpoint: '/api/admin/ratings/summary',
        };
      case 'total-comments':
        return {
          title: 'Reader Reflections & Threaded Discussions',
          subtitle: 'All scholarly comments, literary reflections, and threaded replies across archived works.',
          breadcrumb: 'Total Comments',
          icon: <MessageSquare size={24} />,
          endpoint: '/api/admin/comments',
        };
      case 'total-saves':
        return {
          title: 'Bookmarked Literature & Reading Rooms',
          subtitle: 'Sanctuary bookmarks and reading list records saved by registered scholars.',
          breadcrumb: 'Total Saves',
          icon: <BookmarkCheck size={24} />,
          endpoint: '/api/admin/saves',
        };
    }
  };

  const config = getPageConfig();

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('literature_token');
      const res = await fetch(getApiUrl(config.endpoint), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const json = await res.json();

      if (view === 'total-literature' || view === 'published-literature' || view === 'draft-literature' || view === 'unpublished-literature') {
        setData(json.literatures || []);
      } else if (view === 'registered-readers') {
        setData(json.readers || []);
      } else if (view === 'total-ratings') {
        setData(json.ratings || []);
      } else if (view === 'average-rating') {
        setData(json.summary || []);
        setServerMeta({
          overallAverage: json.overallAverage,
          totalRatingsRecorded: json.totalRatingsRecorded,
        });
      } else if (view === 'total-comments') {
        setData(json.comments || []);
      } else if (view === 'total-saves') {
        setData(json.saves || []);
      }
    } catch (err: any) {
      console.error('Error fetching stat page data:', err);
      setError(err.message || 'Failed to retrieve records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    setCurrentPage(1);
    setSearchQuery('');
    setSelectedLanguage('ALL');
    setSelectedCategory('ALL');
    setSelectedStatus('ALL');
    setSelectedRating('ALL');
    setSortBy('default');
  }, [view]);

  // Handle client-side filtering and sorting for instant responsiveness
  const filteredData = useMemo(() => {
    let result = [...data];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((item) => {
        if (view.includes('literature') || view === 'average-rating') {
          return (
            item.title?.toLowerCase().includes(q) ||
            item.creator?.name?.toLowerCase().includes(q) ||
            item.author?.toLowerCase().includes(q) ||
            item.genre?.toLowerCase().includes(q) ||
            item.language?.toLowerCase().includes(q)
          );
        } else if (view === 'registered-readers') {
          return (
            item.name?.toLowerCase().includes(q) ||
            item.email?.toLowerCase().includes(q)
          );
        } else if (view === 'total-ratings') {
          return (
            item.literatureTitle?.toLowerCase().includes(q) ||
            item.readerName?.toLowerCase().includes(q) ||
            item.literatureAuthor?.toLowerCase().includes(q)
          );
        } else if (view === 'total-comments') {
          return (
            item.content?.toLowerCase().includes(q) ||
            item.readerName?.toLowerCase().includes(q) ||
            item.literatureTitle?.toLowerCase().includes(q)
          );
        } else if (view === 'total-saves') {
          return (
            item.literatureTitle?.toLowerCase().includes(q) ||
            item.readerName?.toLowerCase().includes(q) ||
            item.literatureAuthor?.toLowerCase().includes(q)
          );
        }
        return true;
      });
    }

    // Language filter
    if (selectedLanguage !== 'ALL') {
      result = result.filter((item) => {
        const lang = item.language || item.literatureLanguage;
        return lang && lang.toLowerCase() === selectedLanguage.toLowerCase();
      });
    }

    // Category filter
    if (selectedCategory !== 'ALL') {
      result = result.filter((item) => {
        const cat = item.category?.name || item.category || item.literatureCategory;
        return cat && cat.toLowerCase() === selectedCategory.toLowerCase();
      });
    }

    // Status filter (for general literature view or readers)
    if (selectedStatus !== 'ALL') {
      result = result.filter((item) => {
        if (view === 'registered-readers') {
          return item.accountStatus?.toLowerCase() === selectedStatus.toLowerCase();
        }
        return item.publicationStatus === selectedStatus;
      });
    }

    // Rating filter (for total-ratings)
    if (selectedRating !== 'ALL') {
      const rNum = Number(selectedRating);
      result = result.filter((item) => item.value === rNum);
    }

    // Sort order for average rating view
    if (view === 'average-rating') {
      if (sortBy === 'highest') {
        result.sort((a, b) => (b.averageRating ?? -1) - (a.averageRating ?? -1));
      } else if (sortBy === 'lowest') {
        result.sort((a, b) => (a.averageRating ?? 999) - (b.averageRating ?? 999));
      } else if (sortBy === 'most-ratings') {
        result.sort((a, b) => b.ratingsCount - a.ratingsCount);
      } else if (sortBy === 'least-ratings') {
        result.sort((a, b) => a.ratingsCount - b.ratingsCount);
      }
    }

    return result;
  }, [data, searchQuery, selectedLanguage, selectedCategory, selectedStatus, selectedRating, sortBy, view]);

  // Derived unique lists for dropdown filters
  const availableLanguages = useMemo(() => {
    const set = new Set<string>();
    data.forEach((item) => {
      const l = item.language || item.literatureLanguage;
      if (l) set.add(l);
    });
    return Array.from(set).sort();
  }, [data]);

  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    data.forEach((item) => {
      const c = item.category?.name || item.category || item.literatureCategory;
      if (c) set.add(c);
    });
    return Array.from(set).sort();
  }, [data]);

  // Pagination slice
  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedLanguage('ALL');
    setSelectedCategory('ALL');
    setSelectedStatus('ALL');
    setSelectedRating('ALL');
    setSortBy('default');
    setCurrentPage(1);
  };

  return (
    <div className="admin-stat-view" id={`admin-stat-view-${view}`} data-testid={`admin-stat-view-${view}`}>
      {/* 1. Header with Breadcrumbs & Back Navigation */}
      <div className="admin-stat-header">
        <div className="admin-stat-breadcrumb">
          <button type="button" onClick={onBack} id="btn-stat-breadcrumb-dashboard">
            Dashboard
          </button>
          <span className="admin-stat-breadcrumb-sep">/</span>
          <span className="admin-stat-breadcrumb-current">{config.breadcrumb}</span>
        </div>

        <div className="admin-stat-title-row">
          <div>
            <h1 className="admin-stat-heading">
              {config.icon}
              <span>{config.title}</span>
            </h1>
            <p className="admin-stat-subtitle">{config.subtitle}</p>
          </div>

          <button
            type="button"
            className="admin-stat-back-btn"
            onClick={onBack}
            id="btn-stat-back-to-dashboard"
          >
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>

      {/* 2. Key Telemetry Pill Banner */}
      <div className="admin-stat-summary-bar">
        <div className="admin-stat-pill">
          <span className="admin-stat-pill-label">Total Persisted Records</span>
          <span className="admin-stat-pill-val" id="stat-total-records-val">
            {data.length}
          </span>
        </div>

        {view === 'average-rating' && (
          <>
            <div className="admin-stat-pill">
              <span className="admin-stat-pill-label">Cumulative Sanctuary Average</span>
              <span className="admin-stat-pill-val" id="stat-cumulative-average-val">
                {serverMeta.overallAverage !== undefined ? serverMeta.overallAverage.toFixed(1) : '0.0'} ⭐
              </span>
            </div>
            <div className="admin-stat-pill">
              <span className="admin-stat-pill-label">Total Verified Ratings</span>
              <span className="admin-stat-pill-val">
                {serverMeta.totalRatingsRecorded || 0}
              </span>
            </div>
          </>
        )}

        {view === 'published-literature' && (
          <div className="admin-stat-pill">
            <span className="admin-stat-pill-label">Live Public Works</span>
            <span className="admin-stat-pill-val" style={{ color: '#059669' }}>
              100% Live
            </span>
          </div>
        )}

        {view === 'registered-readers' && (
          <div className="admin-stat-pill">
            <span className="admin-stat-pill-label">Reader Role Security</span>
            <span className="admin-stat-pill-val" style={{ fontSize: '1.05rem', color: '#2563EB' }}>
              Admins Strictly Excluded
            </span>
          </div>
        )}
      </div>

      {/* 3. Search and Filtering Section */}
      <div className="admin-stat-filter-card">
        <div className="admin-stat-filter-row">
          <div className="admin-stat-search-box">
            <Search size={16} />
            <input
              type="text"
              className="admin-stat-search-input"
              placeholder={`Search ${config.breadcrumb.toLowerCase()} by title, author, keyword...`}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              id="stat-search-input"
            />
          </div>

          {/* Language filter for literature, saves, rating summary */}
          {(view.includes('literature') || view === 'average-rating' || view === 'total-saves') && availableLanguages.length > 0 && (
            <select
              className="admin-stat-select"
              value={selectedLanguage}
              onChange={(e) => {
                setSelectedLanguage(e.target.value);
                setCurrentPage(1);
              }}
              id="stat-filter-language"
            >
              <option value="ALL">All Languages</option>
              {availableLanguages.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          )}

          {/* Category filter */}
          {(view.includes('literature') || view === 'average-rating' || view === 'total-saves') && availableCategories.length > 0 && (
            <select
              className="admin-stat-select"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              id="stat-filter-category"
            >
              <option value="ALL">All Categories</option>
              {availableCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}

          {/* Status filter for general literature */}
          {view === 'total-literature' && (
            <select
              className="admin-stat-select"
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              id="stat-filter-status"
            >
              <option value="ALL">All Statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="UNPUBLISHED">Unpublished</option>
            </select>
          )}

          {/* Rating filter for total-ratings */}
          {view === 'total-ratings' && (
            <select
              className="admin-stat-select"
              value={selectedRating}
              onChange={(e) => {
                setSelectedRating(e.target.value);
                setCurrentPage(1);
              }}
              id="stat-filter-rating"
            >
              <option value="ALL">All Star Ratings</option>
              <option value="5">5 Stars ★★★★★</option>
              <option value="4">4 Stars ★★★★☆</option>
              <option value="3">3 Stars ★★★☆☆</option>
              <option value="2">2 Stars ★★☆☆☆</option>
              <option value="1">1 Star ★☆☆☆☆</option>
            </select>
          )}

          {/* Sorting for average-rating */}
          {view === 'average-rating' && (
            <select
              className="admin-stat-select"
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
              id="stat-sort-rating"
            >
              <option value="default">Default Sort</option>
              <option value="highest">Highest Average Rating</option>
              <option value="lowest">Lowest Average Rating</option>
              <option value="most-ratings">Most Ratings Recorded</option>
              <option value="least-ratings">Least Ratings Recorded</option>
            </select>
          )}

          <button
            type="button"
            className="admin-stat-reset-btn"
            onClick={handleResetFilters}
            id="btn-stat-reset-filters"
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>
        </div>

        <div className="admin-stat-result-count-bar">
          <div>
            Showing <strong>{paginatedData.length}</strong> of <strong>{filteredData.length}</strong> matching records
            <span className="admin-stat-badge-count">{filteredData.length} Results</span>
          </div>
          <div>Page {currentPage} of {totalPages}</div>
        </div>
      </div>

      {/* 4. Main Data Display: Table on Desktop, Cards on Mobile */}
      {loading ? (
        <div className="admin-stat-loading">
          <div className="admin-stat-loading-spinner" />
          <p>Retrieving database records from Athenæum repository...</p>
        </div>
      ) : error ? (
        <div className="admin-stat-empty">
          <div className="admin-stat-empty-icon" style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>
            <Archive size={28} />
          </div>
          <h3 className="admin-stat-empty-title">Error Loading Records</h3>
          <p className="admin-stat-empty-desc">{error}</p>
          <button type="button" className="admin-stat-back-btn" onClick={fetchData}>
            Retry Request
          </button>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="admin-stat-empty">
          <div className="admin-stat-empty-icon">
            <Search size={28} />
          </div>
          <h3 className="admin-stat-empty-title">No Matching Records Found</h3>
          <p className="admin-stat-empty-desc">
            No records match the active search and filter criteria. Try resetting filters or adjusting search parameters.
          </p>
          <button type="button" className="admin-stat-back-btn" onClick={handleResetFilters}>
            Clear All Filters
          </button>
        </div>
      ) : (
        <>
          {/* DESKTOP DATA TABLE */}
          <div className="admin-stat-table-wrap">
            <table className="admin-stat-table" id={`stat-table-${view}`}>
              <thead>
                {/* Dynamic Table Headers per View */}
                {view === 'total-literature' && (
                  <tr>
                    <th style={{ width: '50px' }}>No.</th>
                    <th>Literature Title</th>
                    <th>Author</th>
                    <th>Language</th>
                    <th>Category</th>
                    <th>Review Status</th>
                    <th>Publication Status</th>
                    <th>Created Date</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                )}
                {view === 'published-literature' && (
                  <tr>
                    <th style={{ width: '50px' }}>No.</th>
                    <th>Literature Title</th>
                    <th>Author</th>
                    <th>Language</th>
                    <th>Category</th>
                    <th>Publication Date</th>
                    <th>Average Rating</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                )}
                {view === 'draft-literature' && (
                  <tr>
                    <th style={{ width: '50px' }}>No.</th>
                    <th>Literature Title</th>
                    <th>Author</th>
                    <th>Language</th>
                    <th>Category</th>
                    <th>Last Updated</th>
                    <th>Draft Created Date</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                )}
                {view === 'unpublished-literature' && (
                  <tr>
                    <th style={{ width: '50px' }}>No.</th>
                    <th>Literature Title</th>
                    <th>Author</th>
                    <th>Language</th>
                    <th>Review Status</th>
                    <th>Publication Status</th>
                    <th>Last Updated</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                )}
                {view === 'registered-readers' && (
                  <tr>
                    <th style={{ width: '50px' }}>No.</th>
                    <th>Reader Name</th>
                    <th>Email</th>
                    <th>Registration Date</th>
                    <th>Ratings Contributed</th>
                    <th>Reflections Written</th>
                    <th>Saves Recorded</th>
                    <th>Account Status</th>
                    <th style={{ textAlign: 'right' }}>Role</th>
                  </tr>
                )}
                {view === 'total-ratings' && (
                  <tr>
                    <th style={{ width: '50px' }}>No.</th>
                    <th>Literature Title</th>
                    <th>Author</th>
                    <th>Reader</th>
                    <th>Rating</th>
                    <th>Rating Date</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                )}
                {view === 'average-rating' && (
                  <tr>
                    <th style={{ width: '50px' }}>No.</th>
                    <th>Literature Title</th>
                    <th>Author</th>
                    <th>Language</th>
                    <th>Category</th>
                    <th>Number of Ratings</th>
                    <th>Average Rating</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                )}
                {view === 'total-comments' && (
                  <tr>
                    <th style={{ width: '50px' }}>No.</th>
                    <th>Comment or Reply</th>
                    <th>Reader</th>
                    <th>Literature Title</th>
                    <th>Created Date</th>
                    <th>Moderation Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                )}
                {view === 'total-saves' && (
                  <tr>
                    <th style={{ width: '50px' }}>No.</th>
                    <th>Literature Title</th>
                    <th>Author</th>
                    <th>Reader</th>
                    <th>Language</th>
                    <th>Category</th>
                    <th>Saved Date</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                )}
              </thead>

              <tbody>
                {paginatedData.map((row, idx) => {
                  const rowNumber = (currentPage - 1) * pageSize + idx + 1;

                  if (view === 'total-literature') {
                    return (
                      <tr key={row.id}>
                        <td>{rowNumber}</td>
                        <td className="admin-stat-table-primary">{row.title}</td>
                        <td>{row.creator?.name || 'Unknown'}</td>
                        <td>{row.language || 'English'}</td>
                        <td>{row.category?.name || 'Classics'}</td>
                        <td>
                          <span className="admin-stat-badge published">Approved</span>
                        </td>
                        <td>
                          <span className={`admin-stat-badge ${row.publicationStatus.toLowerCase()}`}>
                            {row.publicationStatus}
                          </span>
                        </td>
                        <td>{new Date(row.createdAt).toLocaleDateString()}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="admin-stat-action-btn"
                            onClick={() => onViewLiterature?.(row.id)}
                            title="View in reader"
                          >
                            <Eye size={13} /> View
                          </button>
                        </td>
                      </tr>
                    );
                  }

                  if (view === 'published-literature') {
                    return (
                      <tr key={row.id}>
                        <td>{rowNumber}</td>
                        <td className="admin-stat-table-primary">{row.title}</td>
                        <td>{row.creator?.name || 'Unknown'}</td>
                        <td>{row.language || 'English'}</td>
                        <td>{row.category?.name || 'Classics'}</td>
                        <td>
                          {row.publicationDate ? new Date(row.publicationDate).toLocaleDateString() : 'Published'}
                        </td>
                        <td>
                          {row.totalRatingsCount > 0 ? (
                            <span className="admin-stat-stars">
                              ★ {row.averageRating.toFixed(1)} ({row.totalRatingsCount})
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>No ratings</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="admin-stat-action-btn"
                            onClick={() => onViewLiterature?.(row.id)}
                            title="Read published work"
                          >
                            <Eye size={13} /> View
                          </button>
                        </td>
                      </tr>
                    );
                  }

                  if (view === 'draft-literature') {
                    return (
                      <tr key={row.id}>
                        <td>{rowNumber}</td>
                        <td className="admin-stat-table-primary">{row.title}</td>
                        <td>{row.creator?.name || 'Unknown'}</td>
                        <td>{row.language || 'English'}</td>
                        <td>{row.category?.name || 'Classics'}</td>
                        <td>{new Date(row.updatedAt || row.createdAt).toLocaleDateString()}</td>
                        <td>{new Date(row.createdAt).toLocaleDateString()}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="admin-stat-action-btn"
                            onClick={() => onViewLiterature?.(row.id)}
                          >
                            <Eye size={13} /> Preview
                          </button>
                        </td>
                      </tr>
                    );
                  }

                  if (view === 'unpublished-literature') {
                    return (
                      <tr key={row.id}>
                        <td>{rowNumber}</td>
                        <td className="admin-stat-table-primary">{row.title}</td>
                        <td>{row.creator?.name || 'Unknown'}</td>
                        <td>{row.language || 'English'}</td>
                        <td>
                          <span className="admin-stat-badge unpublished">Archived</span>
                        </td>
                        <td>
                          <span className="admin-stat-badge unpublished">{row.publicationStatus}</span>
                        </td>
                        <td>{new Date(row.updatedAt || row.createdAt).toLocaleDateString()}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="admin-stat-action-btn"
                            onClick={() => onViewLiterature?.(row.id)}
                          >
                            <Eye size={13} /> Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  }

                  if (view === 'registered-readers') {
                    return (
                      <tr key={row.id}>
                        <td>{rowNumber}</td>
                        <td className="admin-stat-table-primary">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent-burgundy-subtle)', color: 'var(--accent-burgundy)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem' }}>
                              {row.name ? row.name[0].toUpperCase() : 'R'}
                            </div>
                            <span>{row.name}</span>
                          </div>
                        </td>
                        <td>{row.email}</td>
                        <td>{new Date(row.createdAt).toLocaleDateString()}</td>
                        <td>{row.ratingsCount || 0}</td>
                        <td>{row.commentsCount || 0}</td>
                        <td>{row.savesCount || 0}</td>
                        <td>
                          <span className="admin-stat-badge active">{row.accountStatus || 'Active'}</span>
                        </td>
                        <td style={{ textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                          Reader
                        </td>
                      </tr>
                    );
                  }

                  if (view === 'total-ratings') {
                    return (
                      <tr key={row.id}>
                        <td>{rowNumber}</td>
                        <td className="admin-stat-table-primary">{row.literatureTitle}</td>
                        <td>{row.literatureAuthor}</td>
                        <td>{row.readerName}</td>
                        <td>
                          <span className="admin-stat-stars">
                            {'★'.repeat(row.value)}{'☆'.repeat(5 - row.value)} ({row.value}/5)
                          </span>
                        </td>
                        <td>{new Date(row.createdAt).toLocaleDateString()}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="admin-stat-action-btn"
                            onClick={() => onViewLiterature?.(row.literatureId)}
                          >
                            <Eye size={13} /> View Work
                          </button>
                        </td>
                      </tr>
                    );
                  }

                  if (view === 'average-rating') {
                    return (
                      <tr key={row.id}>
                        <td>{rowNumber}</td>
                        <td className="admin-stat-table-primary">{row.title}</td>
                        <td>{row.author}</td>
                        <td>{row.language}</td>
                        <td>{row.category}</td>
                        <td>{row.ratingsCount} verified rating{row.ratingsCount === 1 ? '' : 's'}</td>
                        <td>
                          {row.averageRating !== null ? (
                            <span className="admin-stat-stars">
                              ★ {row.averageRating.toFixed(1)} / 5.0
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                              No ratings yet
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="admin-stat-action-btn"
                            onClick={() => onViewLiterature?.(row.id)}
                          >
                            <Eye size={13} /> View
                          </button>
                        </td>
                      </tr>
                    );
                  }

                  if (view === 'total-comments') {
                    return (
                      <tr key={row.id}>
                        <td>{rowNumber}</td>
                        <td className="admin-stat-table-primary" style={{ maxWidth: '300px' }}>
                          <div style={{ fontStyle: 'italic', color: 'var(--text-primary)' }}>
                            "{row.content}"
                          </div>
                          {row.isReply && (
                            <span style={{ fontSize: '0.72rem', color: 'var(--accent-burgundy)', fontWeight: 600 }}>
                              ↳ Threaded reply
                            </span>
                          )}
                        </td>
                        <td>{row.readerName}</td>
                        <td>{row.literatureTitle}</td>
                        <td>{new Date(row.createdAt).toLocaleDateString()}</td>
                        <td>
                          <span className="admin-stat-badge published">Approved</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="admin-stat-action-btn"
                            onClick={() => onViewLiterature?.(row.literatureId)}
                          >
                            <Eye size={13} /> View Context
                          </button>
                        </td>
                      </tr>
                    );
                  }

                  if (view === 'total-saves') {
                    return (
                      <tr key={row.id}>
                        <td>{rowNumber}</td>
                        <td className="admin-stat-table-primary">{row.literatureTitle}</td>
                        <td>{row.literatureAuthor}</td>
                        <td>{row.readerName}</td>
                        <td>{row.literatureLanguage}</td>
                        <td>{row.literatureCategory}</td>
                        <td>{new Date(row.createdAt).toLocaleDateString()}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="admin-stat-action-btn"
                            onClick={() => onViewLiterature?.(row.literatureId)}
                          >
                            <Eye size={13} /> View Work
                          </button>
                        </td>
                      </tr>
                    );
                  }

                  return null;
                })}
              </tbody>
            </table>
          </div>

          {/* MOBILE RESPONSIVE CARDS (< 768px) */}
          <div className="admin-stat-mobile-cards">
            {paginatedData.map((row, idx) => {
              const rowNumber = (currentPage - 1) * pageSize + idx + 1;
              return (
                <div key={row.id || idx} className="admin-stat-card-row">
                  <div className="admin-stat-card-row-top">
                    <span className="admin-stat-card-row-title">
                      #{rowNumber} {row.title || row.literatureTitle || row.name || row.content}
                    </span>
                    {(row.publicationStatus || row.accountStatus) && (
                      <span className={`admin-stat-badge ${(row.publicationStatus || row.accountStatus).toLowerCase()}`}>
                        {row.publicationStatus || row.accountStatus}
                      </span>
                    )}
                  </div>

                  <div className="admin-stat-card-row-meta">
                    {row.creator?.name && <span>Author: {row.creator.name}</span>}
                    {row.literatureAuthor && <span>Author: {row.literatureAuthor}</span>}
                    {row.language && <span>Language: {row.language}</span>}
                    {row.category?.name && <span>Category: {row.category.name}</span>}
                    {row.email && <span>Email: {row.email}</span>}
                    {row.value && (
                      <span className="admin-stat-stars">
                        Rating: ★ {row.value}/5
                      </span>
                    )}
                    {row.averageRating !== undefined && row.averageRating !== null && (
                      <span className="admin-stat-stars">
                        Avg: ★ {row.averageRating.toFixed(1)} ({row.ratingsCount} ratings)
                      </span>
                    )}
                    {row.createdAt && (
                      <span>Date: {new Date(row.createdAt).toLocaleDateString()}</span>
                    )}
                  </div>

                  {(row.id || row.literatureId) && (
                    <div className="admin-stat-card-row-actions">
                      <button
                        type="button"
                        className="admin-stat-action-btn"
                        onClick={() => onViewLiterature?.(row.id || row.literatureId)}
                      >
                        <Eye size={13} /> View Details
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 5. Pagination Controls */}
          {totalPages > 1 && (
            <div className="admin-stat-pagination">
              <span className="admin-stat-page-info">
                Page {currentPage} of {totalPages} ({filteredData.length} total entries)
              </span>

              <div className="admin-stat-page-btns">
                <button
                  type="button"
                  className="admin-stat-page-btn"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  id="btn-stat-page-prev"
                >
                  <ChevronLeft size={16} /> Previous
                </button>

                <button
                  type="button"
                  className="admin-stat-page-btn"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  id="btn-stat-page-next"
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
