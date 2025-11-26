import { NextResponse } from 'next/server';
import { getServerDB } from '../../../lib/server-db';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = 1; // Default user
        const db = getServerDB();

        // Get ticket price
        const priceRow = db.prepare("SELECT value FROM app_settings WHERE key = 'cinema_ticket_price'").get() as { value: string };
        const price = parseInt(priceRow?.value || '50');

        // Get unlocked animes (valid for 15 minutes)
        const unlocks = db.prepare(`
      SELECT anime_id 
      FROM cinema_unlocks 
      WHERE user_id = ? 
      AND unlocked_at > datetime('now', '-15 minutes')
    `).all(userId) as { anime_id: string }[];
        const unlockedIds = unlocks.map(u => u.anime_id);

        return NextResponse.json({ price, unlockedIds });
    } catch (error) {
        console.error('Cinema status error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { animeId } = body;
        const userId = 1; // Default user
        const db = getServerDB();

        // Get price
        const priceRow = db.prepare("SELECT value FROM app_settings WHERE key = 'cinema_ticket_price'").get() as { value: string };
        const price = parseInt(priceRow?.value || '50');

        // Check user coins
        const user = db.prepare('SELECT coins FROM users WHERE id = ?').get(userId) as { coins: number };
        if (!user || user.coins < price) {
            return NextResponse.json({ error: '金币不足' }, { status: 400 });
        }

        // Transaction: Deduct coins and unlock (REPLACE to update timestamp)
        const unlockTx = db.transaction(() => {
            db.prepare('UPDATE users SET coins = coins - ? WHERE id = ?').run(price, userId);
            db.prepare('INSERT OR REPLACE INTO cinema_unlocks (user_id, anime_id, unlocked_at) VALUES (?, ?, CURRENT_TIMESTAMP)').run(userId, animeId);
        });

        unlockTx();

        return NextResponse.json({ success: true, newCoins: user.coins - price });
    } catch (error) {
        console.error('Cinema unlock error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
