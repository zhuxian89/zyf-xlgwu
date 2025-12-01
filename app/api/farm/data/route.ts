import { NextResponse } from 'next/server';
import { getDB } from '../../../lib/server-db';
import { getUserCoins } from '../../../lib/db';

export async function GET() {
    try {
        const db = getDB();
        const coins = await getUserCoins();

        const crops = db.prepare(`
      SELECT * FROM farm_crops WHERE (status = 'growing' OR status = 'ready') AND user_id = 1
    `).all();

        const animals = db.prepare(`
      SELECT * FROM farm_animals WHERE user_id = 1
    `).all();

        return NextResponse.json({
            coins,
            crops,
            animals,
        });
    } catch (error) {
        console.error('Farm data error:', error);
        return NextResponse.json({ error: 'Failed to load farm data' }, { status: 500 });
    }
}
