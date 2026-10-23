import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { products } from '@/server/db/schema';
import { desc } from 'drizzle-orm';

/** GET /api/admin/pricecheck/products — list all products */
export async function GET() {
  const rows = await db
    .select()
    .from(products)
    .orderBy(desc(products.updatedAt));

  return NextResponse.json({ products: rows });
}

/** POST /api/admin/pricecheck/products — create a product */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      slug: string;
      name: string;
      brand?: string;
      category?: string;
      variant?: string;
      imageUrl?: string;
      aliases?: string[];
    };

    if (!body.slug || !body.name) {
      return NextResponse.json({ error: 'slug and name are required' }, { status: 400 });
    }

    const [product] = await db
      .insert(products)
      .values({
        slug: body.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        name: body.name.trim(),
        brand: body.brand?.trim() ?? null,
        category: body.category?.trim() ?? null,
        variant: body.variant?.trim() ?? null,
        imageUrl: body.imageUrl?.trim() ?? null,
        aliases: body.aliases ?? [],
      })
      .returning();

    return NextResponse.json({ product }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    if (msg.includes('unique')) {
      return NextResponse.json({ error: 'A product with this slug already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
