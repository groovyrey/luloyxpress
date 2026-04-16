# Database Schema - LuloyXpress

This project uses **Aiven MySQL** for data storage. Below are the SQL queries required to set up the database environment.

## 1. Users Table
Stores customer account information with encrypted passwords.

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  account_type VARCHAR(20) DEFAULT 'standard',
  membership_expires_at TIMESTAMP NULL,
  balance DECIMAL(10, 2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 2. Products Table
Stores information for the online shopping catalog.

```sql
CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price VARCHAR(50) NOT NULL,
  category VARCHAR(100),
  image TEXT,
  description TEXT,
  tags TEXT,
  seller_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (seller_id) REFERENCES users(id)
);
```

## 3. Cart Items Table
Stores items currently in a user's shopping cart.

```sql
CREATE TABLE cart_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  product_id INT,
  quantity INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);
```

## 4. Orders Table
Stores transaction summaries.

```sql
CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  buyer_id INT,
  total_amount DECIMAL(10, 2),
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (buyer_id) REFERENCES users(id)
);
```

## 5. Order Items Table
Stores individual line items for each order.

```sql
CREATE TABLE order_items (
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
```

---

## Common Application Queries

Below are the key SQL operations used in the application logic.

### Authentication & Users
- **Register User**: Checks for existing email and inserts a new record.
  ```sql
  SELECT id FROM users WHERE email = ?;
  INSERT INTO users (name, email, password, account_type) VALUES (?, ?, ?, ?);
  ```
- **Update Membership**: Upgrades user to Pro and sets expiration (deducts balance if upgrading).
  ```sql
  -- For Pro upgrade (one-time fee)
  UPDATE users SET balance = balance - 499 WHERE id = ?;
  -- General update
  UPDATE users SET account_type = ?, membership_expires_at = ? WHERE id = ?;
  ```
- **Add Funds**: Increments the user's wallet balance.
  ```sql
  UPDATE users SET balance = balance + ? WHERE id = ?;
  ```

### Product Management
- **List Products**: Fetches all products with seller details.
  ```sql
  SELECT p.*, u.name as seller_name FROM products p JOIN users u ON p.seller_id = u.id;
  ```
- **Get Product Details**: Fetches a single product and seller info.
  ```sql
  SELECT p.*, u.name as seller_name, u.email as seller_email, u.account_type as seller_tier 
  FROM products p LEFT JOIN users u ON p.seller_id = u.id WHERE p.id = ?;
  ```
- **Create Product**: Inserts a new listing linked to a seller.
  ```sql
  INSERT INTO products (name, price, category, image, description, seller_id) VALUES (?, ?, ?, ?, ?, ?);
  ```
- **Delete Product**: Removes a product and its cart references (owner only).
  ```sql
  DELETE FROM cart_items WHERE product_id = ?;
  DELETE FROM products WHERE id = ?;
  ```

### Shopping Cart
- **Add to Cart**: Handles quantity increment or new entry.
  ```sql
  SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?;
  UPDATE cart_items SET quantity = quantity + 1 WHERE id = ?;
  INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, 1);
  ```
- **Clear Cart**: Removes all items for a user.
  ```sql
  DELETE FROM cart_items WHERE user_id = ?;
  ```

### Checkout Transaction
The checkout process is wrapped in a **SQL Transaction** to ensure atomicity:
1. **Deduct Buyer Balance**: `UPDATE users SET balance = balance - ? WHERE id = ?;`
2. **Create Order Record**: `INSERT INTO orders (buyer_id, total_amount, status) VALUES (?, ?, 'completed');`
3. **Credit Sellers**: `UPDATE users SET balance = balance + ? WHERE id = ?;` (Per item)
4. **Record Order Items**: `INSERT INTO order_items (order_id, product_id, seller_id, price, quantity) VALUES (...);`

---

## Automation
You can automatically apply these schemas by running the following command in your terminal:

```bash
node scripts/setup-db.js
```

This script reads your `.env.local` credentials and executes the queries listed above.
