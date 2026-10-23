import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { products, listings, sellers } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

/**
 * POST /api/admin/pricecheck/import
 * Accepts CSV string or JSON array of listings:
 * format:
 * product_slug,product_name,category,brand,price_ngn,condition,seller_name,location,url,is_paid,paid_label
 */
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let rows: Record<string, string>[] = [];

    if (contentType.includes('application/json')) {
      const body = await req.json();
      rows = Array.isArray(body) ? body : body.rows || [];
    } else {
      // Parse plain CSV text
      const csvText = await req.text();
      const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length <= 1) {
        return NextResponse.json({ error: 'Empty CSV or header only' }, { status: 400 });
      }

      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map((v) => v.trim());
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => {
          row[h] = values[idx] || '';
        });
        rows.push(row);
      }
    }

    let importedCount = 0;
    const sellerCache = new Map<string, string>();

    for (const row of rows) {
      const slug = (row.product_slug || row.slug || '').trim().toLowerCase();
      const name = (row.product_name || row.name || '').trim();
      const priceStr = row.price_ngn || row.price || '0';
      const priceNgn = parseInt(priceStr, 10);

      if (!slug || !name || isNaN(priceNgn) || priceNgn <= 0) {
        continue;
      }

      // Upsert product
      let [product] = await db
        .select({ id: products.id })
        .from(products)
        .where(eq(products.slug, slug))
        .limit(1);

      if (!product) {
        const [insertedProduct] = await db
          .insert(products)
          .values({
            slug,
            name,
            category: row.category || null,
            brand: row.brand || null,
          })
          .returning({ id: products.id });
        product = insertedProduct;
      }

      // Handle seller
      const sellerName = (row.seller_name || row.seller || '').trim();
      let sellerId: string | null = null;

      if (sellerName) {
        if (sellerCache.has(sellerName)) {
          sellerId = sellerCache.get(sellerName)!;
        } else {
          const [existingSeller] = await db
            .select({ id: sellers.id })
            .from(sellers)
            .where(eq(sellers.name, sellerName))
            .limit(1);

          if (existingSeller) {
            sellerId = existingSeller.id;
          } else {
            const [newSeller] = await db
              .insert(sellers)
              .values({
                name: sellerName,
                location: row.location || null,
              })
              .returning({ id: sellers.id });
            sellerId = newSeller.id;
          }
          sellerCache.set(sellerName, sellerId);
        }
      }

      const condition =
        row.condition === 'used' || row.condition === 'refurbished' ? row.condition : 'new';
      const isPaid = row.is_paid === 'true' || row.is_paid === '1';
      const paidLabel = isPaid
        ? row.paid_label === 'promoted'
          ? 'promoted'
          : 'sponsored'
        : null;

      await db.insert(listings).values({
        productId: product.id,
        sellerId: sellerId ?? undefined,
        priceNgn,
        condition,
        location: row.location || null,
        url: row.url || null,
        isPaid,
        paidLabel: paidLabel as 'sponsored' | 'promoted' | null,
        source: 'csv_import',
        isActive: true,
      });

      importedCount++;
    }

    return NextResponse.json({
      success: true,
      importedCount,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Import failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
