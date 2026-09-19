'use client';

import { useState, useEffect, useRef } from 'react';

interface FieldOfStudy {
  code: string;
  name: string;
  category: string;
  level?: string;
}

interface FieldOfStudySearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function FieldOfStudySearch({
  value,
  onChange,
  placeholder = 'Search for your field of study...',
  className = '',
}: FieldOfStudySearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [fields, setFields] = useState<FieldOfStudy[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const searchFields = async () => {
      if (searchQuery.length < 2) {
        setFields([]);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(
          `/api/search-fields?query=${encodeURIComponent(searchQuery)}&limit=10`
        );
        const data = await response.json();
        setFields(data.results || []);
      } catch (error) {
        console.error('Failed to search fields:', error);
        setFields([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchFields, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (field: FieldOfStudy) => {
    onChange(field.name);
    setSearchQuery('');
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    onChange(newValue);
    setIsOpen(true);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={`w-full px-4 py-3 border-2 border-[var(--cl-hairline)] rounded-[var(--cl-r-lg)] focus:outline-none focus:border-[var(--cl-primary)] transition-colors bg-[var(--cl-surface-card)] text-black placeholder:text-[var(--cl-muted-soft)] ${className}`}
        />
        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-[var(--cl-primary)] border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {isOpen && fields.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-[var(--cl-surface-card)] border-2 border-[var(--cl-hairline)] rounded-[var(--cl-r-lg)] max-h-80 overflow-y-auto">
          {fields.map((field, index) => (
            <button
              key={`${field.code}-${index}`}
              type="button"
              onClick={() => handleSelect(field)}
              className="w-full px-4 py-3 text-left hover:bg-[var(--cl-primary-soft)] transition-colors border-b border-[var(--cl-hairline)] last:border-b-0"
            >
              <div className="font-medium text-black">{field.name}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-[var(--cl-muted)]">{field.category}</span>
                {field.level && (
                  <>
                    <span className="text-[var(--cl-muted-soft)]">•</span>
                    <span className="text-xs px-2 py-0.5 bg-[var(--cl-primary-soft)] text-[var(--cl-primary)] rounded-full font-medium">
                      {field.level}
                    </span>
                  </>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && searchQuery.length >= 2 && fields.length === 0 && !loading && (
        <div className="absolute z-50 w-full mt-2 bg-[var(--cl-surface-card)] border-2 border-[var(--cl-hairline)] rounded-[var(--cl-r-lg)] p-4">
          <p className="text-sm text-[var(--cl-body)] text-center">
            No fields found. Try a different search term.
          </p>
        </div>
      )}
    </div>
  );
}
