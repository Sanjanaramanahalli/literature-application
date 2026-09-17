import React, { useState, useEffect, useRef } from 'react';
import {
  Feather,
  Upload,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  Layers,
  Plus,
  Trash2,
  Eye,
  Check,
  RotateCcw,
  ShieldAlert,
  BarChart3,
  Users,
  Star,
  MessageSquare,
  BookmarkCheck,
  TrendingUp,
  RefreshCw,
  Activity,
  Archive,
  Settings,
  FolderKanban,
  MessageCircle,
  ShieldCheck,
  Flame,
  Tag,
} from 'lucide-react';

import './AdminEditorialView.css';


interface Creator {
  id: string;
  name: string;
  roleType: string;
}

interface KpiData {
  totalLiterature: number;
  publishedLiterature: number;
  draftLiterature: number;
  unpublishedLiterature: number;
  registeredReaders: number;
  totalRatings: number;
  averageRating: number;
  totalComments: number;
  totalSaves: number;
  newUsersThisMonth?: number;
  newReleasesThisMonth?: number;
}

interface SecondaryComment {
  id: string;
  content: string;
  createdAt: string;
  readerName?: string;
  literatureTitle?: string;
  moderationStatus?: string;
  user?: { name: string; role: string };
  literature?: { title: string };
}

interface SecondaryLiterature {
  id: string;
  title: string;
  language?: string;
  publicationStatus: string;
  createdAt: string;
  updatedAt?: string;
  creator: { name: string };
  category: { name: string };
}

interface PopularLiteratureItem {
  id: string;
  title: string;
  author: string;
  category: string;
  rating: number;
  ratingCount: number;
  saveCount: number;
  commentCount: number;
  popularityScore: number;
}

