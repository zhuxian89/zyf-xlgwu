import { NextResponse } from 'next/server';
import { getServerDB } from '../../../lib/server-db';

const GAME_KEYS = ['whac', 'memory', 'rhythm', 'tetris', 'snake', 'puzzle'] as const;
const ENERGY_INTERVAL_SEC = 600; // 10 分钟回复 1 点体力

type GameKey = (typeof GAME_KEYS)[number];

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function refreshStats(db: any) {
  const today = formatDate(new Date());
  const row = db.prepare(`
    SELECT user_id, energy, max_energy, last_energy_at, daily_play_seconds, daily_limit_seconds, last_reset_date
    FROM game_stats WHERE user_id = 1
  `).get() as any;

  if (!row) {
    db.prepare(`
      INSERT OR IGNORE INTO game_stats (user_id, energy, max_energy, daily_limit_seconds)
      VALUES (1, 5, 5, 1800)
    `).run();
    return refreshStats(db);
  }

  let { energy, max_energy, last_energy_at, daily_play_seconds, daily_limit_seconds, last_reset_date } = row;
  const now = new Date();
  const lastEnergyTime = last_energy_at ? new Date(last_energy_at) : now;

  // 每日重置时长
  if (last_reset_date !== today) {
    daily_play_seconds = 0;
    last_reset_date = today;
  }

  // 体力回复
  if (energy < max_energy) {
    const diffSec = Math.floor((now.getTime() - lastEnergyTime.getTime()) / 1000);
    if (diffSec > 0) {
      const gained = Math.min(max_energy - energy, Math.floor(diffSec / ENERGY_INTERVAL_SEC));
      if (gained > 0) {
        energy += gained;
        last_energy_at = now.toISOString();
      }
    }
  }

  db.prepare(`
    UPDATE game_stats
    SET energy = ?, last_energy_at = ?, daily_play_seconds = ?, last_reset_date = ?
    WHERE user_id = 1
  `).run(energy, last_energy_at || now.toISOString(), daily_play_seconds, last_reset_date);

  return {
    user_id: 1,
    energy,
    max_energy,
    last_energy_at: last_energy_at || now.toISOString(),
    daily_play_seconds,
    daily_limit_seconds,
    last_reset_date,
  };
}

function getLeaderboards(db: any) {
  const leaderboards: Record<GameKey, Array<{ name: string; best_score: number }>> = {
    whac: [],
    memory: [],
    rhythm: [],
    tetris: [],
    snake: [],
    puzzle: [],
  };

  for (const game of GAME_KEYS) {
    leaderboards[game] = db
      .prepare(
        `
          SELECT users.username as name, best_score
          FROM game_scores
          JOIN users ON users.id = game_scores.user_id
          WHERE game = ?
          ORDER BY best_score DESC, last_played ASC
          LIMIT 3
        `,
      )
      .all(game) as any[];
  }

  return leaderboards;
}

export async function GET() {
  try {
    const db = getServerDB();
    const stats = refreshStats(db);

    const myScores = db
      .prepare(`SELECT game, best_score, last_score, last_played FROM game_scores WHERE user_id = 1`)
      .all() as any[];

    const scoreMap: Record<GameKey, { best_score: number; last_score: number; last_played: string | null }> = {
      whac: { best_score: 0, last_score: 0, last_played: null },
      memory: { best_score: 0, last_score: 0, last_played: null },
      rhythm: { best_score: 0, last_score: 0, last_played: null },
      tetris: { best_score: 0, last_score: 0, last_played: null },
      snake: { best_score: 0, last_score: 0, last_played: null },
      puzzle: { best_score: 0, last_score: 0, last_played: null },
    };

    for (const row of myScores) {
      if (GAME_KEYS.includes(row.game)) {
        scoreMap[row.game as GameKey] = {
          best_score: row.best_score ?? 0,
          last_score: row.last_score ?? 0,
          last_played: row.last_played ?? null,
        };
      }
    }

    const now = new Date();
    const lastEnergyTime = stats.last_energy_at ? new Date(stats.last_energy_at) : now;
    const diffSec = Math.max(0, Math.floor((now.getTime() - lastEnergyTime.getTime()) / 1000));
    const nextEnergySeconds =
      stats.energy >= stats.max_energy ? 0 : Math.max(0, ENERGY_INTERVAL_SEC - (diffSec % ENERGY_INTERVAL_SEC));

    return NextResponse.json({
      energy: stats.energy,
      maxEnergy: stats.max_energy,
      nextEnergySeconds,
      dailyUsed: stats.daily_play_seconds,
      dailyLimit: stats.daily_limit_seconds,
      scores: scoreMap,
      leaderboards: getLeaderboards(db),
    });
  } catch (error) {
    console.error('Failed to get game stats:', error);
    return NextResponse.json({ error: 'Failed to get game stats' }, { status: 500 });
  }
}
