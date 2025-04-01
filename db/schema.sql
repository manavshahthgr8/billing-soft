-- Schema for creating the User Table

-- Create Users Table
CREATE TABLE IF NOT EXISTS users (
    userid INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'staff')) -- Assuming roles can be 'admin' or 'user'
);

-- Optionally insert an example user
INSERT INTO users (username, email, password, role)
VALUES 
('admin', 'admin@example.com', 'admin123', 'admin');
