import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });

(async () => {
  try {
    console.log('Using credentials:' , {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
    });

    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: Number(process.env.DB_PORT || 3306),
    });

    await conn.ping();
    console.log('Connection test succeeded');
    await conn.end();
  } catch (err) {
    console.error('Connection test failed:', err.message);
    console.error(err);
    process.exit(1);
  }
})();
