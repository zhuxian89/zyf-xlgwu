import { NextResponse } from 'next/server';
import { getServerDB } from '../../../lib/server-db';

export async function GET() {
    try {
        const db = getServerDB();
        const userId = 1; // Default user

        const user = db.prepare('SELECT coins FROM users WHERE id = ?').get(userId) as { coins: number };
        const stats = db.prepare('SELECT energy, max_energy, daily_play_seconds, daily_limit_seconds FROM game_stats WHERE user_id = ?').get(userId) as any;

        return NextResponse.json({
            coins: user?.coins || 0,
            energy: stats?.energy || 0,
            max_energy: stats?.max_energy || 5,
            daily_play_seconds: stats?.daily_play_seconds || 0,
            daily_limit_seconds: stats?.daily_limit_seconds || 1800,
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
