import { NextResponse } from 'next/server';
import { getDB } from '../../../lib/server-db';
import { getUserCoins, updateUserCoins } from '../../../lib/db';

const CROP_TYPES = {
    carrot: { sellPrice: 25 },
    tomato: { sellPrice: 40 },
    wheat: { sellPrice: 55 },
    corn: { sellPrice: 80 },
};

export async function POST(request: Request) {
    try {
        const { cropId } = await request.json();

        const db = getDB();

        // Get crop
        const crop: any = db.prepare(`
      SELECT * FROM farm_crops WHERE id = ? AND user_id = 1
    `).get(cropId);

        if (!crop) {
            return NextResponse.json({ error: 'Crop not found' }, { status: 404 });
        }

        // Check if crop is ready
        const currentTime = Date.now();
        const elapsed = (currentTime - crop.planted_at) / 1000;
        const waterBonus = crop.watered_at ? 0.3 : 0;
        const effectiveElapsed = elapsed * (1 + waterBonus);

        if (effectiveElapsed < crop.growth_time) {
            return NextResponse.json({ error: 'Crop not ready yet' }, { status: 400 });
        }

        const cropConfig = CROP_TYPES[crop.type as keyof typeof CROP_TYPES];
        if (!cropConfig) {
            return NextResponse.json({ error: 'Invalid crop type' }, { status: 400 });
        }

        // Delete crop
        db.prepare(`
      DELETE FROM farm_crops WHERE id = ?
    `).run(cropId);

        // Add coins
        const coins = await getUserCoins();
        await updateUserCoins(coins + cropConfig.sellPrice);

        const crops = db.prepare(`
      SELECT * FROM farm_crops WHERE (status = 'growing' OR status = 'ready') AND user_id = 1
    `).all();

        return NextResponse.json({
            crops,
            coins: coins + cropConfig.sellPrice,
            reward: cropConfig.sellPrice,
        });
    } catch (error) {
        console.error('Harvest crop error:', error);
        return NextResponse.json({ error: 'Failed to harvest crop' }, { status: 500 });
    }
}
