import { NextResponse } from 'next/server';
import { getServerDB } from '../../../lib/server-db';

const GAME_KEYS = ['whac', 'memory', 'rhythm', 'tetris', 'snake', 'puzzle'] as const;
const ENERGY_INTERVAL_SEC = 600;
const DAILY_FALLBACK_LIMIT = 1800; // 30min 默认每日限制

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
      VALUES (1, 5, 5, ?)
    `).run(DAILY_FALLBACK_LIMIT);
    return refreshStats(db);
  }

  let { energy, max_energy, last_energy_at, daily_play_seconds, daily_limit_seconds, last_reset_date } = row;
  const now = new Date();
  const lastEnergyTime = last_energy_at ? new Date(last_energy_at) : now;

  if (last_reset_date !== today) {
    daily_play_seconds = 0;
    last_reset_date = today;
  }

  if (energy < max_energy) {
    const diffSec = Math.floor((now.getTime() - lastEnergyTime.getTime()) / 1000);
    const gained = Math.min(max_energy - energy, Math.floor(diffSec / ENERGY_INTERVAL_SEC));
    if (gained > 0) {
      energy += gained;
      last_energy_at = now.toISOString();
    }
  }

  db.prepare(
    `UPDATE game_stats SET energy = ?, last_energy_at = ?, daily_play_seconds = ?, last_reset_date = ? WHERE user_id = 1`,
  ).run(energy, last_energy_at || now.toISOString(), daily_play_seconds, last_reset_date);

  return {
    energy,
    max_energy,
    daily_play_seconds,
    daily_limit_seconds,
    last_reset_date,
    last_energy_at: last_energy_at || now.toISOString(),
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { game, score, durationSec = 60 } = body as {
      game?: GameKey;
      score?: number;
      durationSec?: number;
    };

    if (!game || !GAME_KEYS.includes(game)) {
      return NextResponse.json({ error: 'Invalid game' }, { status: 400 });
    }
    if (typeof score !== 'number' || Number.isNaN(score) || score < 0) {
      return NextResponse.json({ error: 'Invalid score' }, { status: 400 });
    }

    const db = getServerDB();
    let stats = refreshStats(db);

    const duration = Math.max(1, Math.min(900, Math.round(durationSec)));
    const dailyLimit = stats.daily_limit_seconds ?? DAILY_FALLBACK_LIMIT;

    if (stats.energy <= 0) {
      const nextEnergySeconds =
        stats.max_energy <= stats.energy
          ? 0
          : Math.max(
              0,
              ENERGY_INTERVAL_SEC -
                Math.floor((new Date().getTime() - new Date(stats.last_energy_at).getTime()) / 1000) %
                  ENERGY_INTERVAL_SEC,
            );
      return NextResponse.json(
        { error: '体力不足，请等待恢复', energy: stats.energy, nextEnergySeconds },
        { status: 400 },
      );
    }

    if (stats.daily_play_seconds + duration > dailyLimit) {
      return NextResponse.json(
        { error: '已达到当日游戏时长上限', dailyUsed: stats.daily_play_seconds, dailyLimit },
        { status: 403 },
      );
    }

    const now = new Date();
    const today = formatDate(now);

    // 消耗体力并记录时长
    stats.energy -= 1;
    stats.daily_play_seconds += duration;
    db.prepare(
      `UPDATE game_stats SET energy = ?, last_energy_at = ?, daily_play_seconds = ?, last_reset_date = ? WHERE user_id = 1`,
    ).run(stats.energy, now.toISOString(), stats.daily_play_seconds, today);

    const scoreRow =
      (db
        .prepare(`SELECT best_score, last_score, last_bonus_date FROM game_scores WHERE user_id = 1 AND game = ?`)
        .get(game) as any) || {};

    const previousBest = scoreRow?.best_score ?? 0;
    const bestScore = Math.max(previousBest, score);
    const bestUpdated = bestScore !== previousBest;

    const baseReward = Math.max(1, Math.floor(score / 5));
    const comboReward = score >= 50 ? 10 : 0;
    const firstWinBonus = score > 0 && scoreRow?.last_bonus_date !== today ? 20 : 0;
    const rewardCoins = Math.min(150, baseReward + comboReward + firstWinBonus);

    const coinsRow = db.prepare('SELECT coins FROM users WHERE id = 1').get() as { coins: number } | undefined;
    const newCoins = (coinsRow?.coins || 0) + rewardCoins;
    db.prepare('UPDATE users SET coins = ? WHERE id = 1').run(newCoins);

    db.prepare(
      `
        INSERT INTO game_scores (user_id, game, best_score, last_score, last_played, last_bonus_date)
        VALUES (1, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id, game) DO UPDATE SET
          best_score = MAX(game_scores.best_score, excluded.best_score),
          last_score = excluded.last_score,
          last_played = excluded.last_played,
          last_bonus_date = COALESCE(excluded.last_bonus_date, game_scores.last_bonus_date)
      `,
    ).run(game, bestScore, score, now.toISOString(), firstWinBonus ? today : scoreRow?.last_bonus_date ?? null);

    const leaderboard = db
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

    return NextResponse.json({
      success: true,
      game,
      score,
      bestScore,
      bestUpdated,
      rewardCoins,
      coins: newCoins,
      energy: stats.energy,
      maxEnergy: stats.max_energy,
      dailyUsed: stats.daily_play_seconds,
      dailyLimit,
      leaderboard,
      nextEnergySeconds: ENERGY_INTERVAL_SEC,
    });
  } catch (error) {
    console.error('Failed to save game score:', error);
    return NextResponse.json({ error: 'Failed to save game score' }, { status: 500 });
  }
}
