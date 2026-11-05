'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { SlangTerm } from '@/server/services/slangService';

interface SlangDictionaryClientProps {
  terms: SlangTerm[];
}

export function SlangDictionaryClient({ terms }: SlangDictionaryClientProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = useMemo(() => {
    const set = new Set<string>();
    terms.forEach((t) => set.add(t.category));
    return ['all', ...Array.from(set).sort()];
  }, [terms]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return terms.filter((item) => {
      const matchesSearch =
        !q ||
        item.term.toLowerCase().includes(q) ||
        item.meaning.toLowerCase().includes(q) ||
        (item.explanation && item.explanation.toLowerCase().includes(q));

      const matchesCat =
        selectedCategory === 'all' || item.category === selectedCategory;

      return matchesSearch && matchesCat;
    });
  }, [terms, search, selectedCategory]);

  return (
    <div className="space-y-6">
      {/* Search and Category Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search slang terms (e.g. Omo, Sapa, Japa)..."
            className="w-full px-4 py-3 rounded-xl bg-naija-surface border border-naija-border/80 text-naija-text placeholder:text-naija-muted focus:outline-none focus:border-brand-500 text-sm min-h-[48px] transition-colors"
            aria-label="Search slang words"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-3.5 text-xs text-naija-muted hover:text-naija-text"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category selector */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap min-h-[44px] transition-colors ${
                selectedCategory === cat
                  ? 'bg-brand-500 text-naija-text'
                  : 'bg-naija-surface border border-naija-border text-naija-muted hover:text-naija-text'
              }`}
            >
              {cat === 'all' ? 'All Slangs' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div className="text-xs text-naija-muted font-mono flex justify-between items-center">
        <span>Showing {filtered.length} of {terms.length} terms</span>
        {search && (
          <button
            onClick={() => setSearch('')}
            className="text-brand-600 dark:text-brand-600 dark:text-brand-400 hover:underline font-sans text-xs"
          >
            Clear filter
          </button>
        )}
      </div>

      {/* Grid of Slang Cards */}
      {filtered.length === 0 ? (
        <Card className="p-8 text-center space-y-3">
          <div className="text-3xl">🤷‍♂️</div>
          <p className="text-sm text-naija-text font-semibold">No slang matches your search.</p>
          <p className="text-xs text-naija-muted">
            Think you know a term we missed? Submit it through the Slang Quiz!
          </p>
          <Link
            href="/boxes/slang-quiz"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-brand-500 text-naija-text font-semibold text-xs min-h-[44px]"
          >
            Go to Slang Quiz
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((item) => (
            <Link
              key={item.id}
              href={`/slang/${item.slug}`}
              className="group block focus:outline-none"
            >
              <Card interactive className="h-full p-4 flex flex-col justify-between border-naija-border/60 hover:border-brand-500/50">
                <CardHeader className="p-0 pb-2">
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-lg font-bold text-naija-text group-hover:text-brand-600 dark:group-hover:text-brand-600 dark:text-brand-400 transition-colors">
                      {item.term}
                    </CardTitle>
                    <span className="text-[10px] px-2 py-0.5 rounded uppercase font-semibold bg-brand-500/10 text-brand-600 dark:text-brand-600 dark:text-brand-300 border border-brand-500/20 whitespace-nowrap">
                      {item.category}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-0 space-y-2">
                  <p className="text-xs text-naija-muted line-clamp-2 leading-relaxed">
                    {item.meaning}
                  </p>
                  {item.explanation && (
                    <p className="text-[11px] text-naija-muted italic line-clamp-1">
                      Context: {item.explanation}
                    </p>
                  )}
                  <div className="pt-2 text-[11px] font-semibold text-brand-600 dark:text-brand-600 dark:text-brand-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    View meaning & examples &rarr;
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
