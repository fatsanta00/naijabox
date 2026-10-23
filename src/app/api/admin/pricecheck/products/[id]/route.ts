import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { products, listings, sellers } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

/** GET /api/admin/pricecheck/products/[id] — get product with its listings */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const productListings = await db
    .select({
      id: listings.id,
      priceNgn: listings.priceNgn,
      condition: listings.condition,
      location: listings.location,
      url: listings.url,
      isPaid: listings.isPaid,
      paidLabel: listings.paidLabel,
      source: listings.source,
      isActive: listings.isActive,
      lastSeenAt: listings.lastSeenAt,
      sellerName: sellers.name,
    })
    .from(listings)
    .leftJoin(sellers, eq(listings.sellerId, sellers.id))
    .where(eq(listings.productId, id));

  return NextResponse.json({ product, listings: productListings });
}

/** PATCH /api/admin/pricecheck/products/[id] — update product fields */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json() as Partial<{
    name: string;
    brand: string;
    category: string;
    variant: string;
    imageUrl: string;
    aliases: string[];
  }>;

  const [updated] = await db
    .update(products)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(products.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ product: updated });
}

/** DELETE /api/admin/pricecheck/products/[id] — hard delete (no content references) */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await db.delete(products).where(eq(products.id, id));
  return NextResponse.json({ ok: true });
}
