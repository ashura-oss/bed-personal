import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

import { characters, regions, users } from './schema.js';

const sampleUsers = [
  { username: 'ashura', displayName: 'Ashura' },
  { username: 'ember', displayName: 'Ember Initiate' },
];

const sampleRegions = [
  {
    code: 'hearthmere',
    name: 'Hearthmere Camp',
    description: 'A quiet camp used as the player starting point.',
    dangerLevel: 1,
    isUnlocked: true,
  },
  {
    code: 'ash-barrens',
    name: 'Ash Barrens',
    description: 'A scorched outer route planned for early exploration.',
    dangerLevel: 2,
    isUnlocked: true,
  },
];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

const dbUrl = process.env.DATABASE_URL || 'file:local.db';

const getLocalDbPath = () => {
  if (!dbUrl.startsWith('file:')) {
    return null;
  }

  const rawPath = dbUrl.slice('file:'.length);
  return {
    displayPath: rawPath,
    absolutePath: path.resolve(projectRoot, rawPath),
  };
};

const createTables = async (client) => {
  await client.execute('PRAGMA foreign_keys = ON');
  await client.execute('DROP TABLE IF EXISTS characters');
  await client.execute('DROP TABLE IF EXISTS regions');
  await client.execute('DROP TABLE IF EXISTS users');
  await client.execute(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);
  await client.execute(`
    CREATE TABLE characters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      archetype TEXT NOT NULL,
      level INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  await client.execute(`
    CREATE TABLE regions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL,
      danger_level INTEGER NOT NULL DEFAULT 1,
      is_unlocked INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    )
  `);
};

export const seed = async (db) => {
  const insertedUsers = await db.insert(users).values(sampleUsers).returning();
  const ashura = insertedUsers.find((user) => user.username === 'ashura');
  const ember = insertedUsers.find((user) => user.username === 'ember');

  await db.insert(characters).values([
    {
      userId: ashura.id,
      name: 'Alden',
      archetype: 'warden',
      level: 1,
    },
    {
      userId: ember.id,
      name: 'Mira',
      archetype: 'scout',
      level: 1,
    },
  ]);

  const insertedRegions = await db.insert(regions).values(sampleRegions).returning();

  console.log(`  Inserted ${insertedUsers.length} users`);
  console.log('  Inserted 2 characters');
  console.log(`  Inserted ${insertedRegions.length} regions`);
};

const resetDatabase = async () => {
  try {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Refusing to reset database while NODE_ENV=production');
    }

    const localDbPath = getLocalDbPath();

    if (localDbPath && fs.existsSync(localDbPath.absolutePath)) {
      fs.unlinkSync(localDbPath.absolutePath);
      console.log(`Deleted old database: ${localDbPath.displayPath}`);
    }

    const { client, db } = await import('./connection.js');

    console.log('Creating tables...');
    await createTables(client);

    console.log('Seeding database...');
    await seed(db);

    console.log('Done! Database is ready.');
  } catch (error) {
    console.error('Failed to reset database:', error.message);
    process.exit(1);
  }
};

resetDatabase();
