const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function updateCurrency() {
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

    // Update existing products to Pesos
    await connection.query("UPDATE products SET price = REPLACE(price, '$89.00', '₱4,500.00')");
    await connection.query("UPDATE products SET price = REPLACE(price, '$249.00', '₱12,500.00')");
    await connection.query("UPDATE products SET price = REPLACE(price, '$45.00', '₱2,250.00')");
    await connection.query("UPDATE products SET price = REPLACE(price, '$32.00', '₱1,600.00')");
    
    // Catch-all for any other $ prices
    await connection.query("UPDATE products SET price = REPLACE(price, '$', '₱') WHERE price LIKE '$%'");

    console.log('Successfully updated all product prices to Pesos (₱).');
    await connection.end();
  } catch (error) {
    console.error('Error updating currency:', error);
  }
}

updateCurrency();
