import { NextResponse } from 'next/server';
import { getServerDB } from '../../../lib/server-db';

// POST: 售卖鱼（获得金币）
export async function POST(request: Request) {
    try {
        const { catchId } = await request.json();

        const db = getServerDB();

        // 获取这条鱼的信息
        const catchRecord = db.prepare(`
      SELECT c.id, c.fish_id, c.sold, f.sell_price 
      FROM catch_log c 
      JOIN fish f ON c.fish_id = f.id 
      WHERE c.id = ?
    `).get(catchId) as any;

        if (!catchRecord) {
            return NextResponse.json({ error: 'Fish not found' }, { status: 404 });
        }

        if (catchRecord.sold) {
            return NextResponse.json({ error: 'Fish already sold' }, { status: 400 });
        }

        // 标记为已售出
        db.prepare('UPDATE catch_log SET sold = 1 WHERE id = ?').run(catchId);

        // 增加用户金币
        db.prepare('UPDATE users SET coins = coins + ? WHERE id = 1').run(catchRecord.sell_price);

        // 获取新的金币数
        const user = db.prepare('SELECT coins FROM users WHERE id = 1').get() as { coins: number };

        return NextResponse.json({
            success: true,
            earned: catchRecord.sell_price,
            newCoins: user.coins
        });
    } catch (error) {
        console.error('Failed to sell fish:', error);
        return NextResponse.json({ error: 'Failed to sell fish' }, { status: 500 });
    }
}
