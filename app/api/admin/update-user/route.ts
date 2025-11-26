import { NextResponse } from 'next/server';
import { getServerDB } from '../../../lib/server-db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId = 1, action, amount } = body; // Default to user 1 for now as it's single player mostly

        const db = getServerDB();

        if (action === 'add_coins') {
            db.prepare('UPDATE users SET coins = coins + ? WHERE id = ?').run(amount, userId);
        } else if (action === 'add_energy') {
            db.prepare('UPDATE game_stats SET energy = energy + ? WHERE user_id = ?').run(amount, userId);
        } else if (action === 'add_time') {
            // Add minutes (converted to seconds) to the limit
            db.prepare('UPDATE game_stats SET daily_limit_seconds = daily_limit_seconds + ? WHERE user_id = ?').run(amount * 60, userId);
        } else if (action === 'reset_time') {
            db.prepare('UPDATE game_stats SET daily_play_seconds = 0 WHERE user_id = ?').run(userId);
        } else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Admin update error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
