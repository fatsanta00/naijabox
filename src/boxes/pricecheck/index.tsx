'use client';

import React, { useState, useEffect, useCallback, useId } from 'react';
import Link from 'next/link';
import { BoxProps } from '../types';
import { Card, Button } from '@/components/ui';
import { analytics } from '@/lib/analytics';

interface SearchProduct {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  category: string | null;
  variant: string | null;
  lowestPriceNgn: number | null;
}

interface ListingItem {
  id: string;
  priceNgn: number;
  condition: 'new' | 'used' | 'refurbished';
  location: string | null;
  url: string | null;
  affiliateUrl: string | null;
  isPaid: boolean;
  paidLabel: 'sponsored' | 'promoted' | null;
  source: string | null;
  lastSeenAt: string;
  sellerName: string | null;
  sellerUrl: string | null;
}

interface PriceSnapshotItem {
  date: string;
  avgPrice: string;
  minPrice: string;
  maxPrice: string;
  listingCount: number;
}

interface ProductDetailData {
  product: {
    id: string;
    slug: string;
    name: string;
    brand: string | null;
    category: string | null;
    variant: string | null;
    imageUrl: string | null;
  };
  listings: ListingItem[];
  snapshots: PriceSnapshotItem[];
  goodPriceVerdict: 'very_good' | 'good' | 'fair' | 'high' | 'very_high' | null;
  lowestPrice: number | null;
  currentAvgPrice: number | null;
}

function formatNGN(n: number | null | undefined): string {
  if (n === null || n === undefined) return 'N/A';
  return '₦' + n.toLocaleString('en-NG');
}