interface ActivityItem {
  id: string;
  actionType: string;
  description: string;
  target: string;
  actor: string;
  timestamp: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface LiteratureItem {
  id: string;
  title: string;
  subheading?: string;
  brief: string;
  language: string;
  genre?: string;
  subject?: string;
  coverImage?: string;
  publicationStatus: 'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED';
  publicationDate?: string;
  createdAt: string;
  creator: Creator;
  category: Category;
  tags: string[];
}

interface AdminEditorialViewProps {
  user: any;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onNavigateAdminSignIn?: () => void;
  onViewLiterature?: (id: string) => void;
}

export const AdminEditorialView: React.FC<AdminEditorialViewProps> = ({
  user,
  onOpenAuth,
  onNavigateAdminSignIn,
  onViewLiterature,
}) => {
  // Navigation tabs: 'create' | 'manage' | 'analytics'
  const [activeTab, setActiveTab] = useState<'create' | 'manage' | 'analytics'>('analytics');

  // Executive KPI Dashboard State (LIT-16)
  const [kpiData, setKpiData] = useState<KpiData | null>(null);
  const [recentComments, setRecentComments] = useState<SecondaryComment[]>([]);
  const [recentLiterature, setRecentLiterature] = useState<SecondaryLiterature[]>([]);
  const [popularLiterature, setPopularLiterature] = useState<PopularLiteratureItem[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [kpiLoading, setKpiLoading] = useState(false);
  const [lastRefreshedTime, setLastRefreshedTime] = useState<string>('');

  // Quick Action Modal States
  const [quickActionModal, setQuickActionModal] = useState<'users' | 'categories' | 'settings' | null>(null);


  // Form State
  const [title, setTitle] = useState('');
  const [subheading, setSubheading] = useState('');
  const [brief, setBrief] = useState('');
  const [content, setContent] = useState('');
  const [creatorId, setCreatorId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [language, setLanguage] = useState('English');
  const [subject, setSubject] = useState('');
  const [genre, setGenre] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  // Local Cover Image State
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quick Creator Modal State
  const [quickCreatorOpen, setQuickCreatorOpen] = useState(false);
  const [newCreatorName, setNewCreatorName] = useState('');
  const [newCreatorRole, setNewCreatorRole] = useState('AUTHOR');
  const [newCreatorBio, setNewCreatorBio] = useState('');

  // Data lists
  const [creators, setCreators] = useState<Creator[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allWorks, setAllWorks] = useState<LiteratureItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED'>('ALL');

  // Feedback State
  const [loading, setLoading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Check role guard
  const isAdmin = user && user.role === 'ADMIN';

  // Load creators, categories, and literature list
  const fetchMetadata = async () => {
    if (!isAdmin) return;
    const token = localStorage.getItem('literature_token');
    try {
      const [creatorRes, catRes] = await Promise.all([
        fetch('/api/admin/creators', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/admin/categories', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (creatorRes.ok) {
        const data = await creatorRes.json();
        setCreators(data.creators || []);
        if (data.creators?.length > 0 && !creatorId) {
          setCreatorId(data.creators[0].id);
        }
      }

      if (catRes.ok) {
        const data = await catRes.json();
        setCategories(data.categories || []);
        if (data.categories?.length > 0 && !categoryId) {
          setCategoryId(data.categories[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load editorial metadata:', err);
    }
  };

  const fetchArchivalWorks = async () => {
    if (!isAdmin) return;
    const token = localStorage.getItem('literature_token');
    try {
      const res = await fetch('/api/admin/literature', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAllWorks(data.literatures || []);
      }
    } catch (err) {
      console.error('Failed to load archival works:', err);
    }
  };

  const fetchDashboardKpis = async () => {
    if (!isAdmin) return;
    setKpiLoading(true);
    const token = localStorage.getItem('literature_token');
    try {
      const res = await fetch('/api/admin/dashboard/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setKpiData(data.kpis || data);
        setRecentComments(data.recentComments || []);
        setRecentLiterature(data.recentLiterature || []);
        setPopularLiterature(data.popularLiterature || []);
        setRecentActivity(data.recentActivity || []);
        setLastRefreshedTime(new Date().toLocaleTimeString());
      } else {
        throw new Error('Failed to retrieve dashboard metrics.');
      }
    } catch (err) {
      console.error('Failed to fetch dashboard KPIs:', err);
      setAlertMsg({ type: 'error', text: 'Failed to retrieve real-time dashboard metrics.' });
    } finally {
      setKpiLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchMetadata();
      fetchArchivalWorks();
      fetchDashboardKpis();
    }
  }, [isAdmin]);

  // Handle local cover file selection with format and size checks
  const handleFileChange = (file: File | null) => {
    if (!file) return;

    // Validate mime type: JPEG, PNG, WebP
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setAlertMsg({
        type: 'error',
        text: 'Unsupported cover format. Only JPEG, PNG, and WebP images are permitted.',
      });
      return;
    }

    // Validate size limit: 5MB
    if (file.size > 5 * 1024 * 1024) {
      setAlertMsg({
        type: 'error',
        text: 'Cover image file size exceeds the 5MB maximum limit.',
      });
      return;
    }

    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    setAlertMsg(null);
  };

  const removeCoverImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCoverFile(null);
    if (coverPreview) {
      URL.revokeObjectURL(coverPreview);
      setCoverPreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Upload cover to backend /api/admin/upload-cover
  const uploadCoverToServer = async (): Promise<string | null> => {
    if (!coverFile) return null;
    setUploadingCover(true);
    const token = localStorage.getItem('literature_token');
    const formData = new FormData();
    formData.append('coverImage', coverFile);

    try {
      const res = await fetch('/api/admin/upload-cover', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload cover image.');
      }
      return data.coverUrl;
    } finally {
      setUploadingCover(false);
    }
  };

  // Calculate Page Count Helper
  const calculateContentPages = (text: string): number => {
    if (!text || !text.trim()) return 0;
    const trimmed = text.trim();
    if (trimmed.includes('---page---') || trimmed.includes('<!-- pagebreak -->') || trimmed.includes('\f')) {
      const segments = trimmed.split(/---page---|<!-- pagebreak -->|\f/g).filter((s) => s.trim().length > 0);
      return Math.max(1, segments.length);
    }
    const words = trimmed.split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 250));
  };

  const currentContentPages = calculateContentPages(content);

  // Submit Literature (Draft or Published)
  const handleSubmitLiterature = async (targetStatus: 'DRAFT' | 'PUBLISHED') => {
    if (!title.trim() || !brief.trim() || !content.trim()) {
      setAlertMsg({
        type: 'error',
        text: 'Please provide a Title, Brief Description, and Content before submitting.',
      });
      return;
    }

    if (!creatorId) {
      setAlertMsg({ type: 'error', text: 'Please select or create an author/creator.' });
      return;
    }

    if (!categoryId) {
      setAlertMsg({ type: 'error', text: 'Please select a literature category.' });
      return;
    }

    // Publication Requirements Check:
    // 1. Cover Page required before publishing
    // 2. Minimum > 13 pages content required before publishing
    if (targetStatus === 'PUBLISHED') {
      if (!coverFile && !coverPreview) {
        setAlertMsg({
          type: 'error',
          text: 'A dedicated Cover Page is required before literature can be published. Please upload a cover image.',
        });
        return;
      }

      if (currentContentPages <= 13) {
        setAlertMsg({
          type: 'error',
          text: `Literature content must contain more than 13 pages to be published (currently contains ${currentContentPages} pages). Please expand the manuscript content.`,
        });
        return;
      }
    }

    setLoading(true);
    setAlertMsg(null);
    const token = localStorage.getItem('literature_token');

    try {
      let finalCoverUrl: string | null = null;
      if (coverFile) {
        finalCoverUrl = await uploadCoverToServer();
      }

      // Parse tags
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const payload = {
        title: title.trim(),
        subheading: subheading.trim() || undefined,
        brief: brief.trim(),
        content: content.trim(),
        creatorId,
        categoryId,
        language: language.trim() || 'English',
        subject: subject.trim() || undefined,
        genre: genre.trim() || undefined,
        coverImage: finalCoverUrl || undefined,
        publicationStatus: targetStatus,
        tags,
      };

      const res = await fetch('/api/admin/literature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit literature manuscript.');
      }

      setAlertMsg({
        type: 'success',
        text: `Manuscript "${data.literature.title}" saved successfully as ${targetStatus}!`,
      });

      // Reset form
      setTitle('');
      setSubheading('');
      setBrief('');
      setContent('');
      setSubject('');
      setGenre('');
      setTagsInput('');
      removeCoverImage();

      // Refresh list
      fetchArchivalWorks();
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message || 'An error occurred during submission.' });
    } finally {
      setLoading(false);
    }
  };

  // Quick Creator Registration
  const handleCreateQuickCreator = async () => {
    if (!newCreatorName.trim()) return;
    const token = localStorage.getItem('literature_token');
    try {
      const res = await fetch('/api/admin/creators', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newCreatorName.trim(),
          bio: newCreatorBio.trim() || undefined,
          roleType: newCreatorRole,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setCreators((prev) => [...prev, data.creator]);
        setCreatorId(data.creator.id);
        setNewCreatorName('');
        setNewCreatorBio('');
        setQuickCreatorOpen(false);
        setAlertMsg({ type: 'success', text: `Creator "${data.creator.name}" added to Athenæum.` });
      } else {
        setAlertMsg({ type: 'error', text: data.error || 'Failed to add creator.' });
      }
    } catch (err) {
      setAlertMsg({ type: 'error', text: 'Error adding creator.' });
    }
  };

  // Lifecycle Transitions: Publish, Unpublish, Delete
  const handleUpdateStatus = async (id: string, newStatus: 'PUBLISHED' | 'UNPUBLISHED' | 'DRAFT') => {
    const token = localStorage.getItem('literature_token');
    try {
      const res = await fetch(`/api/admin/literature/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ publicationStatus: newStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        setAlertMsg({
          type: 'success',
          text: `Literature status successfully transitioned to ${newStatus}.`,
        });
        fetchArchivalWorks();
      } else {
        setAlertMsg({ type: 'error', text: data.error || 'Failed to update status.' });
      }
    } catch (err) {
      setAlertMsg({ type: 'error', text: 'Error updating publication status.' });
    }
  };

  const handleDeleteLiterature = async (id: string, titleStr: string) => {
    if (!window.confirm(`Are you certain you wish to purge "${titleStr}" from the Athenæum archives?`)) {
      return;
    }
    const token = localStorage.getItem('literature_token');
    try {
      const res = await fetch(`/api/admin/literature/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setAlertMsg({ type: 'success', text: `Manuscript "${titleStr}" purged from archives.` });
        fetchArchivalWorks();
      } else {
        setAlertMsg({ type: 'error', text: 'Failed to delete literature.' });
      }
    } catch (err) {
      setAlertMsg({ type: 'error', text: 'Error deleting literature.' });
    }
  };

  // RBAC Access Guard
  if (!isAdmin) {
    return (
      <div className="editorial-container">
        <div className="admin-guard-card" id="admin-unauthorized-guard">
          <div className="admin-guard-icon">
            <ShieldAlert size={36} />
          </div>
          <h2 className="serif-title" style={{ fontSize: '1.85rem', marginBottom: '0.75rem', color: 'var(--accent-burgundy)' }}>
            Curator Access Restricted
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
            The Athenæum Editorial Studio is reserved strictly for authenticated Curators and Archival Administrators.
          </p>
          <button
            className="btn-publish"
            style={{ margin: '0 auto' }}
            onClick={() => {
              if (onNavigateAdminSignIn) {
                onNavigateAdminSignIn();
              } else {
                onOpenAuth('login');
              }
            }}
            id="btn-admin-login-guard"
          >
            Authenticate as Administrator
          </button>
        </div>
      </div>
    );
  }

  // Filtered works for table
  const filteredWorks = allWorks.filter((w) => {
    if (statusFilter === 'ALL') return true;
    return w.publicationStatus === statusFilter;
  });

  return (
    <div className="editorial-container" id="admin-editorial-view">
      {/* Top Header */}
      <div className="editorial-header">
        <div className="editorial-header-title">
          <div className="editorial-header-icon">
            <Feather size={22} />
          </div>
          <div>
            <h1 className="serif-title editorial-title" id="editorial-studio-heading">
              Curatorial Editorial Studio
            </h1>
            <p className="editorial-subtitle">
              Compose, archive as Draft, upload cover typography, and manage publication states.
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="editorial-nav-tabs">
          <button
            className={`editorial-tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('analytics');
              fetchDashboardKpis();
            }}
            id="tab-btn-executive-analytics"
          >
            <BarChart3 size={16} />
            Live Dashboard
          </button>
          <button
            className={`editorial-tab-btn ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
            id="tab-btn-create-manuscript"
          >
            <Feather size={16} />
            Create Manuscript
          </button>
          <button
            className={`editorial-tab-btn ${activeTab === 'manage' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('manage');
              fetchArchivalWorks();
            }}
            id="tab-btn-manage-works"
          >
            <Layers size={16} />
            Archival Registry
            <span className="badge-count" id="registry-count-badge">
              {allWorks.length}
            </span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {alertMsg && (
        <div
          className={`editorial-alert ${alertMsg.type}`}
          id={`editorial-alert-${alertMsg.type}`}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {alertMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{alertMsg.text}</span>
          </div>
          <button
            className="editorial-alert-close"
            onClick={() => setAlertMsg(null)}
            aria-label="Dismiss message"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* VIEW 0: EXECUTIVE KPI DASHBOARD & SECONDARY ANALYTICS (LIT-10) */}
      {activeTab === 'analytics' && (
        <div id="executive-kpi-dashboard-view">
          {/* Header Bar with Live Refresh */}
          <div className="kpi-dashboard-header">
            <div>
              <h2 className="serif-title" style={{ fontSize: '1.45rem', color: 'var(--accent-burgundy)' }}>
                Athenæum Sanctuary Metrics & Executive KPIs
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Live database telemetry {lastRefreshedTime ? `• Last synchronized at ${lastRefreshedTime}` : ''}
              </p>
            </div>
            <button
              className={`kpi-refresh-btn ${kpiLoading ? 'spinning' : ''}`}
              onClick={fetchDashboardKpis}
              disabled={kpiLoading}
              id="btn-refresh-kpis"
            >
              <RefreshCw size={15} className="refresh-icon" />
              {kpiLoading ? 'Synchronizing...' : 'Refresh Metrics'}
            </button>
          </div>

          {/* QUICK ACTIONS BAR */}
          <div className="admin-quick-actions-bar" id="admin-quick-actions">
            <span className="quick-actions-title">
              <ShieldCheck size={18} /> Quick Actions:
            </span>
            <div className="quick-actions-buttons">
              <button
                className="btn-quick-action"
                id="btn-qa-add-literature"
                onClick={() => setActiveTab('create')}
              >
                <Plus size={15} /> Add Literature
              </button>
              <button
                className="btn-quick-action"
                id="btn-qa-manage-literature"
                onClick={() => {
                  setActiveTab('manage');
                  fetchArchivalWorks();
                }}
              >
                <FolderKanban size={15} /> Manage Literature
              </button>
              <button
                className="btn-quick-action"
                id="btn-qa-manage-categories"
                onClick={() => setQuickActionModal('categories')}
              >
                <Tag size={15} /> Manage Categories
              </button>
              <button
                className="btn-quick-action"
                id="btn-qa-manage-users"
                onClick={() => setQuickActionModal('users')}
              >
                <Users size={15} /> Manage Users
              </button>
              <button
                className="btn-quick-action"
                id="btn-qa-manage-comments"
                onClick={() => {
                  const commentsPanel = document.getElementById('panel-recent-comments');
                  if (commentsPanel) commentsPanel.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <MessageCircle size={15} /> Manage Comments
              </button>
              <button
                className="btn-quick-action"
                id="btn-qa-settings"
                onClick={() => setQuickActionModal('settings')}
              >
                <Settings size={15} /> Application Settings
              </button>
            </div>
          </div>

          {/* 11 LIVE KPI CARDS (RESPONSIVE 4 / 2 / 1) */}
          <div className="kpis-grid" id="kpi-cards-container">
            {/* 1. Total Literature */}
            <div className="kpi-card" id="kpi-total-literature" data-testid="kpi-card-total-literature">
              <div className="kpi-card-top">
                <span className="kpi-card-label">Total Literature</span>
                <div className="kpi-card-icon-wrap burgundy">
                  <BookOpen size={18} />
                </div>
              </div>
              <div className="kpi-card-value" id="kpi-val-total-literature">
                {kpiData ? kpiData.totalLiterature : '0'}
              </div>
              <div className="kpi-card-subtext">
                <span>All cataloged manuscripts</span>
              </div>
            </div>

            {/* 2. Published Literature */}
            <div className="kpi-card" id="kpi-published-literature" data-testid="kpi-card-published-literature">
              <div className="kpi-card-top">
                <span className="kpi-card-label">Published Works</span>
                <div className="kpi-card-icon-wrap green">
                  <CheckCircle2 size={18} />
                </div>
              </div>
              <div className="kpi-card-value" id="kpi-val-published-literature">
                {kpiData ? kpiData.publishedLiterature : '0'}
              </div>
              <div className="kpi-card-subtext">
                <span>Live in public catalog</span>
              </div>
            </div>

            {/* 3. Draft Literature */}
            <div className="kpi-card" id="kpi-draft-literature" data-testid="kpi-card-draft-literature">
              <div className="kpi-card-top">
                <span className="kpi-card-label">Draft Literature</span>
                <div className="kpi-card-icon-wrap amber">
                  <Feather size={18} />
                </div>
              </div>
              <div className="kpi-card-value" id="kpi-val-draft-literature">
                {kpiData ? kpiData.draftLiterature : '0'}
              </div>
              <div className="kpi-card-subtext">
                <span>Curatorial work in progress</span>
              </div>
            </div>

            {/* 4. Unpublished Literature */}
            <div className="kpi-card" id="kpi-unpublished-literature" data-testid="kpi-card-unpublished-literature">
              <div className="kpi-card-top">
                <span className="kpi-card-label">Unpublished Literature</span>
                <div className="kpi-card-icon-wrap purple">
                  <Archive size={18} />
                </div>
              </div>
              <div className="kpi-card-value" id="kpi-val-unpublished-literature">
                {kpiData ? kpiData.unpublishedLiterature : '0'}
              </div>
              <div className="kpi-card-subtext">
                <span>Withdrawn or decommissioned</span>
              </div>
            </div>

            {/* 5. Registered Readers (Strictly Excluding Admins) */}
            <div className="kpi-card" id="kpi-registered-readers" data-testid="kpi-card-registered-readers">
              <div className="kpi-card-top">
                <span className="kpi-card-label">Registered Readers</span>
                <div className="kpi-card-icon-wrap blue">
                  <Users size={18} />
                </div>
              </div>
              <div className="kpi-card-value" id="kpi-val-registered-readers">
                {kpiData ? kpiData.registeredReaders : '0'}
              </div>
              <div className="kpi-card-subtext">
                <span>Active scholar accounts (excl. Admins)</span>
              </div>
            </div>

            {/* 6. Total Ratings */}
            <div className="kpi-card" id="kpi-total-ratings" data-testid="kpi-card-total-ratings">
              <div className="kpi-card-top">
                <span className="kpi-card-label">Total Ratings</span>
                <div className="kpi-card-icon-wrap gold">
                  <Star size={18} />
                </div>
              </div>
              <div className="kpi-card-value" id="kpi-val-total-ratings">
                {kpiData ? kpiData.totalRatings : '0'}
              </div>
              <div className="kpi-card-subtext">
                <span>Scholar ratings recorded</span>
              </div>
            </div>

            {/* 7. Average Rating */}
            <div className="kpi-card" id="kpi-average-rating" data-testid="kpi-card-average-rating">
              <div className="kpi-card-top">
                <span className="kpi-card-label">Average Rating</span>
                <div className="kpi-card-icon-wrap gold">
                  <TrendingUp size={18} />
                </div>
              </div>
              <div className="kpi-card-value" id="kpi-val-average-rating">
                {kpiData && !isNaN(kpiData.averageRating) ? kpiData.averageRating.toFixed(1) : '0.0'}
              </div>
              <div className="kpi-card-subtext">
                <span>Scale 1.0 to 5.0 stars</span>
              </div>
            </div>

            {/* 8. Total Comments */}
            <div className="kpi-card" id="kpi-total-comments" data-testid="kpi-card-total-comments">
              <div className="kpi-card-top">
                <span className="kpi-card-label">Total Comments</span>
                <div className="kpi-card-icon-wrap purple">
                  <MessageSquare size={18} />
                </div>
              </div>
              <div className="kpi-card-value" id="kpi-val-total-comments">
                {kpiData ? kpiData.totalComments : '0'}
              </div>
              <div className="kpi-card-subtext">
                <span>Discussions and threaded replies</span>
              </div>
            </div>

            {/* 9. Total Saves */}
            <div className="kpi-card" id="kpi-total-saves" data-testid="kpi-card-total-saves">
              <div className="kpi-card-top">
                <span className="kpi-card-label">Total Saves</span>
                <div className="kpi-card-icon-wrap burgundy">
                  <BookmarkCheck size={18} />
                </div>
              </div>
              <div className="kpi-card-value" id="kpi-val-total-saves">
                {kpiData ? kpiData.totalSaves : '0'}
              </div>
              <div className="kpi-card-subtext">
                <span>Sanctuary bookmarked works</span>
              </div>
            </div>

            {/* 10. New Users This Month */}
            <div className="kpi-card" id="kpi-new-users" data-testid="kpi-card-new-users">
              <div className="kpi-card-top">
                <span className="kpi-card-label">New Users This Month</span>
                <div className="kpi-card-icon-wrap blue">
                  <Users size={18} />
                </div>
              </div>
              <div className="kpi-card-value" id="kpi-val-new-users">
                {kpiData && kpiData.newUsersThisMonth !== undefined ? kpiData.newUsersThisMonth : '0'}
              </div>
              <div className="kpi-card-subtext">
                <span>Enrolled this calendar cycle</span>
              </div>
            </div>

            {/* 11. New Releases This Month */}
            <div className="kpi-card" id="kpi-new-releases" data-testid="kpi-card-new-releases">
              <div className="kpi-card-top">
                <span className="kpi-card-label">New Releases This Month</span>
                <div className="kpi-card-icon-wrap green">
                  <CheckCircle2 size={18} />
                </div>
              </div>
              <div className="kpi-card-value" id="kpi-val-new-releases">
                {kpiData && kpiData.newReleasesThisMonth !== undefined ? kpiData.newReleasesThisMonth : '0'}
              </div>
              <div className="kpi-card-subtext">
                <span>Preserved manuscripts this month</span>
              </div>
            </div>
          </div>

          {/* DASHBOARD SECTIONS GRID (RECENT, POPULAR, COMMENTS, ACTIVITY) */}
          <div className="secondary-analytics-grid" id="secondary-analytics-container">
            {/* SECTION 1: RECENT LITERATURE */}
            <div className="analytics-panel" id="panel-recent-literature">
              <div className="analytics-panel-header">
                <h3 className="serif-title analytics-panel-title">
                  <BookOpen size={18} />
                  Recent Literature
                </h3>
                <span className="tag-badge gold" style={{ fontSize: '0.75rem' }}>Registry</span>
              </div>
              <div className="recent-item-list" id="recent-literature-list">
                {recentLiterature.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic', padding: '1rem 0' }}>
                    No literature recorded in the archive yet.
                  </p>
                ) : (
                  recentLiterature.map((lit) => (
                    <div key={lit.id} className="recent-literature-item" data-testid={`recent-lit-${lit.id}`}>
                      <div className="recent-literature-info">
                        <span className="recent-literature-title">{lit.title}</span>
                        <span className="recent-literature-author">
                          By {lit.creator?.name} • {lit.language || 'English'} • {lit.category?.name}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          Updated: {new Date(lit.updatedAt || lit.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <span className={`status-badge ${lit.publicationStatus.toLowerCase()}`}>
                        {lit.publicationStatus}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* SECTION 2: POPULAR LITERATURE */}
            <div className="analytics-panel" id="panel-popular-literature">
              <div className="analytics-panel-header">
                <h3 className="serif-title analytics-panel-title">
                  <Flame size={18} />
                  Popular Literature
                </h3>
                <span className="tag-badge burgundy" style={{ fontSize: '0.75rem' }}>Top Curated</span>
              </div>
              <div className="recent-item-list" id="popular-literature-list">
                {popularLiterature.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic', padding: '1rem 0' }}>
                    No popularity metrics available yet.
                  </p>
                ) : (
                  popularLiterature.map((pop) => (
                    <div key={pop.id} className="recent-literature-item" data-testid={`popular-lit-${pop.id}`}>
                      <div className="recent-literature-info">
                        <span className="recent-literature-title">{pop.title}</span>
                        <span className="recent-literature-author">
                          By {pop.author} • {pop.category}
                        </span>
                        <div style={{ display: 'flex', gap: '0.85rem', marginTop: '0.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          <span>⭐ <strong>{pop.rating.toFixed(1)}</strong> ({pop.ratingCount} ratings)</span>
                          <span>🔖 <strong>{pop.saveCount}</strong> saves</span>
                        </div>
                      </div>
                      <span className="tag-badge gold" style={{ fontSize: '0.75rem' }}>
                        Score: {pop.popularityScore}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* SECTION 3: RECENT COMMENTS & MODERATION */}
            <div className="analytics-panel" id="panel-recent-comments">
              <div className="analytics-panel-header">
                <h3 className="serif-title analytics-panel-title">
                  <MessageSquare size={18} />
                  Recent Comments
                </h3>
                <span className="tag-badge burgundy" style={{ fontSize: '0.75rem' }}>Discussion</span>
              </div>
              <div className="recent-item-list" id="recent-comments-list">
                {recentComments.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic', padding: '1rem 0' }}>
                    No comments recorded in the sanctuary yet.
                  </p>
                ) : (
                  recentComments.map((c) => (
                    <div key={c.id} className="recent-comment-item" data-testid={`recent-comment-${c.id}`}>
                      <div className="recent-comment-meta">
                        <span className="recent-comment-author">
                          {c.readerName || c.user?.name}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="status-badge published" style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem' }}>
                            {c.moderationStatus || 'APPROVED'}
                          </span>
                          <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--accent-burgundy)', marginBottom: '0.35rem', fontWeight: 600 }}>
                        On: {c.literatureTitle || c.literature?.title}
                      </div>
                      <p className="recent-comment-text">"{c.content}"</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* SECTION 4: RECENT ACTIVITY (AUDIT TRAIL) */}
            <div className="analytics-panel" id="panel-recent-activity">
              <div className="analytics-panel-header">
                <h3 className="serif-title analytics-panel-title">
                  <Activity size={18} />
                  Recent Activity
                </h3>
                <span className="tag-badge gold" style={{ fontSize: '0.75rem' }}>Audit Log</span>
              </div>
              <div className="recent-item-list" id="recent-activity-list">
                {recentActivity.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic', padding: '1rem 0' }}>
                    No system activity recorded yet.
                  </p>
                ) : (
                  recentActivity.map((act) => (
                    <div key={act.id} className="activity-audit-item" data-testid={`activity-${act.id}`}>
                      <div className="activity-icon-badge">
                        {act.actionType.includes('LITERATURE') ? (
                          <BookOpen size={14} />
                        ) : act.actionType.includes('USER') ? (
                          <Users size={14} />
                        ) : (
                          <MessageSquare size={14} />
                        )}
                      </div>
                      <div className="activity-info">
                        <span className="activity-desc">{act.description}</span>
                        <div className="activity-meta">
                          <span>By {act.actor}</span> • <span>{new Date(act.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Quick Action Interactive Modals */}
          {quickActionModal && (
            <div className="modal-overlay" onClick={() => setQuickActionModal(null)}>
              <div className="modal-plate" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <div className="modal-title-group">
                    <span className="serif-title modal-title">
                      {quickActionModal === 'categories' && 'Manage Curatorial Categories'}
                      {quickActionModal === 'users' && 'Manage Athenæum Scholars'}
                      {quickActionModal === 'settings' && 'Athenæum Application Settings'}
                    </span>
                    <span className="modal-subtitle">
                      {quickActionModal === 'categories' && 'Review and organize literature categories.'}
                      {quickActionModal === 'users' && 'View registered readers and roles.'}
                      {quickActionModal === 'settings' && 'Configure sanctuary registry settings.'}
                    </span>
                  </div>
                  <button className="btn-close" onClick={() => setQuickActionModal(null)}>
                    <X size={20} />
                  </button>
                </div>

                <div style={{ padding: '1rem 0' }}>
                  {quickActionModal === 'categories' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {categories.map((cat) => (
                        <div key={cat.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem 1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                          <span style={{ fontWeight: 600 }}>{cat.name}</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/{cat.slug}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {quickActionModal === 'users' && (
                    <div>
                      <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                        Current Readers enrolled in sanctuary: <strong>{kpiData?.registeredReaders || 0}</strong>
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between' }}>
                          <span>Julian Croft (julian@literature.org)</span>
                          <span className="tag-badge burgundy">READER</span>
                        </div>
                        <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between' }}>
                          <span>Clara Oswald (clara@literature.org)</span>
                          <span className="tag-badge burgundy">READER</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {quickActionModal === 'settings' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                          Repository Name
                        </label>
                        <input className="form-input" defaultValue="Athenæum Classic Literature Repository" readOnly />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                          Admin Invitation Security Status
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#166534', fontWeight: 600, fontSize: '0.88rem' }}>
                          <ShieldCheck size={18} /> Cryptographic Server Validation & Rate Limiting Active
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                  <button className="btn btn-secondary" onClick={() => setQuickActionModal(null)}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 1: CREATE MANUSCRIPT FORM */}
      {activeTab === 'create' && (
        <div className="editorial-form-card" id="form-create-manuscript">
          <div className="form-grid-two-col">
            {/* Left Column: Text & Content Inputs */}
            <div>
              <div className="form-group">
                <label className="form-label" htmlFor="lit-title">
                  Manuscript Title <span style={{ color: 'var(--accent-burgundy)' }}>*</span>
                </label>
                <input
                  id="lit-title"
                  className="form-input"
                  type="text"
                  placeholder="e.g., The Divine Comedy"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="lit-subheading">
                  Subheading / Classical Translation Title <span className="form-label-optional">(Optional)</span>
                </label>
                <input
                  id="lit-subheading"
                  className="form-input"
                  type="text"
                  placeholder="e.g., Inferno, Purgatorio, and Paradiso"
                  value={subheading}
                  onChange={(e) => setSubheading(e.target.value)}
                />
              </div>

              <div className="form-group-inline">
                <div className="form-group">
                  <label className="form-label" htmlFor="lit-creator">
                    Author / Creator <span style={{ color: 'var(--accent-burgundy)' }}>*</span>
                  </label>
                  <div className="creator-quick-bar">
                    <select
                      id="lit-creator"
                      className="form-select"
                      value={creatorId}
                      onChange={(e) => setCreatorId(e.target.value)}
                    >
                      {creators.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.roleType})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn-quick-creator"
                      onClick={() => setQuickCreatorOpen(!quickCreatorOpen)}
                      title="Register New Creator"
                      id="btn-quick-creator"
                    >
                      <Plus size={14} /> New
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="lit-category">
                    Archival Category <span style={{ color: 'var(--accent-burgundy)' }}>*</span>
                  </label>
                  <select
                    id="lit-category"
                    className="form-select"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick Creator Inline Expansion */}
              {quickCreatorOpen && (
                <div
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--accent-gold)',
                    marginBottom: '1.5rem',
                  }}
                  id="quick-creator-box"
                >
                  <h4 style={{ fontSize: '0.95rem', color: 'var(--accent-burgundy)', marginBottom: '0.75rem' }}>
                    Quick-Register Classical Creator
                  </h4>
                  <div className="form-group-inline" style={{ marginBottom: '0.75rem' }}>
                    <input
                      id="input-quick-creator-name"
                      className="form-input"
                      type="text"
                      placeholder="Creator Full Name"
                      value={newCreatorName}
                      onChange={(e) => setNewCreatorName(e.target.value)}
                    />
                    <select
                      id="select-quick-creator-role"
                      className="form-select"
                      value={newCreatorRole}
                      onChange={(e) => setNewCreatorRole(e.target.value)}
                    >
                      <option value="AUTHOR">Author</option>
                      <option value="PLAYWRIGHT">Playwright</option>
                      <option value="BOTH">Both</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className="btn-draft"
                      style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}
                      onClick={() => setQuickCreatorOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn-publish"
                      style={{ padding: '0.4rem 1.1rem', fontSize: '0.85rem' }}
                      onClick={handleCreateQuickCreator}
                      id="btn-submit-quick-creator"
                    >
                      Register Author
                    </button>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="lit-brief">
                  Brief Philosophical Abstract <span style={{ color: 'var(--accent-burgundy)' }}>*</span>
                </label>
                <textarea
                  id="lit-brief"
                  className="form-textarea"
                  style={{ minHeight: '85px' }}
                  placeholder="Concise contextual summary, themes, and intellectual lineage..."
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label className="form-label" htmlFor="lit-content" style={{ margin: 0 }}>
                    Manuscript Canonical Text <span style={{ color: 'var(--accent-burgundy)' }}>*</span>
                  </label>
                  <span
                    className={`tag-badge ${currentContentPages > 13 ? 'green' : 'burgundy'}`}
                    id="badge-content-page-count"
                    title={currentContentPages > 13 ? 'Content meets >13 pages publication requirement' : 'More than 13 pages required to publish'}
                  >
                    📄 {currentContentPages} {currentContentPages === 1 ? 'Page' : 'Pages'} (Requirement: &gt;13 Pages)
                  </span>
                </div>
                <textarea
                  id="lit-content"
                  className="form-textarea"
                  style={{ minHeight: '180px' }}
                  placeholder="Enter canonical text, chapters, cantos, or verses. Delimit pages using '---page---' or standard ~250 words per page..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                />
                <p style={{ fontSize: '0.8rem', color: currentContentPages > 13 ? '#166534' : 'var(--accent-burgundy)', marginTop: '0.35rem', fontWeight: 500 }} id="content-page-requirement-hint">
                  {currentContentPages > 13
                    ? `✓ Minimum page requirement met (${currentContentPages} pages). Ready for publication review.`
                    : `⚠️ Publication requirement: Literature must contain more than 13 pages (currently ${currentContentPages} ${currentContentPages === 1 ? 'page' : 'pages'}). Save as Draft is permitted at any length.`}
                </p>
              </div>

              <div className="form-group-inline">
                <div className="form-group">
                  <label className="form-label" htmlFor="lit-language">
                    Primary Language <span style={{ color: 'var(--accent-burgundy)' }}>*</span>
                  </label>
                  <select
                    id="lit-language"
                    className="form-select"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi (हिंदी साहित्य)</option>
                    <option value="Kannada">Kannada (ಕನ್ನಡ ಸಾಹಿತ್ಯ)</option>
                    <option value="Sanskrit">Sanskrit (संस्कृतम्)</option>
                    <option value="Tamil">Tamil (தமிழ்)</option>
                    <option value="Bengali">Bengali (বাংলা)</option>
                    <option value="Ancient Greek">Ancient Greek</option>
                    <option value="Latin">Latin</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="lit-genre">
                    Genre / Tradition
                  </label>
                  <input
                    id="lit-genre"
                    className="form-input"
                    type="text"
                    placeholder="e.g., Epic Poetry, Tragedy, Dialogue"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group-inline">
                <div className="form-group">
                  <label className="form-label" htmlFor="lit-subject">
                    Subject Matter
                  </label>
                  <input
                    id="lit-subject"
                    className="form-input"
                    type="text"
                    placeholder="e.g., Ethics, Metaphysics, Mortality"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="lit-tags">
                    Archival Tags <span className="form-label-optional">(Comma separated)</span>
                  </label>
                  <input
                    id="lit-tags"
                    className="form-input"
                    type="text"
                    placeholder="e.g., Renaissance, Italian, Classical"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Local Cover Upload & Preview */}
            <div>
              <label className="form-label">
                Manuscript Cover Art <span style={{ color: 'var(--accent-burgundy)' }}>* (Required to Publish)</span>
                <span className="form-label-optional">(JPEG, PNG, WebP ≤ 5MB)</span>
              </label>

              {coverPreview ? (
                <div className="cover-preview-wrapper" id="cover-preview-container">
                  <img src={coverPreview} alt="Cover Preview" className="cover-preview-img" />
                  <button
                    type="button"
                    className="cover-preview-remove"
                    onClick={() => removeCoverImage()}
                    title="Remove Cover Image"
                    id="btn-remove-cover"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div
                  className={`cover-upload-box ${isDragging ? 'drag-over' : ''}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      handleFileChange(e.dataTransfer.files[0]);
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  id="dropzone-cover-upload"
                >
                  <Upload size={32} className="cover-upload-icon" />
                  <p className="cover-upload-title">Select or Drag Cover Image</p>
                  <p className="cover-upload-hint">
                    PNG, JPEG, or WebP up to 5MB. Stored locally in <code>/uploads</code>.
                  </p>
                </div>
              )}

              <input
                ref={fileInputRef}
                id="file-input-cover"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />

              {coverFile && (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem', textAlign: 'center' }}>
                  Selected: {coverFile.name} ({(coverFile.size / 1024).toFixed(1)} KB)
                </p>
              )}

              <div
                style={{
                  marginTop: '2rem',
                  padding: '1.25rem',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-classic)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                  lineHeight: '1.5',
                }}
              >
                <p style={{ fontWeight: 600, color: 'var(--accent-burgundy)', marginBottom: '0.4rem' }}>
                  Editorial Standards
                </p>
                <p>
                  Saving as <strong>Draft</strong> keeps the work private to Curators. Transitioning to{' '}
                  <strong>Published</strong> immediately exposes the work to readers across the Athenæum catalog.
                </p>
              </div>
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="form-actions-bar">
            <button
              type="button"
              className="btn-draft"
              disabled={loading || uploadingCover}
              onClick={() => handleSubmitLiterature('DRAFT')}
              id="btn-save-draft"
            >
              <FileText size={16} />
              {loading ? 'Archiving...' : 'Save as Draft'}
            </button>
            <button
              type="button"
              className="btn-publish"
              disabled={loading || uploadingCover}
              onClick={() => handleSubmitLiterature('PUBLISHED')}
              id="btn-publish-now"
            >
              <Check size={16} />
              {loading ? 'Publishing...' : 'Publish Immediately'}
            </button>
          </div>
        </div>
      )}

      {/* VIEW 2: ARCHIVAL REGISTRY & LIFECYCLE MANAGEMENT */}
      {activeTab === 'manage' && (
        <div id="archival-registry-view">
          {/* Filter Pills */}
          <div className="curation-filters">
            <div className="filter-pills">
              {(['ALL', 'DRAFT', 'PUBLISHED', 'UNPUBLISHED'] as const).map((status) => (
                <button
                  key={status}
                  className={`filter-pill ${statusFilter === status ? 'active' : ''}`}
                  onClick={() => setStatusFilter(status)}
                  id={`filter-pill-${status.toLowerCase()}`}
                >
                  {status === 'ALL' ? 'All Works' : status}
                </button>
              ))}
            </div>

            <button
              className="btn-publish"
              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
              onClick={() => setActiveTab('create')}
              id="btn-new-manuscript-cta"
            >
              <Plus size={15} style={{ marginRight: '4px' }} />
              New Manuscript
            </button>
          </div>

          {/* Table Container */}
          <div className="works-table-container">
            {filteredWorks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
                <BookOpen size={40} style={{ margin: '0 auto 1rem', color: 'var(--accent-gold)' }} />
                <p className="serif-title" style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                  No Archival Manuscripts Found
                </p>
                <p style={{ fontSize: '0.9rem' }}>
                  No literature items correspond to the selected filter criteria.
                </p>
              </div>
            ) : (
              <table className="works-table" id="table-archival-works">
                <thead>
                  <tr>
                    <th>Manuscript & Author</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Lifecycle Transitions</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWorks.map((work) => {
                    const statusClass = work.publicationStatus.toLowerCase();
                    return (
                      <tr key={work.id} data-testid={`work-row-${work.id}`}>
                        <td>
                          <div className="work-cell-title">
                            {work.coverImage ? (
                              <img
                                src={
                                  work.coverImage.startsWith('http') || work.coverImage.startsWith('data:')
                                    ? work.coverImage
                                    : work.coverImage.startsWith('/uploads')
                                    ? `${work.coverImage}`
                                    : work.coverImage
                                }
                                alt={work.title}
                                className="work-mini-cover"
                                onError={(e) => {
                                  // Fallback to placeholder if failed to load
                                  (e.target as HTMLImageElement).src =
                                    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80';
                                }}
                              />
                            ) : (
                              <div className="work-mini-cover-placeholder">
                                <BookOpen size={18} />
                              </div>
                            )}
                            <div>
                              <div className="work-title-text">{work.title}</div>
                              <div className="work-author-text">{work.creator?.name || 'Unknown Author'}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="tag-badge gold" style={{ fontSize: '0.78rem' }}>
                            {work.category?.name}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${statusClass}`} data-testid={`status-badge-${work.id}`}>
                            {work.publicationStatus}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            {work.publicationStatus !== 'PUBLISHED' && (
                              <button
                                className="btn-action-pill publish"
                                onClick={() => handleUpdateStatus(work.id, 'PUBLISHED')}
                                title="Promote to Published"
                                data-testid={`btn-publish-${work.id}`}
                              >
                                Publish
                              </button>
                            )}

                            {work.publicationStatus === 'PUBLISHED' && (
                              <button
                                className="btn-action-pill unpublish"
                                onClick={() => handleUpdateStatus(work.id, 'UNPUBLISHED')}
                                title="Withdraw from Public Catalog"
                                data-testid={`btn-unpublish-${work.id}`}
                              >
                                Unpublish
                              </button>
                            )}

                            {work.publicationStatus === 'UNPUBLISHED' && (
                              <button
                                className="btn-action-pill"
                                onClick={() => handleUpdateStatus(work.id, 'DRAFT')}
                                title="Revert to Draft"
                                data-testid={`btn-revert-draft-${work.id}`}
                              >
                                <RotateCcw size={12} style={{ marginRight: '4px' }} />
                                Revert Draft
                              </button>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="action-buttons">
                            {onViewLiterature && (
                              <button
                                className="btn-action-icon"
                                onClick={() => onViewLiterature(work.id)}
                                title="Preview Reader View"
                              >
                                <Eye size={15} />
                              </button>
                            )}
                            <button
                              className="btn-action-icon danger"
                              onClick={() => handleDeleteLiterature(work.id, work.title)}
                              title="Purge Manuscript"
                              data-testid={`btn-delete-${work.id}`}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
