import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { products, listings, sellers, priceSnapshots } from '@/server/db/schema';
import { eq, and, asc, desc } from 'drizzle-orm';

/** GET /api/public/pricecheck/products/[slug] */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.slug, slug))
    .limit(1);

  if (!product) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Active listings joined with seller
  const listingRows = await db
    .select({
      id: listings.id,
      priceNgn: listings.priceNgn,
      condition: listings.condition,
      location: listings.location,
      url: listings.url,
      affiliateUrl: listings.affiliateUrl,
      isPaid: listings.isPaid,
      paidLabel: listings.paidLabel,
      source: listings.source,
      lastSeenAt: listings.lastSeenAt,
      sellerName: sellers.name,
      sellerUrl: sellers.url,
    })
    .from(listings)
    .leftJoin(sellers, eq(listings.sellerId, sellers.id))
    .where(and(eq(listings.productId, product.id), eq(listings.isActive, true)))
    .orderBy(asc(listings.priceNgn));

  // Price history snapshots (last 12)
  const snapshots = await db
    .select({
      date: priceSnapshots.date,
      avgPrice: priceSnapshots.avgPrice,
      minPrice: priceSnapshots.minPrice,
      maxPrice: priceSnapshots.maxPrice,
      listingCount: priceSnapshots.listingCount,
    })
    .from(priceSnapshots)
    .where(eq(priceSnapshots.productId, product.id))
    .orderBy(desc(priceSnapshots.date))
    .limit(12);

  // "Good price" verdict — compare current min to 30-day avg
  let goodPriceVerdict: string | null = null;
  const lowestListing = listingRows[0];
  const recentSnap = snapshots[0];
  const olderSnap = snapshots.find((_, i) => i >= 3); // ~30 days ago

  if (lowestListing && olderSnap) {
    const currentMin = lowestListing.priceNgn;
    const historicAvg = Number(olderSnap.avgPrice);
    const diffPct = ((currentMin - historicAvg) / historicAvg) * 100;

    if (diffPct <= -10) goodPriceVerdict = 'very_good';
    else if (diffPct <= -3) goodPriceVerdict = 'good';
    else if (diffPct <= 5) goodPriceVerdict = 'fair';
    else if (diffPct <= 15) goodPriceVerdict = 'high';
    else goodPriceVerdict = 'very_high';
  }

  return NextResponse.json({
    product,
    listings: listingRows,
    snapshots: snapshots.reverse(), // chronological for chart
    goodPriceVerdict,
    lowestPrice: lowestListing?.priceNgn ?? null,
    currentAvgPrice: recentSnap ? Number(recentSnap.avgPrice) : null,
  });
}
