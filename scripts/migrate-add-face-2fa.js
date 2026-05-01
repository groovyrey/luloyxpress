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

    console.log('Adding face_enabled and face_descriptor columns to users table...');
    
    // Check if columns already exist
    const [columns] = await connection.query('SHOW COLUMNS FROM users');
    const columnNames = columns.map(c => c.Field);

    if (!columnNames.includes('face_enabled')) {
      await connection.query('ALTER TABLE users ADD COLUMN face_enabled BOOLEAN DEFAULT FALSE');
      console.log('Added face_enabled column.');
    } else {
      console.log('face_enabled column already exists.');
    }

    console.log('Migration complete!');
    await connection.end();
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

migrate();
