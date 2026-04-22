# Database Schema - LuloyXpress

This project uses **Aiven MySQL** for data storage. Connection pool configured in \`lib/db.ts\`.

## Table Schemas
Run \`node scripts/setup-db.js\` to create/update tables automatically.

### 1. Users Table
Stores customer account information with encrypted passwords.

\`\`\`sql
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  account_type VARCHAR(20) DEFAULT 'standard',
  membership_expires_at TIMESTAMP NULL,
  balance DECIMAL(10, 2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
\`\`\`

### 2. Products Table
Stores information for the online shopping catalog.

```sql
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  category VARCHAR(100),
  image TEXT,
  description TEXT,
  tags TEXT,
  seller_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (seller_id) REFERENCES users(id)
);
```

### 3. Cart Items Table
Stores items currently in a user's shopping cart.

\`\`\`sql
CREATE TABLE IF NOT EXISTS cart_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  product_id INT,
  quantity INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);
\`\`\`

### 4. Orders Table
Stores transaction summaries.

\`\`\`sql
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  buyer_id INT,
  total_amount DECIMAL(10, 2),
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (buyer_id) REFERENCES users(id)
);
\`\`\`

### 5. Order Items Table
Stores individual line items for each order.

\`\`\`sql
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT,
  product_id INT,
  seller_id INT,
  price DECIMAL(10, 2),
  quantity INT,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (seller_id) REFERENCES users(id)
);
\`\`\`

### 6. Transactions Table
Audit log for all wallet movements (deposits, purchases, sales, fees).

\`\`\`sql
CREATE TABLE IF NOT EXISTS transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  type ENUM('deposit', 'purchase', 'sale', 'membership_fee', 'withdrawal') NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  description VARCHAR(255),
  reference_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
\`\`\`

---

## Application Queries (lib/actions.ts)

### Authentication & User Management
- **Register**: Check existence + insert
  \`\`\`sql
  SELECT id FROM users WHERE email = ?;
  INSERT INTO users (name, email, password, account_type) VALUES (?, ?, ?, 'standard');
  \`\`\`
- **Login** (auth.ts): Full user fetch for credentials check
  \`\`\`sql
  SELECT * FROM users WHERE email = ?;
  \`\`\`

- **Get User Data**: Balance/account_type
  \`\`\`sql
  SELECT account_type, balance FROM users WHERE id = ?;
  SELECT account_type FROM users WHERE id = ?;
  \`\`\`

### Membership & Balance
- **Update Membership**: Deduct fee + upgrade (transactional)
  \`\`\`sql
  UPDATE users SET balance = balance - ? WHERE id = ?;  -- Pro fee ₱499
  UPDATE users SET account_type = ?, membership_expires_at = ? WHERE id = ?;
  \`\`\`
- **Add Funds**:
  \`\`\`sql
  UPDATE users SET balance = balance + ? WHERE id = ?;
  \`\`\`

### Products (CRUD)
- **Create Product**:
  \`\`\`sql
  INSERT INTO products (name, price, category, image, description, tags, seller_id) VALUES (?, ?, ?, ?, ?, ?, ?);
  \`\`\`
- **Update Product**:
  \`\`\`sql
  UPDATE products SET name = ?, price = ?, category = ?, image = ?, description = ?, tags = ? WHERE id = ?;
  \`\`\`
- **Delete Product** (cascade):
  \`\`\`sql
  DELETE FROM cart_items WHERE product_id = ?;
  DELETE FROM products WHERE id = ?;
  \`\`\`
- **Ownership Check/Get**:
  \`\`\`sql
  SELECT seller_id, image FROM products WHERE id = ?;
  SELECT * FROM products WHERE id = ?;  -- BuyNow
  \`\`\`
- **Listing Limit** (Standard: max 5):
  \`\`\`sql
  SELECT COUNT(*) as count FROM products WHERE seller_id = ?;
  \`\`\`

### Shopping Cart
- **Add/Increment**:
  \`\`\`sql
  SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?;
  UPDATE cart_items SET quantity = quantity + 1 WHERE id = ?;
  INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, 1);
  \`\`\`
- **Remove Item**:
  \`\`\`sql
  DELETE FROM cart_items WHERE id = ? AND user_id = ?;
  \`\`\`
- **Cart Count**:
  \`\`\`sql
  SELECT SUM(quantity) as count FROM cart_items WHERE user_id = ?;
  \`\`\`
- **Checkout Cart Items** (with prices):
  \`\`\`sql
  SELECT ci.*, p.price as price_str, p.seller_id, p.name
  FROM cart_items ci JOIN products p ON ci.product_id = p.id
  WHERE ci.user_id = ? [AND ci.id IN (?)] ;
  \`\`\`

### Checkout & BuyNow (Atomic Transactions)
1. Check/deduct buyer: \`UPDATE users SET balance = balance - ? WHERE id = ?\`
2. Create order: \`INSERT INTO orders (buyer_id, total_amount, status) VALUES (?, ?, 'completed')\`
3. Per item: Credit seller \`UPDATE users SET balance + ? WHERE id = ?\`, insert order_item
4. Clear cart: \`DELETE FROM cart_items WHERE ... \`
5. **Log each**: INSERT transactions(...)

**Transaction Log** (called for deposit/purchase/sale/membership_fee):
\`\`\`sql
INSERT INTO transactions (user_id, type, amount, description, reference_id) VALUES (?, ?, ?, ?, ?);
\`\`\`

---

## API Endpoints (app/api/)

### GET /api/products
\`\`\`sql
SELECT * FROM products;
\`\`\`

---

## Scripts & Migrations

### setup-db.js
Full DDL above (CREATE TABLE IF NOT EXISTS for all tables).

### migrate-add-tags.js
\`\`\`sql
SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'products' AND COLUMN_NAME = 'tags';  -- Check
ALTER TABLE products ADD COLUMN tags TEXT AFTER description;
\`\`\`

### update-currency.js (PHP $ → ₱)
\`\`\`sql
UPDATE products SET price = REPLACE(price, '$89.00', '₱4,500.00');
UPDATE products SET price = REPLACE(price, '$', '₱') WHERE price LIKE '$%';
\`\`\`

### remove-initial-products.js
\`\`\`sql
DELETE FROM products WHERE seller_id IS NULL;
\`\`\`

---

**Complete coverage of all project MySQL queries. All operations use mysql2/promise pool with SSL for Aiven.**


