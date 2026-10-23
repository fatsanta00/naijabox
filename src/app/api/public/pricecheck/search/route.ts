import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { products, listings } from '@/server/db/schema';
import { ilike, or, eq, and } from 'drizzle-orm';

/** GET /api/public/pricecheck/search?q=... */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') ?? '').trim();

  if (q.length < 2) {
    return NextResponse.json({ products: [] });
  }

  const pattern = `%${q}%`;

  const rows = await db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      brand: products.brand,
      category: products.category,
      variant: products.variant,
      imageUrl: products.imageUrl,
    })
    .from(products)
    .where(
      or(
        ilike(products.name, pattern),
        ilike(products.brand, pattern),
        ilike(products.category, pattern),
      ),
    )
    .limit(20);

  // Get cheapest active listing price per product
  const productIds = rows.map((r) => r.id);
  const priceMap: Record<string, number> = {};

  if (productIds.length > 0) {
    const activeListings = await db
      .select({
        productId: listings.productId,
        priceNgn: listings.priceNgn,
      })
      .from(listings)
      .where(
        and(
          eq(listings.isActive, true),
          or(...productIds.map((id) => eq(listings.productId, id))),
        ),
      );

    for (const l of activeListings) {
      if (priceMap[l.productId] === undefined || l.priceNgn < priceMap[l.productId]) {
        priceMap[l.productId] = l.priceNgn;
      }
    }
  }

  const resultsWithPrice = rows.map((r) => ({
    ...r,
    lowestPriceNgn: priceMap[r.id] ?? null,
  }));

  return NextResponse.json({ products: resultsWithPrice, queryLength: q.length });
}
