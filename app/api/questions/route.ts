import { NextResponse } from 'next/server';
import { getServerDB } from '../../lib/server-db';

// GET: 获取所有题目
export async function GET() {
    try {
        const db = getServerDB();
        const questions = db.prepare('SELECT * FROM questions WHERE is_active = 1').all();

        return NextResponse.json({ questions });
    } catch (error) {
        console.error('Failed to get questions:', error);
        return NextResponse.json({ error: 'Failed to get questions' }, { status: 500 });
    }
}

// POST: 添加新题目
export async function POST(request: Request) {
    try {
        const { subject, content, answer, reward } = await request.json();

        const db = getServerDB();
        const result = db.prepare(
            'INSERT INTO questions (subject, content, answer, reward) VALUES (?, ?, ?, ?)'
        ).run(subject, content, answer, reward);

        return NextResponse.json({ success: true, id: result.lastInsertRowid });
    } catch (error) {
        console.error('Failed to add question:', error);
        return NextResponse.json({ error: 'Failed to add question' }, { status: 500 });
    }
}
