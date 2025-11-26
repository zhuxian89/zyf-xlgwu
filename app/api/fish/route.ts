import { NextResponse } from 'next/server';
import { getServerDB } from '../../lib/server-db';

// GET: 获取所有鱼类
export async function GET() {
    try {
        const db = getServerDB();
        const fish = db.prepare('SELECT * FROM fish').all();

        return NextResponse.json({ fish });
    } catch (error) {
        console.error('Failed to get fish:', error);
        return NextResponse.json({ error: 'Failed to get fish' }, { status: 500 });
    }
}
