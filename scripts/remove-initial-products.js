const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function removeInitialProducts() {
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
    console.log('Connected to database.');

    // Remove products with no seller_id (initial sample products)
    const [result] = await connection.query('DELETE FROM products WHERE seller_id IS NULL');
    console.log(`Removed ${result.affectedRows} initial products.`);

    await connection.end();
  } catch (error) {
    console.error('Error removing initial products:', error);
    process.exit(1);
  }
}

removeInitialProducts();
