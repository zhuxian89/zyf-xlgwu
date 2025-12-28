import { NextResponse } from 'next/server';
import { getDB } from '../../../lib/server-db';
import { getUserCoins, updateUserCoins } from '../../../lib/db';

const CROP_TYPES = {
    carrot: { price: 5, growthTime: 20, sellPrice: 15 },
    tomato: { price: 8, growthTime: 30, sellPrice: 22 },
    strawberry: { price: 12, growthTime: 40, sellPrice: 35 },
    corn: { price: 15, growthTime: 50, sellPrice: 42 },
    wheat: { price: 10, growthTime: 60, sellPrice: 28 },
    watermelon: { price: 25, growthTime: 90, sellPrice: 70 },
    grape: { price: 20, growthTime: 80, sellPrice: 55 },
    pumpkin: { price: 30, growthTime: 100, sellPrice: 85 },
    eggplant: { price: 10, growthTime: 45, sellPrice: 30 },
    sunflower: { price: 18, growthTime: 70, sellPrice: 50 },
};

export async function POST(request: Request) {
    try {
        const { type, x, y } = await request.json();

        if (!CROP_TYPES[type as keyof typeof CROP_TYPES]) {
            return NextResponse.json({ error: 'Invalid crop type' }, { status: 400 });
        }

        const cropConfig = CROP_TYPES[type as keyof typeof CROP_TYPES];
        const coins = await getUserCoins();

        if (coins < cropConfig.price) {
            return NextResponse.json({ error: 'Not enough coins' }, { status: 400 });
        }

        const db = getDB();

        // Check if slot is occupied
        const existing = db.prepare(`
      SELECT id FROM farm_crops WHERE x = ? AND y = ? AND user_id = 1
    `).get(x, y);

        if (existing) {
            return NextResponse.json({ error: 'Slot already occupied' }, { status: 400 });
        }

        // Plant crop
        const cropId = `crop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const plantedAt = Date.now();

        db.prepare(`
      INSERT INTO farm_crops (id, user_id, type, planted_at, growth_time, x, y, status)
      VALUES (?, 1, ?, ?, ?, ?, ?, 'growing')
    `).run(cropId, type, plantedAt, cropConfig.growthTime, x, y);

        // Deduct coins
        await updateUserCoins(coins - cropConfig.price);

        const crops = db.prepare(`
      SELECT * FROM farm_crops WHERE (status = 'growing' OR status = 'ready') AND user_id = 1
    `).all();

        return NextResponse.json({
            crops,
            coins: coins - cropConfig.price,
        });
    } catch (error) {
        console.error('Plant crop error:', error);
        return NextResponse.json({ error: 'Failed to plant crop' }, { status: 500 });
    }
}
