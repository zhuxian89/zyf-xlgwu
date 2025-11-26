import { NextResponse } from 'next/server';
import { getServerDB } from '../../../lib/server-db';

// GET: 获取钓鱼记录
export async function GET() {
    try {
        const db = getServerDB();
        const catches = db.prepare(`
      SELECT c.id as catch_id, c.fish_id, c.caught_at, c.sold,
             f.id, f.name, f.name_en, f.stars, f.sell_price, f.image_url, f.emoji, f.description
      FROM catch_log c 
      JOIN fish f ON c.fish_id = f.id 
      ORDER BY c.caught_at DESC
    `).all();

        return NextResponse.json({ catches });
    } catch (error) {
        console.error('Failed to get catch log:', error);
        return NextResponse.json({ error: 'Failed to get catch log' }, { status: 500 });
    }
}
