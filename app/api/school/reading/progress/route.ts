import { NextRequest, NextResponse } from 'next/server';
import { getServerDB } from '../../../../lib/server-db';

export async function GET(request: NextRequest) {
    const db = getServerDB();
    const { searchParams } = new URL(request.url);
    const userId = 1; // Default user
    const bookId = searchParams.get('bookId');

    if (!bookId) {
        // Get all progress for user
        const progress = db.prepare('SELECT * FROM reading_progress WHERE user_id = ?').all(userId);
        return NextResponse.json(progress);
    } else {
        // Get progress for specific book
        const progress = db.prepare('SELECT * FROM reading_progress WHERE user_id = ? AND book_id = ?').all(userId, bookId);
        return NextResponse.json(progress);
    }
}

export async function POST(request: NextRequest) {
    const db = getServerDB();
    const { bookId, chapterId } = await request.json();
    const userId = 1; // Default user

    if (!bookId || !chapterId) {
        return NextResponse.json({ error: 'Missing bookId or chapterId' }, { status: 400 });
    }

    try {
        // Record progress
        db.prepare(`
      INSERT OR REPLACE INTO reading_progress (user_id, book_id, chapter_id, completed_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `).run(userId, bookId, chapterId);

        // Add coins reward (e.g., 50 coins per chapter)
        const reward = 50;
        db.prepare('UPDATE users SET coins = coins + ? WHERE id = ?').run(reward, userId);

        return NextResponse.json({ success: true, reward });
    } catch (error) {
        console.error('Error recording reading progress:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
