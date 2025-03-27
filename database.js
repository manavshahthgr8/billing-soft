const sqlite3 = require('sqlite3').verbose();



// 📌 Function to create a transactions table for a given financial year
function createTransactionsTable(startYear) {
    if (!startYear || isNaN(startYear)) {
        console.error(`❌ Invalid startYear received in createTransactionsTable: ${startYear}`);
        return;
    }

    const tableName = `transactions_FY${startYear}`;
    console.log(`🛠️ Creating table: ${tableName}`);

    db.run(`CREATE TABLE IF NOT EXISTS ${tableName} (
        transaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
        "sno"	INTEGER NOT NULL,
        firm_id INTEGER NOT NULL,
        financial_year TEXT NOT NULL,  -- New field for financial year
        seller_id INTEGER NOT NULL,
        buyer_id INTEGER NOT NULL,
        date DATE NOT NULL,
        item TEXT NOT NULL,
        packaging TEXT NOT NULL,  -- New field for packaging (Katta/Bags)
        qty INTEGER NOT NULL,
        "bqty"	INTEGER,
        bhav	INTEGER NOT NULL,
        seller_rate DECIMAL(10,2) NOT NULL,  -- New field for Seller Rate
        buyer_rate DECIMAL(10,2) NOT NULL,  -- New field for Buyer Rate
        seller_amount DECIMAL(10,2) NOT NULL,  -- New field for Seller Amount
        buyer_amount DECIMAL(10,2) NOT NULL,  -- New field for Buyer Amount
        payment_status TEXT CHECK(payment_status IN ('Pending', 'Completed', 'Partially Paid')) DEFAULT 'Pending',
        "Seller_Billed"	TEXT DEFAULT 'Not' CHECK("Seller_Billed" IN ('Not', 'Yes')),
	    "Buyer_Billed"	TEXT DEFAULT 'Not' CHECK("Buyer_Billed" IN ('Not', 'Yes'))
    )`, (err) => {
        if (err) console.error(`❌ Error creating table ${tableName}:`, err.message);
        else console.log(`✅ Table ${tableName} ready.`);
    });

}

// 📌 Connect to SQLite database (or create it if it doesn't exist)
const db = new sqlite3.Database('billing.db', (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('✅ Connected to SQLite database');

        // 📌 Create tables
        db.run(`CREATE TABLE IF NOT EXISTS users (
            uid INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL
        )`, (err) => {
            if (err) console.error('❌ Error creating users table:', err.message);
            else console.log('✅ Users table is ready.');
        });

        db.run(`CREATE TABLE IF NOT EXISTS firm (
            firm_id INTEGER PRIMARY KEY AUTOINCREMENT,
            firm_name TEXT NOT NULL,
            account_no TEXT NOT NULL,
            mobile_no TEXT NOT NULL,
            ifsc_no TEXT NOT NULL,
            pan_no TEXT NOT NULL,
            bank_name TEXT NOT NULL,
            address TEXT NOT NULL,
            proprietor TEXT NOT NULL,
            email TEXT NOT NULL
        )`, (err) => {
            if (err) console.error('❌ Error creating firm table:', err.message);
            else console.log('✅ Firm table is ready.');
        });

        db.run(`CREATE TABLE IF NOT EXISTS city (
            city_id INTEGER PRIMARY KEY AUTOINCREMENT,
            state TEXT NOT NULL,
            city_name TEXT NOT NULL
        )`, (err) => {
            if (err) console.error('❌ Error creating city table:', err.message);
            else console.log('✅ City table is ready.');
        });

        db.run(`CREATE TABLE IF NOT EXISTS customers (
            customer_id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT NOT NULL,
            client_name TEXT NOT NULL COLLATE NOCASE,
            contact TEXT,
            email TEXT,
            state TEXT NOT NULL,
            city TEXT NOT NULL,
            city_id INTEGER,
            UNIQUE(client_name, state, city)
        )`, (err) => {
            if (err) console.error('❌ Error creating customers table:', err.message);
            else console.log('✅ Customers table is ready.');
        });

        db.run(`CREATE TABLE IF NOT EXISTS financial_years (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            startYear INTEGER UNIQUE NOT NULL,
            endYear INTEGER NOT NULL
        )`);

        // 📌 Deleted Customers Table
            db.run(`CREATE TABLE IF NOT EXISTS deleted_customers (
                deleted_id INTEGER PRIMARY KEY AUTOINCREMENT,          -- Unique ID for tracking deletions
                customer_id INTEGER NOT NULL,                          -- Original Customer ID (same as customers table)
                category TEXT NOT NULL,
                client_name TEXT NOT NULL COLLATE NOCASE,
                contact TEXT,
                email TEXT,
                state TEXT NOT NULL,
                city TEXT NOT NULL,
                city_id INTEGER,
                deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,         -- Timestamp when deleted
                UNIQUE(customer_id)                                     -- Ensure no duplicate customer IDs
            )`, (err) => {
                if (err) console.error('❌ Error creating deleted_customers table:', err.message);
                else console.log('✅ Deleted Customers table is ready.');
            });


    }
});

// 📌 Export functions and database
module.exports = {
    createTransactionsTable,
    db, 
};
