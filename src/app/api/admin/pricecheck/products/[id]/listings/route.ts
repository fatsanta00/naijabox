import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { listings, sellers, products } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

/** POST /api/admin/pricecheck/products/[id]/listings — add a listing to a product */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: productId } = await params;

  // Verify product exists
  const [product] = await db.select({ id: products.id }).from(products).where(eq(products.id, productId)).limit(1);
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

  const body = await req.json() as {
    priceNgn: number;
    condition?: 'new' | 'used' | 'refurbished';
    sellerName?: string;
    location?: string;
    url?: string;
    affiliateUrl?: string;
    isPaid?: boolean;
    paidLabel?: 'sponsored' | 'promoted';
    source?: string;
  };

  if (!body.priceNgn || typeof body.priceNgn !== 'number' || body.priceNgn <= 0) {
    return NextResponse.json({ error: 'priceNgn must be a positive number' }, { status: 400 });
  }

  // Find or create seller if name given
  let sellerId: string | null = null;
  if (body.sellerName?.trim()) {
    const existing = await db
      .select({ id: sellers.id })
      .from(sellers)
      .where(eq(sellers.name, body.sellerName.trim()))
      .limit(1);

    if (existing[0]) {
      sellerId = existing[0].id;
    } else {
      const [newSeller] = await db
        .insert(sellers)
        .values({ name: body.sellerName.trim(), location: body.location ?? null })
        .returning({ id: sellers.id });
      sellerId = newSeller.id;
    }
  }

  const [listing] = await db
    .insert(listings)
    .values({
      productId,
      sellerId: sellerId ?? undefined,
      priceNgn: Math.round(body.priceNgn),
      condition: body.condition ?? 'new',
      location: body.location ?? null,
      url: body.url ?? null,
      affiliateUrl: body.affiliateUrl ?? null,
      isPaid: body.isPaid ?? false,
      paidLabel: body.isPaid ? (body.paidLabel ?? 'sponsored') : null,
      source: body.source ?? 'admin',
      isActive: true,
    })
    .returning();

  return NextResponse.json({ listing }, { status: 201 });
}

/** DELETE /api/admin/pricecheck/products/[id]/listings?listingId=... */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await params; // ensure id is resolved
  const { searchParams } = new URL(req.url);
  const listingId = searchParams.get('listingId');
  if (!listingId) return NextResponse.json({ error: 'listingId required' }, { status: 400 });

  await db.update(listings).set({ isActive: false }).where(eq(listings.id, listingId));
  return NextResponse.json({ ok: true });
}