export default function PriceCheckBox({ slug, title }: BoxProps) {
  const searchInputId = useId();
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [productData, setProductData] = useState<ProductDetailData | null>(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);
  const [customPriceCheck, setCustomPriceCheck] = useState<string>('');
  const [customVerdict, setCustomVerdict] = useState<{
    label: string;
    badge: string;
    color: string;
    text: string;
  } | null>(null);

  // Track box opened
  useEffect(() => {
    analytics.track('box_opened', { experience: slug }, slug);
    analytics.track('experience_started', { experience: slug, entry: 'direct' }, slug);
  }, [slug]);

  // Search debounce
  useEffect(() => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/public/pricecheck/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.products || []);
          analytics.track(
            'pricecheck_searched',
            {
              query_length: query.trim().length,
              results_count: (data.products || []).length,
              matched_product_id: data.products?.[0]?.id ?? null,
            },
            slug
          );
        }
      } catch {
        // Search error silent fallback
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, slug]);

  // Load product detail
  const loadProductDetail = useCallback(
    async (productSlug: string) => {
      setIsLoadingProduct(true);
      setCustomVerdict(null);
      setCustomPriceCheck('');

      try {
        const res = await fetch(`/api/public/pricecheck/products/${productSlug}`);
        if (res.ok) {
          const data: ProductDetailData = await res.json();
          setProductData(data);
          analytics.track('pricecheck_product_viewed', { product_id: data.product.id }, slug);

          if (data.goodPriceVerdict) {
            analytics.track(
              'pricecheck_goodprice_checked',
              { product_id: data.product.id, verdict: data.goodPriceVerdict },
              slug
            );
          }
        }
      } catch {
        // error handling
      } finally {
        setIsLoadingProduct(false);
      }
    },
    [slug]
  );

  // Check custom price
  const evaluateCustomPrice = () => {
    if (!productData) return;
    const price = parseInt(customPriceCheck.replace(/[^0-9]/g, ''), 10);
    if (isNaN(price) || price <= 0) return;

    const base = productData.currentAvgPrice || productData.lowestPrice || price;
    const diffPct = ((price - base) / base) * 100;

    let verdict: { label: string; badge: string; color: string; text: string };

    if (diffPct <= -12) {
      verdict = {
        label: 'Suspiciously Cheap / Great Steal',
        badge: 'Very Good',
        color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
        text: 'This is significantly below market average. Make sure to inspect properly and verify it is not refurbished or iCloud locked if bought second-hand.',
      };
    } else if (diffPct <= -2) {
      verdict = {
        label: 'Good Deal',
        badge: 'Good Price',
        color: 'bg-green-500/20 text-green-400 border-green-500/40',
        text: 'Clean price! You are getting a decent rate better than most typical street shops.',
      };
    } else if (diffPct <= 8) {
      verdict = {
        label: 'Fair Market Price',
        badge: 'Fair',
        color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
        text: 'Right within standard market retail range in Lagos/Abuja markets.',
      };
    } else if (diffPct <= 20) {
      verdict = {
        label: 'A Bit Pricey',
        badge: 'High',
        color: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
        text: 'Higher than usual. You should price-haggle or look for another vendor before paying.',
      };
    } else {
      verdict = {
        label: 'Cut-throat Price!',
        badge: 'Very High',
        color: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
        text: 'Omo! They are charging you premium tax. Do not buy at this price without shopping around.',
      };
    }

    setCustomVerdict(verdict);
    analytics.track(
      'pricecheck_goodprice_checked',
      { product_id: productData.product.id, verdict: verdict.badge.toLowerCase().replace(' ', '_') },
      slug
    );
  };

  const handleOutboundClick = (listing: ListingItem) => {
    analytics.track(
      'pricecheck_outbound_clicked',
      {
        listing_id: listing.id,
        is_paid: listing.isPaid,
        paid_label: listing.paidLabel,
        is_affiliate: Boolean(listing.affiliateUrl),
      },
      slug
    );
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Search Header */}
      <Card className="p-6 text-center space-y-3">
        <h2 className="text-2xl sm:text-3xl font-black text-white">{title}</h2>
        <p className="text-sm text-naija-muted">
          Real market prices for smartphones, gadgets and lifestyle items in Nigeria. Check before you pay.
        </p>

        <div className="pt-2 relative">
          <label htmlFor={searchInputId} className="sr-only">
            Search gadgets or items
          </label>
          <input
            id={searchInputId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search iPhone 15, Galaxy S24, Tecno, PS5..."
            className="w-full px-4 py-3 rounded-xl bg-naija-surface border border-naija-border/60 text-white placeholder:text-naija-muted focus:outline-none focus:border-brand-500 text-sm min-h-[48px]"
          />
          {isSearching && (
            <div className="absolute right-4 top-5 text-xs text-brand-400 animate-pulse">
              Searching...
            </div>
          )}
        </div>

        {/* Live Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="mt-2 text-left bg-naija-card border border-naija-border rounded-xl overflow-hidden shadow-2xl max-h-72 overflow-y-auto divide-y divide-naija-border/40">
            {searchResults.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  loadProductDetail(item.slug);
                  setSearchResults([]);
                }}
                className="w-full px-4 py-3 text-left hover:bg-naija-surface/80 flex items-center justify-between transition-colors min-h-[44px]"
              >
                <div>
                  <div className="text-sm font-bold text-white">{item.name}</div>
                  <div className="text-xs text-naija-muted">
                    {item.brand ? `${item.brand} • ` : ''}
                    {item.category || 'Gadget'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-brand-400 font-bold">
                    {item.lowestPriceNgn ? `From ${formatNGN(item.lowestPriceNgn)}` : 'View prices'}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* Loading state */}
      {isLoadingProduct && (
        <Card className="p-8 text-center text-sm text-naija-muted animate-pulse">
          Fetching market listings and price history...
        </Card>
      )}

      {/* Product Detail View */}
      {productData && !isLoadingProduct && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <Card className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-naija-border/40">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-brand-400">
                    {productData.product.category || 'Gadget'}
                  </span>
                  {productData.product.brand && (
                    <span className="text-xs text-naija-muted">({productData.product.brand})</span>
                  )}
                </div>
                <h3 className="text-2xl font-black text-white">{productData.product.name}</h3>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xs text-naija-muted block">Lowest Market Price</span>
                <span className="text-2xl font-black text-brand-400">
                  {formatNGN(productData.lowestPrice)}
                </span>
                {productData.currentAvgPrice && (
                  <span className="text-[11px] text-naija-muted block">
                    Avg: {formatNGN(productData.currentAvgPrice)}
                  </span>
                )}
              </div>
            </div>

            {/* Is this a good price? Checker Tool */}
            <div className="p-4 rounded-xl bg-naija-surface/60 border border-naija-border/50 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                💡 Good-Price Checker: Did they give you a fair quote?
              </h4>
              <p className="text-xs text-naija-muted">
                Enter the quote a seller gave you to see if you are getting cheated or getting a steal.
              </p>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="e.g. 750,000"
                  value={customPriceCheck}
                  onChange={(e) => setCustomPriceCheck(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-naija-card border border-naija-border/60 text-white text-sm focus:outline-none focus:border-brand-500 min-h-[44px]"
                />
                <Button onClick={evaluateCustomPrice} variant="primary" size="default">
                  Check Verdict
                </Button>
              </div>

              {customVerdict && (
                <div className={`p-3 rounded-lg border text-xs space-y-1 ${customVerdict.color}`}>
                  <div className="font-bold flex items-center gap-1.5">
                    <span>{customVerdict.badge}:</span> {customVerdict.label}
                  </div>
                  <p className="text-gray-200">{customVerdict.text}</p>
                </div>
              )}
            </div>

            {/* Price History Chart (Rendered via clean SVG) */}
            {productData.snapshots.length > 0 && (
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-naija-muted">
                  📈 Price Trend (Last recorded snapshots)
                </h4>
                <div className="p-4 rounded-xl bg-naija-surface/40 border border-naija-border/30">
                  <div className="flex items-end justify-between gap-1 sm:gap-2 h-24 pt-4">
                    {productData.snapshots.map((snap, idx) => {
                      const avg = parseFloat(snap.avgPrice);
                      const maxHistorical = Math.max(
                        ...productData.snapshots.map((s) => parseFloat(s.avgPrice))
                      );
                      const minHistorical = Math.min(
                        ...productData.snapshots.map((s) => parseFloat(s.avgPrice))
                      );
                      const range = maxHistorical - minHistorical || 1;
                      const heightPercent = Math.max(
                        20,
                        Math.min(100, Math.round(((avg - minHistorical) / range) * 80 + 20))
                      );

                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                          <div
                            className="w-full bg-brand-500/80 rounded-t group-hover:bg-brand-400 transition-all"
                            style={{ height: `${heightPercent}%` }}
                            title={`${snap.date}: ${formatNGN(avg)}`}
                          />
                          <span className="text-[9px] text-naija-muted truncate max-w-[40px]">
                            {snap.date.slice(5)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Market Listings Table */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-naija-muted">
                Available Listings & Verified Sellers
              </h4>

              {productData.listings.length === 0 ? (
                <div className="text-xs text-naija-muted text-center py-4">
                  No active listings found for this item yet. Check back soon.
                </div>
              ) : (
                <div className="divide-y divide-naija-border/40 border border-naija-border/40 rounded-xl overflow-hidden bg-naija-surface/30">
                  {productData.listings.map((l) => (
                    <div
                      key={l.id}
                      className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-naija-surface/70 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">
                            {l.sellerName || 'Market Vendor'}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded uppercase font-semibold bg-naija-surface border border-naija-border text-gray-300">
                            {l.condition}
                          </span>
                          {/* Mandatory PRD Non-Negotiable: Paid placements must be labelled */}
                          {l.isPaid && (
                            <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/40">
                              {l.paidLabel === 'promoted' ? 'Promoted' : 'Sponsored'}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-naija-muted flex items-center gap-3">
                          {l.location && <span>📍 {l.location}</span>}
                          {l.source && <span>Source: {l.source}</span>}
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0">
                        <div className="text-right">
                          <span className="text-base font-black text-brand-400">
                            {formatNGN(l.priceNgn)}
                          </span>
                        </div>

                        {l.url && (
                          <a
                            href={l.affiliateUrl || l.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => handleOutboundClick(l)}
                            className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-500 hover:bg-brand-400 text-white transition-colors min-h-[36px]"
                          >
                            View Store &rarr;
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Suggested quick items when no search active */}
      {!productData && searchResults.length === 0 && (
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-naija-muted text-center">
            Popular Searches
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { slug: 'iphone-15-128gb', title: 'iPhone 15 (128GB)', category: 'Phones' },
              { slug: 'samsung-galaxy-s24', title: 'Samsung Galaxy S24', category: 'Phones' },
              { slug: 'playstation-5-disc', title: 'Sony PlayStation 5', category: 'Gaming' },
              { slug: 'airpods-pro-2', title: 'AirPods Pro (2nd Gen)', category: 'Audio' },
            ].map((item) => (
              <Card
                key={item.slug}
                interactive
                onClick={() => loadProductDetail(item.slug)}
                className="p-4 cursor-pointer flex items-center justify-between"
              >
                <div>
                  <span className="text-[10px] uppercase font-bold text-brand-400 block">
                    {item.category}
                  </span>
                  <span className="text-sm font-bold text-white">{item.title}</span>
                </div>
                <span className="text-xs text-brand-400">&rarr;</span>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Back to other experiences */}
      <div className="pt-6 border-t border-naija-border/40 text-center">
        <Link href="/#boxes">
          <Button variant="secondary" size="default">
            📦 Back to All Boxes
          </Button>
        </Link>
      </div>
    </div>
  );
}
