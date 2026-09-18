import React, { useState, useEffect } from 'react';
import { Search, MapPin, Sparkles } from 'lucide-react';
import { ArtCraftCard } from './ArtCraftCard';
import type { ArtCraftItem } from './ArtCraftCard';
import './ArtCraftView.css';

interface ArtCraftCatalogViewProps {
  onSelectArtCraft: (craft: ArtCraftItem) => void;
}

export const ArtCraftCatalogView: React.FC<ArtCraftCatalogViewProps> = ({ onSelectArtCraft }) => {
  const [crafts, setCrafts] = useState<ArtCraftItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedState, setSelectedState] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statesList, setStatesList] = useState<{ name: string; count: number }[]>([]);

  // Fetch states summary
  useEffect(() => {
    fetch('/api/art-craft/states')
      .then((res) => res.json())
      .then((data) => {
        if (data.states) setStatesList(data.states);
      })
      .catch((err) => console.error('Error loading states:', err));
  }, []);

  // Fetch crafts whenever state or type filter changes
  useEffect(() => {
    fetchCrafts();
  }, [selectedState, selectedType]);

  const fetchCrafts = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (selectedState !== 'ALL') params.append('state', selectedState);
      if (selectedType !== 'ALL') params.append('type', selectedType);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await fetch(`/api/art-craft?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load Indian Art & Craft archives.');
      const data = await res.json();
      setCrafts(data.artCrafts || []);
    } catch (err: any) {
      setError(err.message || 'Error loading crafts');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCrafts();
  };

  const handleReset = () => {
    setSelectedState('ALL');
    setSelectedType('ALL');
    setSearchQuery('');
    fetch('/api/art-craft')
      .then((res) => res.json())
      .then((data) => setCrafts(data.artCrafts || []))
      .catch((err) => console.error('Reset error:', err));
  };

  return (
    <div className="artcraft-section" id="artcraft-catalog-view">
      {/* Hero Banner */}
      <div className="artcraft-hero-banner">
        <h1 className="artcraft-hero-title" id="artcraft-section-title">
          Indian Art & Cultural Heritage
        </h1>
        <p className="artcraft-hero-subtitle">
          An immersive educational compendium documenting the living origins, verified history, traditional making
          processes, materials, and regional significance of classical arts and crafts across all 28 Indian States.
        </p>
        <div className="artcraft-hero-stats">
          <span className="artcraft-stat-pill">
            <strong>28</strong> Indian States Covered
          </span>
          <span className="artcraft-stat-pill">
            <strong>{crafts.length}</strong> Registered Heritage Crafts
          </span>
          <span className="artcraft-stat-pill">
            <Sparkles size={14} style={{ color: 'var(--accent-gold)' }} />
            Verified Cultural Documentation
          </span>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="artcraft-filter-bar">
        <form onSubmit={handleSearchSubmit} className="artcraft-search-row">
          <div className="artcraft-search-input-wrap">
            <Search size={16} className="artcraft-search-icon" />
            <input
              type="text"
              placeholder="Search by craft name, place (e.g. Channapatna, Jaipur), materials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="artcraft-search-input"
              id="input-artcraft-search"
            />
          </div>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="artcraft-select"
            id="select-craft-type"
          >
            <option value="ALL">All Craft Types</option>
            <option value="Woodcraft">Woodcraft & Lacquerware</option>
            <option value="Painting">Traditional Painting & Folk Art</option>
            <option value="Textile">Textile Weaving & Embroidery</option>
            <option value="Pottery">Pottery & Terracotta</option>
            <option value="Metal">Metalwork & Casting</option>
            <option value="Cane">Cane & Bamboo</option>
          </select>

          <button type="submit" className="btn btn-primary btn-sm" id="btn-search-artcraft">
            <Search size={14} style={{ marginRight: '4px' }} />
            Search
          </button>

          {(selectedState !== 'ALL' || selectedType !== 'ALL' || searchQuery) && (
            <button type="button" onClick={handleReset} className="btn btn-secondary btn-sm" id="btn-reset-artcraft">
              Reset Filters
            </button>
          )}
        </form>

        {/* Horizontal State Navigation Chips */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <MapPin size={14} style={{ color: 'var(--accent-burgundy)' }} />
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Filter by State (28 States):
            </span>
          </div>
          <div className="artcraft-states-scroll" id="states-filter-bar">
            <button
              className={`artcraft-state-chip ${selectedState === 'ALL' ? 'active' : ''}`}
              onClick={() => setSelectedState('ALL')}
              id="chip-state-all"
            >
              All States ({statesList.reduce((acc, s) => acc + s.count, 0)})
            </button>
            {statesList.map((st) => (
              <button
                key={st.name}
                className={`artcraft-state-chip ${selectedState === st.name ? 'active' : ''}`}
                onClick={() => setSelectedState(st.name)}
                id={`chip-state-${st.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {st.name} {st.count > 0 ? `(${st.count})` : ''}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Craft Cards Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3.5rem 0', color: 'var(--text-muted)' }}>
          <p>Retrieving traditional Indian arts and crafts repository...</p>
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: '#c62828' }}>
          <p>{error}</p>
        </div>
      ) : crafts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3.5rem 0', color: 'var(--text-muted)' }}>
          <p>No crafts found matching your search parameters.</p>
          <button onClick={handleReset} className="btn btn-secondary btn-sm" style={{ marginTop: '1rem' }}>
            View All Crafts
          </button>
        </div>
      ) : (
        <div className="artcraft-grid" id="artcraft-cards-grid">
          {crafts.map((item) => (
            <ArtCraftCard
              key={item.id}
              item={item}
              onClick={() => onSelectArtCraft(item)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
