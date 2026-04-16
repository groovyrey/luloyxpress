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

    console.log('Adding "tags" column to "products" table...');
    
    // Check if column exists first (optional but safer)
    const [rows] = await connection.query("SHOW COLUMNS FROM products LIKE 'tags'");
    
    if (rows.length === 0) {
      await connection.query('ALTER TABLE products ADD COLUMN tags TEXT AFTER description');
      console.log('Successfully added "tags" column.');
    } else {
      console.log('Column "tags" already exists.');
    }

    await connection.end();
    console.log('Migration complete!');
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrate();
