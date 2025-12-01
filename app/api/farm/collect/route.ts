import { NextResponse } from 'next/server';
import { getDB } from '../../../lib/server-db';
import { getUserCoins, updateUserCoins } from '../../../lib/db';

const ANIMAL_TYPES = {
    chicken: { sellPrice: 15 },
    cow: { sellPrice: 30 },
    sheep: { sellPrice: 25 },
};

export async function POST(request: Request) {
    try {
        const { animalId } = await request.json();

        const db = getDB();

        // Get animal
        const animal: any = db.prepare(`
      SELECT * FROM farm_animals WHERE id = ? AND user_id = 1
    `).get(animalId);

        if (!animal) {
            return NextResponse.json({ error: 'Animal not found' }, { status: 404 });
        }

        // Check if can collect
        const currentTime = Date.now();
        if (animal.last_produced_at) {
            const elapsed = (currentTime - animal.last_produced_at) / 1000;
            if (elapsed < animal.production_time) {
                return NextResponse.json({ error: 'Product not ready yet' }, { status: 400 });
            }
        }

        const animalConfig = ANIMAL_TYPES[animal.type as keyof typeof ANIMAL_TYPES];
        if (!animalConfig) {
            return NextResponse.json({ error: 'Invalid animal type' }, { status: 400 });
        }

        // Update last_produced_at
        db.prepare(`
      UPDATE farm_animals SET last_produced_at = ? WHERE id = ?
    `).run(currentTime, animalId);

        // Add coins
        const coins = await getUserCoins();
        await updateUserCoins(coins + animalConfig.sellPrice);

        const animals = db.prepare(`
      SELECT * FROM farm_animals WHERE user_id = 1
    `).all();

        return NextResponse.json({
            animals,
            coins: coins + animalConfig.sellPrice,
            reward: animalConfig.sellPrice,
        });
    } catch (error) {
        console.error('Collect product error:', error);
        return NextResponse.json({ error: 'Failed to collect product' }, { status: 500 });
    }
}
