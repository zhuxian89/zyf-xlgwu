import { NextResponse } from 'next/server';
import { getServerDB } from '../../../lib/server-db';

export async function POST(request: Request) {
    try {
        const { fishId } = await request.json();

        if (!fishId) {
            return NextResponse.json({ error: 'Fish ID is required' }, { status: 400 });
        }

        const db = await getServerDB();

        // Get the fish info to know its sell price
        const fish = db.prepare('SELECT * FROM fish WHERE id = ?').get(fishId) as any;
        if (!fish) {
            return NextResponse.json({ error: 'Fish not found' }, { status: 404 });
        }

        // Delete one catch record for this fish (FIFO - oldest first)
        const deletedCatch = db.prepare(`
            DELETE FROM catch_log 
            WHERE id = (
                SELECT id FROM catch_log 
                WHERE fish_id = ? 
                ORDER BY caught_at ASC 
                LIMIT 1
            )
        `).run(fishId);

        if (deletedCatch.changes === 0) {
            return NextResponse.json({ error: 'No fish to sell' }, { status: 400 });
        }

        // Update user coins
        const currentCoins = db.prepare('SELECT coins FROM users WHERE id = 1').get() as any;
        const newCoins = (currentCoins?.coins || 0) + fish.sell_price;

        db.prepare('UPDATE users SET coins = ? WHERE id = 1').run(newCoins);

        return NextResponse.json({
            success: true,
            coins: newCoins,
            sellPrice: fish.sell_price
        });
    } catch (error) {
        console.error('Sell fish error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
