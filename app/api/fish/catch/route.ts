import { NextResponse } from 'next/server';
import { getServerDB } from '../../../lib/server-db';

// POST: 钓鱼（随机获取一条鱼，按星级加权）
export async function POST() {
    try {
        const db = getServerDB();
        const allFish = db.prepare('SELECT * FROM fish').all() as any[];

        // 根据星级加权随机（星级越高概率越低）
        const weights: Record<number, number> = {
            1: 40,  // 1星 40%
            2: 30,  // 2星 30%
            3: 20,  // 3星 20%
            4: 8,   // 4星 8%
            5: 2,   // 5星 2%
        };

        const weightedFish = allFish.flatMap(fish =>
            Array(weights[fish.stars] || 1).fill(fish)
        );

        const caughtFish = weightedFish[Math.floor(Math.random() * weightedFish.length)];

        // 记录到 catch_log 并获取记录ID
        const result = db.prepare('INSERT INTO catch_log (fish_id) VALUES (?)').run(caughtFish.id);

        return NextResponse.json({
            fish: {
                ...caughtFish,
                catch_id: result.lastInsertRowid  // 返回catch记录ID用于售卖
            }
        });
    } catch (error) {
        console.error('Failed to catch fish:', error);
        return NextResponse.json({ error: 'Failed to catch fish' }, { status: 500 });
    }
}
