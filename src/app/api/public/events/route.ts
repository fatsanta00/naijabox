import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { z } from 'zod';

const eventItemSchema = z.object({
  name: z.string().min(1).max(64),
  experience: z.string().max(64).optional(),
  question_id: z.string().uuid().optional(),
  props: z.record(z.unknown()).optional(),
  path: z.string().max(256).optional(),
  timestamp: z.number().optional(),
});

const eventsBatchSchema = z.object({
  session_id: z.string().min(1).max(128),
  device_class: z.enum(['mobile', 'desktop']).optional(),
  referrer_source: z
    .enum(['whatsapp', 'tiktok', 'instagram', 'x', 'facebook', 'google', 'direct', 'other'])
    .optional(),
  events: z.array(eventItemSchema).min(1).max(50),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = eventsBatchSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid event payload' }, { status: 400 });
    }

    const { session_id, device_class, referrer_source, events } = parsed.data;

    // Upsert session record (ADR-007)
    await db
      .insert(schema.sessions)
      .values({
        id: session_id,
        deviceClass: device_class,
        referrerSource: referrer_source,
        lastSeenAt: new Date(),
      })
      .onConflictDoUpdate({
        target: schema.sessions.id,
        set: {
          lastSeenAt: new Date(),
          deviceClass: device_class,
        },
      })
      .catch((err) => {
        // Non-blocking if DB is temporarily unreachable in dev
        console.warn('Session upsert failed:', err);
      });

    // Resolve experienceIds if experience key passed
    const rowsToInsert = events.map((ev) => ({
      name: ev.name,
      sessionId: session_id,
      questionId: ev.question_id,
      props: ev.props || {},
      path: ev.path,
      deviceClass: device_class,
      referrerSource: referrer_source,
    }));

    await db
      .insert(schema.events)
      .values(rowsToInsert)
      .catch((err) => {
        console.warn('Events insert failed:', err);
      });

    return NextResponse.json({ success: true, count: rowsToInsert.length });
  } catch (err) {
    console.error('Analytics batch error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
