'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface UniversityOption {
  id?: string;
  name: string;
  country: string;
  'state-province': string | null;
  domain?: string;
}

interface UniversitySearchProps {
  value: string;
  onChange: (value: string, universityId?: string) => void;
  label?: string;
  error?: string;
  placeholder?: string;
}

export function UniversitySearch({
  value,
  onChange,
  label,
  error,
  placeholder = 'Search for your university...',
}: UniversitySearchProps) {
  const [query, setQuery] = useState(value);
  const [universities, setUniversities] = useState<UniversityOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2) {
        searchUniversities(query);
      } else {
        setUniversities([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const searchUniversities = async (searchQuery: string) => {
    setLoading(true);
    try {
      // First, search the API for universities
      const response = await fetch(
        `/api/search-universities?query=${encodeURIComponent(searchQuery)}&country=India`
      );
      
      if (!response.ok) throw new Error('Search failed');
      
      const data = await response.json();
      
      if (data.error) {
        console.error('API Error:', data.error);
        setUniversities([]);
      } else {
        // For each university from API, try to find matching ID in our database
        const universitiesWithIds = await Promise.all(
          data.slice(0, 10).map(async (uni: UniversityOption) => {
            // Try to find university in our database by name or domain
            const { data: dbUni } = await supabase
              .from('universities')
              .select('id, name, domain')
              .or(`name.ilike.%${uni.name}%,domain.eq.${uni.domain || ''}`)
              .limit(1)
              .single();
            
            return {
              ...uni,
              id: dbUni?.id, // Will be undefined if not found in our DB
            };
          })
        );
        
        setUniversities(universitiesWithIds);
        setShowDropdown(true);
      }
    } catch (error) {
      console.error('Error fetching universities:', error);
      setUniversities([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (university: UniversityOption) => {
    const universityName = university.name;
    setQuery(universityName);
    onChange(universityName, university.id);
    setShowDropdown(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);
    onChange(newValue, undefined);
    if (newValue.length >= 2) {
      setShowDropdown(true);
    }
  };

  return (
    <div className="w-full" ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => {
              if (query.length >= 2 && universities.length > 0) {
                setShowDropdown(true);
              }
            }}
            placeholder={placeholder}
            className={`w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-fuchsia-500 transition-colors ${
              error ? 'border-red-500' : ''
            }`}
          />
          {loading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="w-5 h-5 border-2 border-fuchsia-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        {/* Dropdown */}
        {showDropdown && universities.length > 0 && (
          <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-lg border border-slate-200 max-h-60 overflow-y-auto">
            {universities.map((university, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSelect(university)}
                className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors flex items-start justify-between gap-2 border-b border-slate-100 last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-black truncate">
                    {university.name}
                  </p>
                  {university['state-province'] && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      {university['state-province']}, {university.country}
                    </p>
                  )}
                </div>
                {value === university.name && (
                  <Check className="w-5 h-5 text-fuchsia-600 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* No results */}
        {showDropdown && !loading && query.length >= 2 && universities.length === 0 && (
          <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-lg border border-slate-200 px-4 py-3">
            <p className="text-sm text-slate-500">No universities found. Try a different search.</p>
          </div>
        )}
      </div>

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      
      {query.length > 0 && query.length < 2 && (
        <p className="mt-1 text-xs text-slate-500">Type at least 2 characters to search</p>
      )}
    </div>
  );
}
