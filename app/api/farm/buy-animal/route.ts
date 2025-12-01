import { NextResponse } from 'next/server';
import { getDB } from '../../../lib/server-db';
import { getUserCoins, updateUserCoins } from '../../../lib/db';

const ANIMAL_TYPES = {
    chicken: { price: 50, productionTime: 60, sellPrice: 15 },
    cow: { price: 100, productionTime: 120, sellPrice: 30 },
    sheep: { price: 80, productionTime: 90, sellPrice: 25 },
};

export async function POST(request: Request) {
    try {
        const { type } = await request.json();

        if (!ANIMAL_TYPES[type as keyof typeof ANIMAL_TYPES]) {
            return NextResponse.json({ error: 'Invalid animal type' }, { status: 400 });
        }

        const animalConfig = ANIMAL_TYPES[type as keyof typeof ANIMAL_TYPES];
        const coins = await getUserCoins();

        if (coins < animalConfig.price) {
            return NextResponse.json({ error: 'Not enough coins' }, { status: 400 });
        }

        const db = getDB();

        // Create animal
        const animalId = `animal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const boughtAt = Date.now();

        db.prepare(`
      INSERT INTO farm_animals (id, user_id, type, bought_at, production_time)
      VALUES (?, 1, ?, ?, ?)
    `).run(animalId, type, boughtAt, animalConfig.productionTime);

        // Deduct coins
        await updateUserCoins(coins - animalConfig.price);

        const animals = db.prepare(`
      SELECT * FROM farm_animals WHERE user_id = 1
    `).all();

        return NextResponse.json({
            animals,
            coins: coins - animalConfig.price,
        });
    } catch (error) {
        console.error('Buy animal error:', error);
        return NextResponse.json({ error: 'Failed to buy animal' }, { status: 500 });
    }
}
