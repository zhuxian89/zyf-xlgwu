import { NextResponse } from 'next/server';
import { getDB } from '../../../lib/server-db';

export async function POST(request: Request) {
    try {
        const { cropId } = await request.json();

        const db = getDB();

        // Get crop
        const crop = db.prepare(`
      SELECT * FROM farm_crops WHERE id = ? AND user_id = 1
    `).get(cropId);

        if (!crop) {
            return NextResponse.json({ error: 'Crop not found' }, { status: 404 });
        }

        // Update watered_at timestamp
        db.prepare(`
      UPDATE farm_crops SET watered_at = ? WHERE id = ?
    `).run(Date.now(), cropId);

        const crops = db.prepare(`
      SELECT * FROM farm_crops WHERE (status = 'growing' OR status = 'ready') AND user_id = 1
    `).all();

        return NextResponse.json({ crops });
    } catch (error) {
        console.error('Water crop error:', error);
        return NextResponse.json({ error: 'Failed to water crop' }, { status: 500 });
    }
}
