# Database Schema - LuloyXpress

This project uses **Aiven MySQL** for data storage. Connection pool configured in `lib/db.ts`.

## Table Schemas
Run `node scripts/setup-db.js` to create/update tables automatically.

### 1. Users Table
Stores customer account information with encrypted passwords and security settings.

```sql
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  account_type VARCHAR(20) DEFAULT 'standard',
  membership_expires_at TIMESTAMP NULL,
  balance DECIMAL(10, 2) DEFAULT 0.00,
  face_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

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

```sql
CREATE TABLE IF NOT EXISTS cart_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  product_id INT,
  quantity INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
```

### 4. Orders Table
Stores transaction summaries.

```sql
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  buyer_id INT,
  total_amount DECIMAL(10, 2),
  status VARCHAR(50) DEFAULT 'pending',
  payment_method VARCHAR(50) DEFAULT 'wallet',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (buyer_id) REFERENCES users(id)
);
```

### 5. Order Items Table
Stores individual line items for each order, preserving product names at time of purchase.

```sql
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT,
  product_id INT,
  seller_id INT,
  product_name_at_purchase VARCHAR(255),
  price DECIMAL(10, 2),
  quantity INT,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  FOREIGN KEY (seller_id) REFERENCES users(id)
);
```

### 6. Transactions Table
Audit log for all wallet movements (deposits, purchases, sales, fees).

```sql
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
```

### 7. Reviews Table
Stores customer ratings and comments for products and sellers.

```sql
CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  reviewer_id INT NOT NULL,
  seller_id INT NOT NULL,
  rating TINYINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(reviewer_id, product_id),
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewer_id) REFERENCES users(id),
  FOREIGN KEY (seller_id) REFERENCES users(id)
);
```

### 8. Messages Table
Stores real-time chat messages between users.

```sql
CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sender_id INT NOT NULL,
  receiver_id INT NOT NULL,
  content TEXT NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id),
  FOREIGN KEY (receiver_id) REFERENCES users(id)
);
```

---

## Application Queries

### Authentication & User Management
- **Register**: Check existence + insert
  ```sql
  SELECT id FROM users WHERE email = ?;
  INSERT INTO users (name, email, password, account_type) VALUES (?, ?, ?, 'standard');
  ```
- **Login**: Check Face 2FA + full user fetch
  ```sql
  SELECT id, face_enabled FROM users WHERE email = ?;
  SELECT password FROM users WHERE id = ?;
  SELECT * FROM users WHERE email = ?;
  ```
- **Face 2FA Toggle**:
  ```sql
  UPDATE users SET face_enabled = ? WHERE id = ?;
  ```

### Membership & Balance
- **Update Membership**: Deduct fee + upgrade (transactional)
  ```sql
  SELECT account_type, balance FROM users WHERE id = ?;
  UPDATE users SET balance = balance - ? WHERE id = ?;
  UPDATE users SET account_type = ?, membership_expires_at = ? WHERE id = ?;
  ```
- **Add Funds**:
  ```sql
  UPDATE users SET balance = balance + ? WHERE id = ?;
  ```

### Products (CRUD & Shop)
- **Create Product**:
  ```sql
  INSERT INTO products (name, price, category, image, description, tags, seller_id) VALUES (?, ?, ?, ?, ?, ?, ?);
  ```
- **Shop Listing** (with Pro-tier priority & pagination):
  ```sql
  SELECT p.*, u.name as seller_name, u.account_type as seller_tier
  FROM products p 
  LEFT JOIN users u ON p.seller_id = u.id 
  WHERE p.category = ? AND (p.name LIKE ? OR p.description LIKE ?)
  ORDER BY CASE WHEN u.account_type = 'pro' THEN 0 ELSE 1 END, p.created_at DESC
  LIMIT ? OFFSET ?;
  ```
- **Product Details**:
  ```sql
  SELECT p.*, u.name as seller_name, u.email as seller_email, u.account_type as seller_tier
  FROM products p 
  LEFT JOIN users u ON p.seller_id = u.id 
  WHERE p.id = ?;
  ```

### Shopping Cart
- **Cart Count**:
  ```sql
  SELECT SUM(quantity) as count FROM cart_items WHERE user_id = ?;
  ```
- **Sync Cart**:
  ```sql
  SELECT ci.id as cart_item_id, ci.quantity, p.* 
  FROM cart_items ci
  JOIN products p ON ci.product_id = p.id
  WHERE ci.user_id = ?;
  ```

### Checkout (Atomic Transactions)
1. **Deduct Buyer**: `UPDATE users SET balance = balance - ? WHERE id = ?`
2. **Create Order**: `INSERT INTO orders (buyer_id, total_amount, status, payment_method) VALUES (?, ?, 'completed', ?)`
3. **Credit Seller**: `UPDATE users SET balance = balance + ? WHERE id = ?`
4. **Record Item**: `INSERT INTO order_items (order_id, product_id, seller_id, product_name_at_purchase, price, quantity) VALUES (?, ?, ?, ?, ?, ?)`
5. **Clear Cart**: `DELETE FROM cart_items WHERE user_id = ? AND id IN (?)`

### Seller Stats & Dashboard
- **Revenue/Sales**:
  ```sql
  SELECT COALESCE(SUM(price * quantity), 0) as total_revenue, COUNT(*) as total_sales
  FROM order_items WHERE seller_id = ?;
  ```
- **Recent Sales**:
  ```sql
  SELECT oi.order_id, p.name as product_name, oi.price, oi.quantity, o.created_at
  FROM order_items oi
  JOIN products p ON oi.product_id = p.id
  JOIN orders o ON oi.order_id = o.id
  WHERE oi.seller_id = ?
  ORDER BY o.created_at DESC LIMIT 5;
  ```

### Messaging
- **Conversation List**:
  ```sql
  SELECT DISTINCT u.id, u.name, u.email,
    (SELECT content FROM messages WHERE (sender_id = u.id AND receiver_id = ?) OR (sender_id = ? AND receiver_id = u.id) ORDER BY created_at DESC LIMIT 1) as last_message,
    (SELECT sender_id FROM messages WHERE (sender_id = u.id AND receiver_id = ?) OR (sender_id = ? AND receiver_id = u.id) ORDER BY created_at DESC LIMIT 1) as last_sender_id,
    (SELECT created_at FROM messages WHERE (sender_id = u.id AND receiver_id = ?) OR (sender_id = ? AND receiver_id = u.id) ORDER BY created_at DESC LIMIT 1) as last_message_at
  FROM users u
  JOIN messages m ON (u.id = m.sender_id OR u.id = m.receiver_id)
  WHERE u.id != ? AND (m.sender_id = ? OR m.receiver_id = ?)
  ORDER BY last_message_at DESC;
  ```
- **History (with auto-cleanup of 20+ messages)**:
  ```sql
  SELECT * FROM messages WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?) ORDER BY created_at ASC;
  DELETE FROM messages WHERE id IN (SELECT id FROM (...) LIMIT 1000 OFFSET 20);
  ```

### Reviews
- **Product Rating/Reviews**:
  ```sql
  SELECT AVG(rating) as average, COUNT(*) as count FROM reviews WHERE product_id = ?;
  SELECT r.*, u.name as reviewer_name FROM reviews r JOIN users u ON r.reviewer_id = u.id WHERE r.product_id = ? ORDER BY r.created_at DESC;
  ```
- **Order Review Check**:
  ```sql
  SELECT * FROM reviews WHERE order_id = ? AND product_id = ?;
  ```
- **Eligible Order Check**:
  ```sql
  SELECT oi.order_id FROM order_items oi
  JOIN orders o ON oi.order_id = o.id
  WHERE o.buyer_id = ? AND oi.product_id = ? AND o.status = 'completed' LIMIT 1;
  ```

---

## API Endpoints (app/api/)

### GET /api/products
```sql
SELECT * FROM products;
```

---

## Scripts & Migrations

### setup-db.js
Full DDL above (CREATE TABLE IF NOT EXISTS for all tables).

### migrate-add-face-2fa.js
```sql
ALTER TABLE users ADD COLUMN face_enabled BOOLEAN DEFAULT FALSE;
```

### migrate-product-deletion.js
```sql
ALTER TABLE order_items ADD COLUMN product_name_at_purchase VARCHAR(255) AFTER seller_id;
UPDATE order_items oi JOIN products p ON oi.product_id = p.id SET oi.product_name_at_purchase = p.name;
ALTER TABLE reviews ADD FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
```

### update-currency.js (PHP $ → ₱)
```sql
UPDATE products SET price = REPLACE(price, '$', '₱') WHERE price LIKE '$%';
```

---

**Complete coverage of all project MySQL queries. All operations use mysql2/promise pool with SSL for Aiven.**
