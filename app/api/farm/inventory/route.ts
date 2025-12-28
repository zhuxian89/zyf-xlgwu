import { NextResponse } from 'next/server';
import { getDB } from '../../../lib/server-db';
import { getUserCoins, updateUserCoins } from '../../../lib/db';

const CROP_TYPES = {
    carrot: { sellPrice: 15 },
    tomato: { sellPrice: 22 },
    strawberry: { sellPrice: 35 },
    corn: { sellPrice: 42 },
    wheat: { sellPrice: 28 },
    watermelon: { sellPrice: 70 },
    grape: { sellPrice: 55 },
    pumpkin: { sellPrice: 85 },
    eggplant: { sellPrice: 30 },
    sunflower: { sellPrice: 50 },
};

// GET - Get inventory and collection
export async function GET() {
    try {
        const db = getDB();

        // Get inventory
        const inventory = db.prepare(`
            SELECT crop_type, quantity FROM farm_inventory WHERE user_id = 1 AND quantity > 0
        `).all() as { crop_type: string; quantity: number }[];

        // Get collection
        const collection = db.prepare(`
            SELECT crop_type FROM farm_collection WHERE user_id = 1
        `).all() as { crop_type: string }[];

        // Convert to objects
        const inventoryObj: { [key: string]: number } = {};
        inventory.forEach(item => {
            inventoryObj[item.crop_type] = item.quantity;
        });

        const collectionArr = collection.map(item => item.crop_type);

        return NextResponse.json({
            inventory: inventoryObj,
            collection: collectionArr,
        });
    } catch (error) {
        console.error('Get inventory error:', error);
        return NextResponse.json({ error: 'Failed to get inventory' }, { status: 500 });
    }
}

// POST - Add to inventory (called when harvesting)
export async function POST(request: Request) {
    try {
        const { cropType, quantity = 1 } = await request.json();

        if (!CROP_TYPES[cropType as keyof typeof CROP_TYPES]) {
            return NextResponse.json({ error: 'Invalid crop type' }, { status: 400 });
        }

        const db = getDB();

        // Add to inventory (upsert)
        db.prepare(`
            INSERT INTO farm_inventory (user_id, crop_type, quantity)
            VALUES (1, ?, ?)
            ON CONFLICT(user_id, crop_type) DO UPDATE SET quantity = quantity + ?
        `).run(cropType, quantity, quantity);

        // Add to collection if not exists
        db.prepare(`
            INSERT OR IGNORE INTO farm_collection (user_id, crop_type, first_harvested_at)
            VALUES (1, ?, ?)
        `).run(cropType, Date.now());

        // Get updated data
        const inventory = db.prepare(`
            SELECT crop_type, quantity FROM farm_inventory WHERE user_id = 1 AND quantity > 0
        `).all() as { crop_type: string; quantity: number }[];

        const collection = db.prepare(`
            SELECT crop_type FROM farm_collection WHERE user_id = 1
        `).all() as { crop_type: string }[];

        const inventoryObj: { [key: string]: number } = {};
        inventory.forEach(item => {
            inventoryObj[item.crop_type] = item.quantity;
        });

        return NextResponse.json({
            inventory: inventoryObj,
            collection: collection.map(item => item.crop_type),
        });
    } catch (error) {
        console.error('Add to inventory error:', error);
        return NextResponse.json({ error: 'Failed to add to inventory' }, { status: 500 });
    }
}

// PUT - Sell from inventory
export async function PUT(request: Request) {
    try {
        const { cropType, quantity } = await request.json();

        const cropConfig = CROP_TYPES[cropType as keyof typeof CROP_TYPES];
        if (!cropConfig) {
            return NextResponse.json({ error: 'Invalid crop type' }, { status: 400 });
        }

        const db = getDB();

        // Check current quantity
        const current = db.prepare(`
            SELECT quantity FROM farm_inventory WHERE user_id = 1 AND crop_type = ?
        `).get(cropType) as { quantity: number } | undefined;

        if (!current || current.quantity < quantity) {
            return NextResponse.json({ error: 'Not enough items' }, { status: 400 });
        }

        // Reduce inventory
        db.prepare(`
            UPDATE farm_inventory SET quantity = quantity - ? WHERE user_id = 1 AND crop_type = ?
        `).run(quantity, cropType);

        // Add coins
        const earnings = cropConfig.sellPrice * quantity;
        const coins = await getUserCoins();
        await updateUserCoins(coins + earnings);

        // Get updated inventory
        const inventory = db.prepare(`
            SELECT crop_type, quantity FROM farm_inventory WHERE user_id = 1 AND quantity > 0
        `).all() as { crop_type: string; quantity: number }[];

        const inventoryObj: { [key: string]: number } = {};
        inventory.forEach(item => {
            inventoryObj[item.crop_type] = item.quantity;
        });

        return NextResponse.json({
            inventory: inventoryObj,
            coins: coins + earnings,
            earnings,
        });
    } catch (error) {
        console.error('Sell from inventory error:', error);
        return NextResponse.json({ error: 'Failed to sell' }, { status: 500 });
    }
}
