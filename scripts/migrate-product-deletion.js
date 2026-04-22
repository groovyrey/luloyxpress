const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function migrateProductDeletion() {
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

    // 1. Add product_name_at_purchase to order_items if it doesn't exist
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'order_items' AND COLUMN_NAME = 'product_name_at_purchase'
    `);

    if (columns.length === 0) {
      console.log('Adding product_name_at_purchase to order_items...');
      await connection.query('ALTER TABLE order_items ADD COLUMN product_name_at_purchase VARCHAR(255) AFTER seller_id');
      
      // Populate it from current products table
      console.log('Populating product_name_at_purchase from current products...');
      await connection.query(`
        UPDATE order_items oi
        JOIN products p ON oi.product_id = p.id
        SET oi.product_name_at_purchase = p.name
        WHERE oi.product_name_at_purchase IS NULL
      `);
    }

    // 2. Update foreign keys for reviews
    console.log('Updating reviews foreign keys...');
    // Drop existing FK if it exists (Aiven MySQL usually names them automatically or we find them)
    // We can just try to drop and ignore error or find it
    const [reviewFks] = await connection.query(`
      SELECT CONSTRAINT_NAME 
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE TABLE_NAME = 'reviews' AND COLUMN_NAME = 'product_id' AND REFERENCED_TABLE_NAME = 'products'
    `);
    for (const fk of reviewFks) {
      await connection.query(`ALTER TABLE reviews DROP FOREIGN KEY ${fk.CONSTRAINT_NAME}`);
    }
    await connection.query('ALTER TABLE reviews ADD FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE');

    // 3. Update foreign keys for cart_items
    console.log('Updating cart_items foreign keys...');
    const [cartFks] = await connection.query(`
      SELECT CONSTRAINT_NAME 
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE TABLE_NAME = 'cart_items' AND COLUMN_NAME = 'product_id' AND REFERENCED_TABLE_NAME = 'products'
    `);
    for (const fk of cartFks) {
      await connection.query(`ALTER TABLE cart_items DROP FOREIGN KEY ${fk.CONSTRAINT_NAME}`);
    }
    await connection.query('ALTER TABLE cart_items ADD FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE');

    // 4. Update foreign keys for order_items
    console.log('Updating order_items foreign keys...');
    const [orderItemFks] = await connection.query(`
      SELECT CONSTRAINT_NAME 
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE TABLE_NAME = 'order_items' AND COLUMN_NAME = 'product_id' AND REFERENCED_TABLE_NAME = 'products'
    `);
    for (const fk of orderItemFks) {
      await connection.query(`ALTER TABLE order_items DROP FOREIGN KEY ${fk.CONSTRAINT_NAME}`);
    }
    await connection.query('ALTER TABLE order_items ADD FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL');

    console.log('Migration completed successfully!');
    await connection.end();
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

migrateProductDeletion();
