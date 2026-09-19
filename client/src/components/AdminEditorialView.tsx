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
  Palette,
  Sparkles,
  Edit,
} from 'lucide-react';
import type { ArtCraftItem } from './ArtCraftCard';
import { getApiUrl } from '../config/api';

import './AdminEditorialView.css';
import './ArtCraftView.css';


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
  totalArtCraft?: number;
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
  // Navigation tabs: 'create' | 'manage' | 'analytics' | 'artcraft'
  const [activeTab, setActiveTab] = useState<'create' | 'manage' | 'analytics' | 'artcraft'>('analytics');

  // Art & Craft Management State
  const [adminCrafts, setAdminCrafts] = useState<ArtCraftItem[]>([]);
  const [editingCraftId, setEditingCraftId] = useState<string | null>(null);
  const [craftForm, setCraftForm] = useState({
    name: '',
    localName: '',
    state: 'Karnataka',
    region: '',
    district: '',
    place: '',
    type: 'Woodcraft & Lacquerware',
    originPeriod: '',
    history: '',
    culturalSignificance: '',
    culturalBackground: '',
    materials: '',
    makingProcess: '',
    traditionalProducts: '',
    modernContext: '',
    coverImage: '',
    status: 'PUBLISHED',
  });

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

  // Admin AI Assistant States
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiDraftModalOpen, setAiDraftModalOpen] = useState<boolean>(false);
  const [aiMetadataProposal, setAiMetadataProposal] = useState<{
    brief?: string;
    subject?: string;
    genre?: string;
    tags?: string[];
  } | null>(null);

  const [aiCraftLoading, setAiCraftLoading] = useState<boolean>(false);
  const [aiCraftProposal, setAiCraftProposal] = useState<any | null>(null);
  const [aiCraftModalOpen, setAiCraftModalOpen] = useState<boolean>(false);

  // Trigger AI Metadata / Brief generation for manuscript
  const handleAiGenerateMetadata = async (mode: 'brief' | 'tags' | 'all') => {
    if (!title.trim() && !content.trim()) {
      setAlertMsg({
        type: 'error',
        text: 'Please provide either a Manuscript Title or Content before consulting the AI Assistant.',
      });
      return;
    }

    const token = localStorage.getItem('literature_token');
    try {
      setAiLoading(true);
      const endpoint = mode === 'brief' ? '/api/ai/generate-brief' : '/api/ai/generate-tags';
      const res = await fetch(getApiUrl(endpoint), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, content: (content || '').slice(0, 10000) }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'AI service is temporarily unavailable. Please try again later.');
      }

      setAiMetadataProposal(data.data);
      setAiDraftModalOpen(true);
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message || 'AI service is temporarily unavailable.' });
    } finally {
      setAiLoading(false);
    }
  };

  // Apply approved AI suggestions into Manuscript form
  const handleApplyAiMetadata = () => {
    if (!aiMetadataProposal) return;
    if (aiMetadataProposal.brief) setBrief(aiMetadataProposal.brief);
    if (aiMetadataProposal.subject) setSubject(aiMetadataProposal.subject);
    if (aiMetadataProposal.genre) setGenre(aiMetadataProposal.genre);
    if (aiMetadataProposal.tags && aiMetadataProposal.tags.length > 0) {
      setTagsInput(aiMetadataProposal.tags.join(', '));
    }
    setAiDraftModalOpen(false);
    setAlertMsg({
      type: 'success',
      text: 'AI Curatorial metadata successfully reviewed and applied to manuscript composition form!',
    });
  };

  // Trigger AI Art & Craft Draft dossier generation
  const handleAiGenerateCraftDraft = async () => {
    if (!craftForm.name.trim()) {
      setAlertMsg({
        type: 'error',
        text: 'Please enter a Craft Name (e.g. Channapatna Toys) before consulting the AI Assistant.',
      });
      return;
    }

    const token = localStorage.getItem('literature_token');
    try {
      setAiCraftLoading(true);
      const res = await fetch(getApiUrl('/api/ai/art-craft'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: craftForm.name,
          state: craftForm.state,
          region: craftForm.region,
          place: craftForm.place,
          type: craftForm.type,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'AI service is temporarily unavailable. Please try again later.');
      }

      setAiCraftProposal(data.data);
      setAiCraftModalOpen(true);
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message || 'AI service is temporarily unavailable.' });
    } finally {
      setAiCraftLoading(false);
    }
  };

  // Apply approved AI Art & Craft draft into craftForm
  const handleApplyAiCraftDraft = () => {
    if (!aiCraftProposal) return;
    setCraftForm((prev) => ({
      ...prev,
      localName: aiCraftProposal.localName || prev.localName,
      originPeriod: aiCraftProposal.originPeriod || prev.originPeriod,
      history: aiCraftProposal.history || prev.history,
      culturalSignificance: aiCraftProposal.culturalSignificance || prev.culturalSignificance,
      culturalBackground: aiCraftProposal.culturalBackground || prev.culturalBackground,
      materials: aiCraftProposal.materials || prev.materials,
      makingProcess: aiCraftProposal.makingProcess || prev.makingProcess,
      traditionalProducts: aiCraftProposal.traditionalProducts || prev.traditionalProducts,
      modernContext: aiCraftProposal.modernContext || prev.modernContext,
    }));
    setAiCraftModalOpen(false);
    setAlertMsg({
      type: 'success',
      text: 'AI-generated Art & Craft dossier applied as draft. Review and verify details before publishing.',
    });
  };

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

  const fetchAdminCrafts = async () => {
    if (!isAdmin) return;
    try {
      const res = await fetch('/api/art-craft?status=ALL');
      if (res.ok) {
        const data = await res.json();
        setAdminCrafts(data.artCrafts || []);
      }
    } catch (err) {
      console.error('Failed to load admin crafts:', err);
    }
  };

  const handleSaveCraft = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('literature_token');
    try {
      setLoading(true);
      const url = editingCraftId ? `/api/art-craft/${editingCraftId}` : '/api/art-craft';
      const method = editingCraftId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(craftForm),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save craft entry.');
      }

      setAlertMsg({
        type: 'success',
        text: editingCraftId ? 'Art & Craft updated successfully.' : 'New Art & Craft entry created successfully.',
      });

      // Reset form
      setEditingCraftId(null);
      setCraftForm({
        name: '',
        localName: '',
        state: 'Karnataka',
        region: '',
        district: '',
        place: '',
        type: 'Woodcraft & Lacquerware',
        originPeriod: '',
        history: '',
        culturalSignificance: '',
        culturalBackground: '',
        materials: '',
        makingProcess: '',
        traditionalProducts: '',
        modernContext: '',
        coverImage: '',
        status: 'PUBLISHED',
      });

      fetchAdminCrafts();
      fetchDashboardKpis();
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message || 'Operation failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCraft = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return;
    const token = localStorage.getItem('literature_token');
    try {
      const res = await fetch(`/api/art-craft/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setAlertMsg({ type: 'success', text: `Craft "${name}" deleted.` });
        fetchAdminCrafts();
        fetchDashboardKpis();
      } else {
        throw new Error('Failed to delete craft.');
      }
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message });
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchMetadata();
      fetchArchivalWorks();
      fetchDashboardKpis();
      fetchAdminCrafts();
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

    // Publication Requirements Check for PUBLISHED works:
    // Note: cover image is NO LONGER required — a default classical cover will be
    // auto-assigned server-side if none is provided.
    if (targetStatus === 'PUBLISHED') {
      if (!content || !content.trim()) {
        setAlertMsg({
          type: 'error',
          text: 'Literature content cannot be empty.',
        });
        return;
      }
    }

    // Default classical cover fallback (used when Admin publishes without uploading a cover)
    const DEFAULT_COVER_URL =
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=85';

    setLoading(true);
    setAlertMsg(null);
    const token = localStorage.getItem('literature_token');

    try {
      let finalCoverUrl: string | null = null;
      if (coverFile) {
        finalCoverUrl = await uploadCoverToServer();
      } else if (coverPreview) {
        // coverPreview may be an existing URL (when editing), pass it through
        finalCoverUrl = coverPreview;
      }

      // If no cover is set and we're publishing, use the default classical cover
      if (!finalCoverUrl && targetStatus === 'PUBLISHED') {
        finalCoverUrl = DEFAULT_COVER_URL;
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
          <button
            className={`editorial-tab-btn ${activeTab === 'artcraft' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('artcraft');
              fetchAdminCrafts();
            }}
            id="tab-btn-artcraft-studio"
          >
            <Palette size={16} />
            Art & Craft Studio
            <span className="badge-count" id="artcraft-count-badge" style={{ backgroundColor: 'var(--accent-gold)', color: 'var(--bg-dark)' }}>
              {adminCrafts.length}
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

            {/* 12. Total Art & Craft (Cultural Heritage Telemetry) */}
            <div className="kpi-card" id="kpi-total-artcraft" data-testid="kpi-card-total-artcraft">
              <div className="kpi-card-top">
                <span className="kpi-card-label">Total Art & Craft</span>
                <div className="kpi-card-icon-wrap gold">
                  <Sparkles size={18} />
                </div>
              </div>
              <div className="kpi-card-value" id="kpi-val-total-artcraft">
                {kpiData && kpiData.totalArtCraft !== undefined ? kpiData.totalArtCraft : '0'}
              </div>
              <div className="kpi-card-subtext">
                <span>Across all 28 Indian States</span>
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
                  placeholder={
                    language === 'Kannada'
                      ? 'ಉದಾಹರಣೆಗೆ: ಮಲೆಗಳಲ್ಲಿ ಮದುಮಗಳು'
                      : language === 'Hindi'
                      ? 'उदा: गोदान'
                      : language === 'Tamil'
                      ? 'எ.கா: சிலப்பதிகாரம்'
                      : language === 'Telugu'
                      ? 'ఉదా: ఆంధ్ర మహాభారతము'
                      : language === 'Sanskrit'
                      ? 'उदा: मेघदूतम्'
                      : 'e.g., Pride and Prejudice, The Divine Comedy'
                  }
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  {language !== 'English'
                    ? `Enter title in ${language} script. It will be stored and displayed authentically in ${language} without transliteration or translation.`
                    : 'Enter title as published. It will be preserved and displayed in its original text.'}
                </p>
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
                      placeholder={
                        language === 'Kannada'
                          ? 'ಲೇಖಕರ ಹೆಸರು (ಉದಾ: ಕುವೆಂಪು, ದ.ರಾ. ಬೇಂದ್ರೆ)'
                          : language === 'Hindi'
                          ? 'लेखक का नाम (उदा: मुंशी प्रेमचंद, कबीर)'
                          : language === 'Tamil'
                          ? 'ஆசிரியர் பெயர் (எ.கா: இளங்கோ அடிகள், பாரதியார்)'
                          : language === 'Telugu'
                          ? 'రచయిత పేరు (ఉదా: శ్రీశ్రీ, నన్నయ)'
                          : language === 'Sanskrit'
                          ? 'रचयितुः नाम (उदा: कालिदासः)'
                          : 'Creator Full Name (e.g. Jane Austen, Dante Alighieri)'
                      }
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
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                    Author name entered in native script ({language}) will be preserved and displayed exactly as entered across the entire application without transliteration.
                  </p>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label className="form-label" htmlFor="lit-brief" style={{ margin: 0 }}>
                    Brief Philosophical Abstract <span style={{ color: 'var(--accent-burgundy)' }}>*</span>
                  </label>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={aiLoading}
                    onClick={() => handleAiGenerateMetadata('brief')}
                    id="btn-admin-ai-generate-brief"
                    style={{ borderColor: 'var(--accent-gold)', fontSize: '0.8rem', padding: '0.25rem 0.65rem' }}
                    title="Generate brief using Google Gemini"
                  >
                    <Sparkles size={13} style={{ marginRight: '4px', color: 'var(--accent-gold)' }} />
                    <span>{aiLoading ? 'Generating...' : '✨ Generate Brief'}</span>
                  </button>
                </div>
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
                    className="tag-badge green"
                    id="badge-content-page-count"
                    title={`${currentContentPages} pages`}
                  >
                    📄 {currentContentPages} {currentContentPages === 1 ? 'Page' : 'Pages'}
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
                <p style={{ fontSize: '0.8rem', color: content.trim() ? '#166534' : 'var(--text-muted)', marginTop: '0.35rem', fontWeight: 500 }} id="content-page-requirement-hint">
                  {content.trim()
                    ? `✓ Manuscript content verified (${currentContentPages} ${currentContentPages === 1 ? 'page' : 'pages'}). Ready to be saved or published.`
                    : 'Provide manuscript content. Literature can be saved as draft or published at any length.'}
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <label className="form-label" htmlFor="lit-tags" style={{ margin: 0 }}>
                      Archival Tags <span className="form-label-optional">(Comma separated)</span>
                    </label>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      disabled={aiLoading}
                      onClick={() => handleAiGenerateMetadata('tags')}
                      id="btn-admin-ai-generate-tags"
                      style={{ borderColor: 'var(--accent-gold)', fontSize: '0.78rem', padding: '0.2rem 0.6rem' }}
                      title="Generate Tags, Subject & Genre using Google Gemini"
                    >
                      <Sparkles size={12} style={{ marginRight: '4px', color: 'var(--accent-gold)' }} />
                      <span>{aiLoading ? 'Generating...' : '✨ Generate Tags'}</span>
                    </button>
                  </div>
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

      {/* VIEW 3: INDIAN ART & CRAFT CURATION STUDIO */}
      {activeTab === 'artcraft' && (
        <div id="admin-artcraft-studio-view" style={{ animation: 'fadeIn 0.25s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 className="serif-title" style={{ fontSize: '1.45rem', color: 'var(--accent-burgundy)' }}>
                {editingCraftId ? 'Edit Traditional Art & Craft' : 'Art & Craft Cultural Registry'}
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Document, edit, draft, publish, and manage Indian regional heritage across all 28 states.
              </p>
            </div>
            {editingCraftId && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setEditingCraftId(null);
                  setCraftForm({
                    name: '',
                    localName: '',
                    state: 'Karnataka',
                    region: '',
                    district: '',
                    place: '',
                    type: 'Woodcraft & Lacquerware',
                    originPeriod: '',
                    history: '',
                    culturalSignificance: '',
                    culturalBackground: '',
                    materials: '',
                    makingProcess: '',
                    traditionalProducts: '',
                    modernContext: '',
                    coverImage: '',
                    status: 'PUBLISHED',
                  });
                }}
              >
                + Cancel Edit & Create New
              </button>
            )}
          </div>

          {/* Form Card */}
          <div className="editorial-form-card" style={{ marginBottom: '2.5rem' }}>
            <form onSubmit={handleSaveCraft}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <h3 className="serif-title" style={{ fontSize: '1.2rem', margin: 0, color: 'var(--accent-burgundy)' }}>
                  {editingCraftId ? 'Update Art & Craft Details' : 'Add New Indian Traditional Art & Craft'}
                </h3>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={aiCraftLoading}
                  onClick={handleAiGenerateCraftDraft}
                  id="btn-admin-ai-craft-draft"
                  style={{ borderColor: 'var(--accent-gold)', color: 'var(--accent-burgundy)' }}
                  title="Generate structured historical and cultural draft dossier using Google Gemini"
                >
                  <Sparkles size={14} style={{ marginRight: '5px', color: 'var(--accent-gold)' }} />
                  <span>{aiCraftLoading ? 'Consulting Archival Intellect...' : '✨ AI Assistant: Draft Historical & Cultural Dossier'}</span>
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div>
                  <label className="form-label" htmlFor="craft-form-name">Craft / Art Name *</label>
                  <input
                    type="text"
                    id="craft-form-name"
                    required
                    placeholder="e.g. Channapatna Toys"
                    value={craftForm.name}
                    onChange={(e) => setCraftForm({ ...craftForm, name: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label" htmlFor="craft-form-localname">Traditional / Local Name (Devanagari, Kannada, etc.)</label>
                  <input
                    type="text"
                    id="craft-form-localname"
                    placeholder="e.g. ಚನ್ನಪಟ್ಟಣದ ಗೊಂಬೆಗಳು / चन्नपटना खिलौने"
                    value={craftForm.localName}
                    onChange={(e) => setCraftForm({ ...craftForm, localName: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label" htmlFor="craft-form-state">State (28 Indian States) *</label>
                  <select
                    id="craft-form-state"
                    required
                    value={craftForm.state}
                    onChange={(e) => setCraftForm({ ...craftForm, state: e.target.value })}
                    className="form-select"
                  >
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

                <div>
                  <label className="form-label" htmlFor="craft-form-place">Place / Town / Village of Origin *</label>
                  <input
                    type="text"
                    id="craft-form-place"
                    required
                    placeholder="e.g. Channapatna"
                    value={craftForm.place}
                    onChange={(e) => setCraftForm({ ...craftForm, place: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label" htmlFor="craft-form-district">District</label>
                  <input
                    type="text"
                    id="craft-form-district"
                    placeholder="e.g. Ramanagara"
                    value={craftForm.district}
                    onChange={(e) => setCraftForm({ ...craftForm, district: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label" htmlFor="craft-form-region">Region</label>
                  <input
                    type="text"
                    id="craft-form-region"
                    placeholder="e.g. South Karnataka, Mewar"
                    value={craftForm.region}
                    onChange={(e) => setCraftForm({ ...craftForm, region: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label" htmlFor="craft-form-type">Craft / Art Type *</label>
                  <input
                    type="text"
                    id="craft-form-type"
                    required
                    placeholder="e.g. Woodcraft & Lacquerware"
                    value={craftForm.type}
                    onChange={(e) => setCraftForm({ ...craftForm, type: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label" htmlFor="craft-form-status">Publication Status</label>
                  <select
                    id="craft-form-status"
                    value={craftForm.status}
                    onChange={(e) => setCraftForm({ ...craftForm, status: e.target.value })}
                    className="form-select"
                  >
                    <option value="PUBLISHED">Published</option>
                    <option value="DRAFT">Draft</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" htmlFor="craft-form-origin">Origin Period (Verified / Approximate) *</label>
                <input
                  type="text"
                  id="craft-form-origin"
                  required
                  placeholder="e.g. Origin period: Believed to date back to the late 18th century under Tipu Sultan's reign"
                  value={craftForm.originPeriod}
                  onChange={(e) => setCraftForm({ ...craftForm, originPeriod: e.target.value })}
                  className="form-input"
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" htmlFor="craft-form-history">Verified History & Development *</label>
                <textarea
                  id="craft-form-history"
                  required
                  rows={4}
                  placeholder="Provide verified historical background..."
                  value={craftForm.history}
                  onChange={(e) => setCraftForm({ ...craftForm, history: e.target.value })}
                  className="form-textarea"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div>
                  <label className="form-label" htmlFor="craft-form-culture">Cultural Significance</label>
                  <textarea
                    id="craft-form-culture"
                    rows={3}
                    placeholder="Ritual, festive, and traditional cultural significance..."
                    value={craftForm.culturalSignificance}
                    onChange={(e) => setCraftForm({ ...craftForm, culturalSignificance: e.target.value })}
                    className="form-textarea"
                  />
                </div>

                <div>
                  <label className="form-label" htmlFor="craft-form-background">Community Background & Lore</label>
                  <textarea
                    id="craft-form-background"
                    rows={3}
                    placeholder="Artisan communities, hereditary lineages, traditional stories..."
                    value={craftForm.culturalBackground}
                    onChange={(e) => setCraftForm({ ...craftForm, culturalBackground: e.target.value })}
                    className="form-textarea"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div>
                  <label className="form-label" htmlFor="craft-form-materials">Traditional Materials Used</label>
                  <textarea
                    id="craft-form-materials"
                    rows={3}
                    placeholder="Ivory wood, natural lac, vegetable dyes, etc..."
                    value={craftForm.materials}
                    onChange={(e) => setCraftForm({ ...craftForm, materials: e.target.value })}
                    className="form-textarea"
                  />
                </div>

                <div>
                  <label className="form-label" htmlFor="craft-form-process">Traditional Making Process</label>
                  <textarea
                    id="craft-form-process"
                    rows={3}
                    placeholder="1. Raw material prep. 2. Lathe turning. 3. Lacquering. 4. Polishing..."
                    value={craftForm.makingProcess}
                    onChange={(e) => setCraftForm({ ...craftForm, makingProcess: e.target.value })}
                    className="form-textarea"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div>
                  <label className="form-label" htmlFor="craft-form-products">Famous Traditional Products</label>
                  <input
                    type="text"
                    id="craft-form-products"
                    placeholder="e.g. Raja-Rani dolls, rocking horses, wooden beads"
                    value={craftForm.traditionalProducts}
                    onChange={(e) => setCraftForm({ ...craftForm, traditionalProducts: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label" htmlFor="craft-form-modern">Modern Context & GI Status</label>
                  <input
                    type="text"
                    id="craft-form-modern"
                    placeholder="e.g. GI registered in 2006, contemporary initiatives..."
                    value={craftForm.modernContext}
                    onChange={(e) => setCraftForm({ ...craftForm, modernContext: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" htmlFor="craft-form-cover">Cover Image URL</label>
                <input
                  type="text"
                  id="craft-form-cover"
                  placeholder="https://... or /uploads/..."
                  value={craftForm.coverImage}
                  onChange={(e) => setCraftForm({ ...craftForm, coverImage: e.target.value })}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setEditingCraftId(null);
                    setCraftForm({
                      name: '',
                      localName: '',
                      state: 'Karnataka',
                      region: '',
                      district: '',
                      place: '',
                      type: 'Woodcraft & Lacquerware',
                      originPeriod: '',
                      history: '',
                      culturalSignificance: '',
                      culturalBackground: '',
                      materials: '',
                      makingProcess: '',
                      traditionalProducts: '',
                      modernContext: '',
                      coverImage: '',
                      status: 'PUBLISHED',
                    });
                  }}
                >
                  Reset Form
                </button>
                <button
                  type="submit"
                  className="btn-publish"
                  disabled={loading}
                  id="btn-submit-craft-form"
                >
                  <Check size={16} />
                  {editingCraftId ? 'Update Art & Craft' : 'Publish to Cultural Repository'}
                </button>
              </div>
            </form>
          </div>

          {/* Existing Art & Craft Table */}
          <h3 className="serif-title" style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--accent-burgundy)' }}>
            All Registered Indian Arts & Crafts ({adminCrafts.length})
          </h3>
          <div className="admin-artcraft-table-wrap">
            <table className="admin-artcraft-table" id="admin-crafts-table">
              <thead>
                <tr>
                  <th>Craft Name</th>
                  <th>State</th>
                  <th>Place / District</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {adminCrafts.map((craft) => (
                  <tr key={craft.id}>
                    <td>
                      <strong>{craft.name}</strong>
                      {craft.localName && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--accent-burgundy)' }}>
                          {craft.localName}
                        </div>
                      )}
                    </td>
                    <td>{craft.state}</td>
                    <td>{craft.place}{craft.district ? `, ${craft.district}` : ''}</td>
                    <td><span className="tag-badge" style={{ fontSize: '0.75rem' }}>{craft.type}</span></td>
                    <td>
                      <span className={`artcraft-status-tag ${craft.status.toLowerCase()}`}>
                        {craft.status}
                      </span>
                    </td>
                    <td>
                      <div className="admin-action-btn-group">
                        <button
                          className="admin-action-btn"
                          title="Edit Craft"
                          onClick={() => {
                            setEditingCraftId(craft.id);
                            setCraftForm({
                              name: craft.name,
                              localName: craft.localName || '',
                              state: craft.state,
                              region: craft.region || '',
                              district: craft.district || '',
                              place: craft.place,
                              type: craft.type,
                              originPeriod: craft.originPeriod,
                              history: craft.history,
                              culturalSignificance: craft.culturalSignificance || '',
                              culturalBackground: craft.culturalBackground || '',
                              materials: craft.materials || '',
                              makingProcess: craft.makingProcess || '',
                              traditionalProducts: craft.traditionalProducts || '',
                              modernContext: craft.modernContext || '',
                              coverImage: craft.coverImage || '',
                              status: craft.status,
                            });
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                        >
                          <Edit size={13} /> Edit
                        </button>
                        <button
                          className="admin-action-btn delete"
                          title="Delete Craft"
                          onClick={() => handleDeleteCraft(craft.id, craft.name)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* Admin AI Manuscript Metadata Review Modal */}
      {aiDraftModalOpen && aiMetadataProposal && (
        <div className="ai-modal-overlay" onClick={() => setAiDraftModalOpen(false)}>
          <div className="ai-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="ai-modal-header">
              <div className="ai-modal-header-left">
                <div className="ai-modal-icon-badge">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="ai-modal-title">Curatorial AI Metadata Review</h3>
                  <p className="ai-modal-subtitle">Review, edit, and approve before applying to manuscript form</p>
                </div>
              </div>
              <button className="ai-modal-close-btn" onClick={() => setAiDraftModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="ai-modal-body">
              <div className="ai-disclaimer-badge">
                <ShieldCheck size={14} />
                <span>Curator approval required. Content will not be published until you explicitly save.</span>
              </div>

              {aiMetadataProposal.brief && (
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, color: 'var(--accent-burgundy)' }}>
                    Curatorial Brief (Draft)
                  </label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    value={aiMetadataProposal.brief}
                    onChange={(e) =>
                      setAiMetadataProposal({ ...aiMetadataProposal, brief: e.target.value })
                    }
                  />
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, color: 'var(--accent-burgundy)' }}>
                    Proposed Genre
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={aiMetadataProposal.genre || ''}
                    onChange={(e) =>
                      setAiMetadataProposal({ ...aiMetadataProposal, genre: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, color: 'var(--accent-burgundy)' }}>
                    Proposed Subject
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={aiMetadataProposal.subject || ''}
                    onChange={(e) =>
                      setAiMetadataProposal({ ...aiMetadataProposal, subject: e.target.value })
                    }
                  />
                </div>
              </div>

              {aiMetadataProposal.tags && (
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, color: 'var(--accent-burgundy)' }}>
                    Proposed Tags (Comma-separated)
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={aiMetadataProposal.tags.join(', ')}
                    onChange={(e) =>
                      setAiMetadataProposal({
                        ...aiMetadataProposal,
                        tags: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                      })
                    }
                  />
                </div>
              )}
            </div>

            <div className="ai-modal-footer">
              <button
                type="button"
                className="btn-ai-secondary"
                onClick={() => setAiDraftModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-ai-action"
                onClick={handleApplyAiMetadata}
                id="btn-apply-ai-metadata"
              >
                <Check size={14} />
                <span>Approve & Apply to Form</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin AI Art & Craft Dossier Review Modal */}
      {aiCraftModalOpen && aiCraftProposal && (
        <div className="ai-modal-overlay" onClick={() => setAiCraftModalOpen(false)}>
          <div className="ai-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '780px' }}>
            <div className="ai-modal-header">
              <div className="ai-modal-header-left">
                <div className="ai-modal-icon-badge">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="ai-modal-title">Review AI Art & Craft Cultural Dossier</h3>
                  <p className="ai-modal-subtitle">Verify historical accuracy and provenance before populating draft form</p>
                </div>
              </div>
              <button className="ai-modal-close-btn" onClick={() => setAiCraftModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="ai-modal-body" style={{ maxHeight: '68vh', overflowY: 'auto' }}>
              <div className="ai-disclaimer-badge">
                <ShieldCheck size={14} />
                <span>Draft Information: Cultural & historical facts must be verified by Curators before publishing.</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, color: 'var(--accent-burgundy)' }}>
                    Traditional / Local Name
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={aiCraftProposal.localName || ''}
                    onChange={(e) => setAiCraftProposal({ ...aiCraftProposal, localName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, color: 'var(--accent-burgundy)' }}>
                    Origin Period / Epoch
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={aiCraftProposal.originPeriod || ''}
                    onChange={(e) => setAiCraftProposal({ ...aiCraftProposal, originPeriod: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, color: 'var(--accent-burgundy)' }}>
                  Historical Chronicle
                </label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  value={aiCraftProposal.history || ''}
                  onChange={(e) => setAiCraftProposal({ ...aiCraftProposal, history: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, color: 'var(--accent-burgundy)' }}>
                    Cultural Significance
                  </label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    value={aiCraftProposal.culturalSignificance || ''}
                    onChange={(e) => setAiCraftProposal({ ...aiCraftProposal, culturalSignificance: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, color: 'var(--accent-burgundy)' }}>
                    Cultural Background
                  </label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    value={aiCraftProposal.culturalBackground || ''}
                    onChange={(e) => setAiCraftProposal({ ...aiCraftProposal, culturalBackground: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, color: 'var(--accent-burgundy)' }}>
                    Materials Used
                  </label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    value={aiCraftProposal.materials || ''}
                    onChange={(e) => setAiCraftProposal({ ...aiCraftProposal, materials: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, color: 'var(--accent-burgundy)' }}>
                    Traditional Products
                  </label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    value={aiCraftProposal.traditionalProducts || ''}
                    onChange={(e) => setAiCraftProposal({ ...aiCraftProposal, traditionalProducts: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, color: 'var(--accent-burgundy)' }}>
                  Traditional Making Process
                </label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={aiCraftProposal.makingProcess || ''}
                  onChange={(e) => setAiCraftProposal({ ...aiCraftProposal, makingProcess: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, color: 'var(--accent-burgundy)' }}>
                  Modern Context & GI Status
                </label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  value={aiCraftProposal.modernContext || ''}
                  onChange={(e) => setAiCraftProposal({ ...aiCraftProposal, modernContext: e.target.value })}
                />
              </div>
            </div>

            <div className="ai-modal-footer">
              <button
                type="button"
                className="btn-ai-secondary"
                onClick={() => setAiCraftModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-ai-action"
                onClick={handleApplyAiCraftDraft}
                id="btn-apply-ai-craft"
              >
                <Check size={14} />
                <span>Verify & Apply to Craft Form</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
