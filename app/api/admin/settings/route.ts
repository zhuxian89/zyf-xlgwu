import { NextResponse } from 'next/server';
import { getServerDB } from '../../../lib/server-db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { key, value } = body;
        const db = getServerDB();

        db.prepare('INSERT INTO app_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?').run(key, value, value);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Settings update error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET() {
    try {
        const db = getServerDB();
        const settings = db.prepare('SELECT key, value FROM app_settings').all() as { key: string, value: string }[];
        const settingsMap = settings.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {});
        return NextResponse.json(settingsMap);
    } catch (error) {
        console.error('Settings fetch error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
