const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function migrateReviewConstraint() {
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

    // 1. Drop existing foreign keys that might be using the index
    console.log('Dropping foreign keys...');
    const [fks] = await connection.query(`
      SELECT CONSTRAINT_NAME 
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE TABLE_NAME = 'reviews' AND REFERENCED_TABLE_NAME IS NOT NULL
    `);
    for (const fk of fks) {
      await connection.query(`ALTER TABLE reviews DROP FOREIGN KEY ${fk.CONSTRAINT_NAME}`);
    }

    // 2. Drop existing UNIQUE indexes
    console.log('Dropping unique indexes...');
    const [indexes] = await connection.query(`
      SHOW INDEX FROM reviews WHERE Non_unique = 0 AND Key_name != 'PRIMARY'
    `);
    const uniqueIndexNames = [...new Set(indexes.map(idx => idx.Key_name))];
    for (const indexName of uniqueIndexNames) {
      await connection.query(`ALTER TABLE reviews DROP INDEX ${indexName}`);
    }

    // 3. Add the new UNIQUE(reviewer_id, product_id) constraint
    console.log('Adding new UNIQUE(reviewer_id, product_id) constraint...');
    await connection.query('ALTER TABLE reviews ADD UNIQUE (reviewer_id, product_id)');

    // 4. Restore foreign keys
    console.log('Restoring foreign keys...');
    await connection.query('ALTER TABLE reviews ADD FOREIGN KEY (order_id) REFERENCES orders(id)');
    await connection.query('ALTER TABLE reviews ADD FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE');
    await connection.query('ALTER TABLE reviews ADD FOREIGN KEY (reviewer_id) REFERENCES users(id)');
    await connection.query('ALTER TABLE reviews ADD FOREIGN KEY (seller_id) REFERENCES users(id)');

    console.log('Migration completed successfully!');
    await connection.end();
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

migrateReviewConstraint();
