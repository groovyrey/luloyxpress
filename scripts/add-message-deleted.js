const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function migrate() {
  const config = {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    ssl: {
      rejectUnauthorized: false,
    },
  };

  try {
    const connection = await mysql.createConnection(config);
    console.log('Connected to Aiven MySQL database.');

    console.log('Adding is_deleted column to messages table...');
    await connection.query(`
      ALTER TABLE messages ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;
    `);

    console.log('Migration complete!');
    await connection.end();
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

migrate();
