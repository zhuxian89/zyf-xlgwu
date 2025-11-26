import { NextResponse } from 'next/server';
import { getServerDB } from '../../lib/server-db';

// GET: 获取金币
export async function GET() {
    try {
        const db = getServerDB();
        const user = db.prepare('SELECT coins FROM users WHERE id = 1').get() as { coins: number } | undefined;

        return NextResponse.json({ coins: user?.coins || 100 });
    } catch (error) {
        console.error('Failed to get coins:', error);
        return NextResponse.json({ error: 'Failed to get coins' }, { status: 500 });
    }
}

// POST: 更新金币
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const db = getServerDB();

        // 支持两种模式：amount（增量）或 coins（直接设置）
        if ('amount' in body) {
            // 增量模式：获取当前金币并加上amount
            const user = db.prepare('SELECT coins FROM users WHERE id = 1').get() as { coins: number } | undefined;
            const currentCoins = user?.coins || 0;
            const newCoins = currentCoins + body.amount;
            db.prepare('UPDATE users SET coins = ? WHERE id = 1').run(newCoins);
            return NextResponse.json({ success: true, coins: newCoins });
        } else if ('coins' in body) {
            // 直接设置模式
            db.prepare('UPDATE users SET coins = ? WHERE id = 1').run(body.coins);
            return NextResponse.json({ success: true, coins: body.coins });
        } else {
            return NextResponse.json({ error: 'Missing amount or coins parameter' }, { status: 400 });
        }
    } catch (error) {
        console.error('Failed to update coins:', error);
        return NextResponse.json({ error: 'Failed to update coins' }, { status: 500 });
    }
}
