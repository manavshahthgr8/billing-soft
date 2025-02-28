const express = require('express');
const app = express();
const bodyParser = require('body-parser');

const { createTransactionsTable, db } = require('./database');
console.log("✅ Debug: createTransactionsTable is imported:", typeof createTransactionsTable);


const session = require('express-session');

app.use(bodyParser.json());  // Ensure the request body can be parsed
const path = require('path');

app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    next();
});

app.use(express.json()); // Middleware to parse JSON body




// Middleware to parse request bodies as JSON
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Setup session middleware (for maintaining user login state)
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));

// API to handle login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    const query = `
        SELECT * FROM users WHERE (username = ? OR email = ?) AND password = ?
    `;
    db.get(query, [username, username, password], (err, user) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }

        if (user) {
            const { uid, username, email, role } = user;

            // Set session variables for user ID and credentials
            req.session.user = { uid, username, email, role };

            res.json({
                success: true,
                message: 'Login successful',
                user: { uid, username, email, role }
            });

        } else {
            res.status(401).json({ success: false, message: 'Invalid ID or Password' });
        }
    });
});

// API endpoint to fetch session information (user data from the session)
app.get('/api/session', (req, res) => {
    if (req.session.user) {
        res.json({ success: true, user: req.session.user });
    } else {
        res.status(401).json({ success: false, message: 'Not logged in' });
    }
});

// Fetch account details for logged-in user
app.get('/api/account/:uid', (req, res) => {
    const { uid } = req.params; // Grabbing uid from request params

    // Fetch the account details from the database
    const query = 'SELECT uid, username, email, role FROM users WHERE uid = ?';

    db.get(query, [uid], (err, user) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Internal Server Error' });
        }

        if (user) {
            res.json({ success: true, user });
        } else {
            res.status(404).json({ success: false, message: 'User not found' });
        }
    });
});

// Update account details (for logged-in user)
app.post('/api/account', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: 'Not logged in' });
    }

    const { uid } = req.session.user;
    const { username, email, password } = req.body; // new details entered by the user

    // Validation: Make sure new data is not empty
    if (!username || !email || !password) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    // Update user account details
    const query = `
        UPDATE users
        SET username = ?, email = ?, password = ?
        WHERE uid = ?
    `;
    
    db.run(query, [username, email, password, uid], function(err) {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Internal Server Error' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update the session user data
        req.session.user = { uid, username, email, role: req.session.user.role };

        res.json({ success: true, message: 'Account updated successfully' });
    });
});

app.post('/api/account/check-password', (req, res) => {
    const { password } = req.body;
    const userId = req.session.user ? req.session.user.uid : null;

    if (!userId) {
        return res.status(401).json({ success: false, message: "Not logged in" });
    }

    const query = `SELECT password FROM users WHERE uid = ?`;
    db.get(query, [userId], (err, user) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ success: false, message: "Internal Server Error" });
        }

        if (user && user.password === password) {
            res.json({ success: true });
        } else {
            res.status(400).json({ success: false, message: "Incorrect current password" });
        }
    });
});

app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).json({ success: false, message: 'Failed to log out.' });
        }
        res.clearCookie('connect.sid'); // Clear the session cookie
        res.json({ success: true, message: 'Logged out successfully.' });
    });
});


app.get('/api/firm/:firmId', (req, res) => {
    const firmId = req.params.firmId;
    db.get(`SELECT firm_name, account_no, mobile_no, ifsc_no, pan_no, bank_name, address, proprietor, email, firm_id FROM firm WHERE firm_id = ?`, [firmId], (err, row) => {
        if (err) {
            console.error('Error fetching firm details:', err.message);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        } else if (!row) {
            res.status(404).json({ success: false, message: 'Firm not found' });
        } else {
            res.json({ success: true, firm: row });
        }
    });
});

app.get('/api/customer/:customerId', (req, res) => {
    const customerId = req.params.customerId;
    db.get(`SELECT customer_id, category, client_name, contact, email, state, city, city_id FROM customers WHERE customer_id = ?`, 
        [customerId], (err, row) => {
        if (err) {
            console.error('Error fetching customer details:', err.message);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        } else if (!row) {
            res.status(404).json({ success: false, message: 'Customer not found' });
        } else {
            res.json({ success: true, customer: row });
        }
    });
});

app.post('/api/firmupdate/:firmId', (req, res) => {
    //console.log('Post request received for firm ID:', req.params.firmId);
    const firmId = req.params.firmId;
    //console.log(`Firm ID: ${firmId}`);  // Add log for debugging
    const { firmName, accountNo, ifscNo, address, mobileNo, email, panNo, BankName, ProName } = req.body;

    const query = `
        UPDATE firm 
        SET firm_name = ?, account_no = ?, ifsc_no = ?, address = ?, mobile_no = ?, email = ?, pan_no = ?, bank_name = ?, proprietor = ?
        WHERE firm_id = ?;
    `;
    
    db.run(query, [firmName, accountNo, ifscNo, address, mobileNo, email, panNo, BankName, ProName, firmId], function(err) {
        if (err) {
            console.error('Error updating firm:', err);
            return res.status(500).json({ message: 'Internal Server Error' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ message: 'Firm not found' });
        }

        res.json({ success: true, message: 'Firm details updated successfully' });
    });
});

// API to add a city
app.post('/city', (req, res) => {
    const { state, city_name } = req.body;

    if (!state || !city_name) {
        return res.status(400).json({ error: 'State and city name are required.' });
    }

    const query = `INSERT INTO city (state, city_name) VALUES (?, ?)`;
    db.run(query, [state, city_name], function (err) {
        if (err) {
            console.error('Error adding city:', err.message);
            return res.status(500).json({ error: 'Failed to add city.' });
        }

        res.status(201).json({ message: 'City added successfully.', cityId: this.lastID });
    });
});

// API to check if a city exists
app.get('/city/check', (req, res) => {
    const { city_name } = req.query;
  
    if (!city_name) {
      return res.status(400).json({ error: 'City name is required.' });
    }
  
    const query = `SELECT state FROM city WHERE LOWER(city_name) = LOWER(?)`;
    db.get(query, [city_name], (err, row) => {
      if (err) {
        console.error('Error checking city:', err.message);
        return res.status(500).json({ error: 'Failed to check city.' });
      }
  
      if (row) {
        // City exists
        res.json({ exists: true, state: row.state });
      } else {
        // City does not exist
        res.json({ exists: false });
      }
    });
  });

  //fetch city by state
  app.get('/city/state/:state', (req, res) => {
    const { state } = req.params;
  
    const query = `SELECT city_id, city_name FROM city WHERE LOWER(state) = LOWER(?)`;
    db.all(query, [state], (err, rows) => {
        if (rows.length === 0) {
            return res.status(404).json({ error: 'No cities found for the selected state.' });
          }
      
      if (err) {
        console.error('Error fetching cities:', err.message);
        return res.status(500).json({ error: 'Failed to fetch cities.' });
      }
  
      
      res.json(rows);
    });
  });
  

  //update city
  // Update city and reflect changes in customers table
app.put('/city', (req, res) => {
  const { city_id, new_state, new_city_name } = req.body;

  if (!city_id || !new_state || !new_city_name) {
      return res.status(400).json({ error: 'city_id, new_state, and new_city_name are required.' });
  }

  // Begin transaction
  db.serialize(() => {
      db.run("BEGIN TRANSACTION");

      // 1️⃣ Update city table
      const updateCityQuery = `UPDATE city SET state = ?, city_name = ? WHERE city_id = ?`;
      db.run(updateCityQuery, [new_state, new_city_name, city_id], function (err) {
          if (err) {
              console.error('Error updating city:', err.message);
              db.run("ROLLBACK"); // Rollback on error
              return res.status(500).json({ error: 'Failed to update city.' });
          }

          // 2️⃣ Update customers table where city_id matches
          const updateCustomersQuery = `UPDATE customers SET state = ?, city = ? WHERE city_id = ?`;
          db.run(updateCustomersQuery, [new_state, new_city_name, city_id], function (err) {
              if (err) {
                  console.error('Error updating customers:', err.message);
                  db.run("ROLLBACK"); // Rollback on error
                  return res.status(500).json({ error: 'Failed to update customers.' });
              }

              // Commit transaction after successful updates
              db.run("COMMIT", (commitErr) => {
                  if (commitErr) {
                      console.error('Error committing transaction:', commitErr.message);
                      return res.status(500).json({ error: 'Transaction commit failed.' });
                  }

                  res.json({ success: true, message: 'City and related customers updated successfully.' });
              });
          });
      });
  });
});

  
// add customer
app.post('/customers', (req, res) => {
    const { category, client_name, contact, email, state, city , city_id } = req.body;
  
    if (!category || !client_name || !state || !city) {
      return res.status(400).json({ error: 'Required fields are missing.' });
    }
  
    // Normalize client_name to lowercase
    const normalizedClientName = client_name  //.toLowerCase();

    const cityIdNumber = parseInt(city_id, 10); // Convert to integer
  
    const query = `INSERT INTO customers (category, client_name, contact, email, state, city , city_id)
                   VALUES (?, ?, ?, ?, ?, ?,?)`;
  
    db.run(
      query,
      [category, normalizedClientName, contact, email, state, city , city_id],
      function (err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: 'Customer already exists.' });
          }
          console.error('Error adding customer:', err.message);
          return res.status(500).json({ error: 'Failed to add customer.' });
        }
        res.status(201).json({ message: 'Customer added successfully!', id: this.lastID });
      }
    );
  });

  app.get('/customers', (req, res) => {
    let { page = 1, limit = 10, search = '', column = 'client_name' } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);
    const offset = (page - 1) * limit;

    const allowedColumns = ['client_name', 'city', 'state', 'category'];
    if (!allowedColumns.includes(column)) {
        return res.status(400).json({ error: 'Invalid search column.' });
    }

    const searchQuery = `%${search}%`;
    const query = `
        SELECT customer_id, category, client_name, contact, email, state, city
        FROM customers
        WHERE ${column} LIKE ?
        ORDER BY client_name
        LIMIT ? OFFSET ?
    `;

    db.all(query, [searchQuery, limit, offset], (err, rows) => {
        if (err) {
            console.error('Error fetching customers:', err.message);
            return res.status(500).json({ error: 'Failed to fetch customers.' });
        }

        const countQuery = `SELECT COUNT(*) as total FROM customers WHERE ${column} LIKE ?`;
        db.get(countQuery, [searchQuery], (err, result) => {
            if (err) {
                console.error('Error counting customers:', err.message);
                return res.status(500).json({ error: 'Failed to count customers.' });
            }

            const totalPages = Math.ceil(result.total / limit);

            res.json({
                customers: rows,
                total: result.total,
                currentPage: page,
                totalPages: totalPages,
            });
        });
    });
});

  
  
// Update customer API
// Update customer details
app.post('/api/update-customer', (req, res) => {
   // console.log("Update Customer API Called"); // Debugging Step 1
   // console.log("Received Data:", req.body); // Debugging Step 2

    const { customer_id, client_name, state, city, contact, email, category } = req.body;

    // Debugging Step 3: Check if required fields are received
    if (!customer_id || !client_name || !state || !city) {
        console.error("Missing required fields:", { customer_id, client_name, state, city });
        return res.status(400).json({ error: 'customer_id, client_name, state, and city are required.' });
    }

    // Debugging Step 4: Check if category is received
    if (!category) {
        console.warn("Warning: Category is missing, setting default value.");
    }

    // Prepare SQL query
    const query = `
        UPDATE customers
        SET client_name = ?, state = ?, city = ?, contact = ?, email = ?, category = ?
        WHERE customer_id = ?
    `;

   // console.log("Executing SQL Query:", query); // Debugging Step 5
   // console.log("Query Parameters:", [client_name, state, city, contact, email, category, customer_id]);

    // Execute the query
    db.run(query, [client_name, state, city, contact || null, email || null, category || null, customer_id], function (err) {
        if (err) {
          //  console.error("Database Error:", err.message);
            return res.status(500).json({ error: "Failed to update customer." });
        }

        // Check if any row was updated
        if (this.changes === 0) {
          //  console.warn("No rows updated, customer not found or no changes detected.");
            return res.status(404).json({ error: "Customer not found or no changes were made." });
        }

       // console.log("Customer updated successfully!");
        res.json({ success: true, message: "Customer updated successfully." });
    });
});

  
  
  // Endpoint for deleting a customer
  app.delete('/api/customers/:customerId', (req, res) => {
    const customerId = req.params.customerId; // Customer ID to delete

    // Perform delete query directly
    const query = `DELETE FROM customers WHERE customer_id = ?`;
    db.run(query, [customerId], function (err) {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Internal server error." });
        }

        // If row is deleted, rowCount will be > 0
        if (this.changes > 0) {
            return res.status(200).json({ message: "Customer deleted successfully." });
        } else {
            return res.status(404).json({ message: "Customer not found." });
        }
    });
});

// 📌 Get all financial years
app.get("/financial-years", (req, res) => {
  db.all("SELECT * FROM financial_years ORDER BY startYear DESC", [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
  });
});

// 📌 Add a financial year
app.post("/financial-years", (req, res) => {
  const { startYear } = req.body;

  if (!startYear || isNaN(startYear)) {
      console.error("❌ Received invalid startYear in request:", startYear);
      return res.status(400).json({ error: "Invalid start year" });
  }

  console.log("✅ Received startYear:", startYear);

  const endYear = startYear + 1;

  db.run(
      "INSERT INTO financial_years (startYear, endYear) VALUES (?, ?)",
      [startYear, endYear],
      function (err) {
        if (err) {
          if (err.code === "SQLITE_CONSTRAINT") {
              return res.status(400).json({ success: false, message: `Financial Year ${startYear}-${endYear} already exists!` });
          } else {
              return res.status(500).json({ success: false, message: "Server error: " + err.message });
          }
      }

          console.log(`📌 Financial Year ${startYear}-${endYear} added.`);
          
          // ✅ Now safely create the transactions table
          createTransactionsTable(startYear);

          res.json({ id: this.lastID, startYear, endYear });
      }
  );
});


// 📌 Delete a financial year
app.delete("/financial-years/:startYear", (req, res) => {
  const { startYear } = req.params;

  db.run("DELETE FROM financial_years WHERE startYear = ?", [startYear], function (err) {
      if (err) return res.status(500).json({ error: err.message });

      // Drop transactions table for that financial year
      const tableName = `transactions_FY${startYear}`;
      db.run(`DROP TABLE IF EXISTS ${tableName}`);

      res.json({ message: "Financial Year deleted!", affectedRows: this.changes });
  });
});


// 📌 API: Get Sellers by City
app.get("/debug/cities", (req, res) => {
  const sql = "SELECT DISTINCT city FROM customers";

  db.all(sql, [], (err, rows) => {
      if (err) {
          console.error("🚨 Error fetching cities:", err.message);
          return res.status(500).json({ success: false, error: err.message });
      }

      console.log("📌 Cities in DB (Raw Output):", rows);
      res.json({ success: true, cities: rows });
  });
});

// 📌 API: Get All Sellers
app.get("/sellers/all", (req, res) => {
  const sql = "SELECT customer_id, client_name, city, category, state FROM customers ORDER BY client_name";

  db.all(sql, [], (err, sellers) => {
      if (err) {
          console.error("🚨 Error fetching sellers:", err.message);
          return res.status(500).json({ success: false, error: err.message });
      }

      res.json({ success: true, sellers: sellers.length > 0 ? sellers : [] });
  });
});





// 📌 API: Get Sellers by City
app.get("/sellers/city/:city_name", (req, res) => {
  const { city_name } = req.params;
  const cleanedCity = city_name.trim();

 // console.log(`🔍 Searching Sellers in City: '${cleanedCity}'`);

  // ✅ Step 1: Check if city exists in DB
  db.all("SELECT DISTINCT city FROM customers LIMIT 10", [], (err, cities) => {
      if (err) {
          console.error("🚨 Error fetching cities:", err.message);
          return res.status(500).json({ success: false, error: err.message });
      }
      // ✅ Step 2: Fetch sellers in the given city
      const sql = "SELECT customer_id, client_name FROM customers WHERE city = ? COLLATE NOCASE";
      db.all(sql, [cleanedCity], (err, rows) => {
          if (err) {
              console.error("🚨 Error fetching sellers:", err.message);
              return res.status(500).json({ success: false, error: err.message });
          }

       // console.log("📌 DB Rows:", rows);
          res.json({ success: true, sellers: rows.length > 0 ? rows : [] });
      });
  });
});



// 📌 API: Get buyers by City
app.get("/buyers/city/:city_name", (req, res) => {
  const { city_name } = req.params;
  const cleanedCity = city_name.trim();

 // console.log(`🔍 Searching buyer in City: '${cleanedCity}'`);

  // ✅ Step 1: Check if city exists in DB
  db.all("SELECT DISTINCT city FROM customers LIMIT 10", [], (err, cities) => {
      if (err) {
          console.error("🚨 Error fetching cities:", err.message);
          return res.status(500).json({ success: false, error: err.message });
      }
      // ✅ Step 2: Fetch buyer in the given city
      const sql = "SELECT customer_id, client_name FROM customers WHERE city = ? COLLATE NOCASE";
      db.all(sql, [cleanedCity], (err, rows) => {
          if (err) {
              console.error("🚨 Error fetching sellers:", err.message);
              return res.status(500).json({ success: false, error: err.message });
          }

        //console.log("📌 DB Rows:", rows);
          res.json({ success: true, buyers: rows.length > 0 ? rows : [] });
      });
  });
});



// 📌 Add a Transaction
app.post("/transactions/:fy", (req, res) => {
    const { fy } = req.params;
    const { sno , firm_id, financial_year, seller_id, buyer_id, date, item, packaging, qty, bqty, bhav, seller_rate, buyer_rate, payment_status } = req.body;

    // 🛑 Validate required fields
    if (!firm_id || !financial_year || !seller_id || !buyer_id || !date || !item || !packaging || !qty || !bhav || !seller_rate || !buyer_rate || !payment_status) {
        return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    // 💡 Ensure table name is safe (Prevents SQL injection)
    if (!/^transactions_FY\d{4}$/.test(`transactions_FY${fy}`)) {
        return res.status(400).json({ success: false, message: "Invalid financial year format." });
    }

    const seller_amount = qty * seller_rate;
    const buyer_amount = bqty * buyer_rate;
    const tableName = `transactions_FY${fy}`;

    // 📌 Insert Query
    const sql = `INSERT INTO ${tableName} 
    (sno, firm_id, financial_year, seller_id, buyer_id, date, item, packaging, qty, bqty, bhav, seller_rate, buyer_rate, seller_amount, buyer_amount, payment_status) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

db.run(sql, [sno, firm_id, financial_year, seller_id, buyer_id, date, item, packaging, qty, bqty, bhav, seller_rate, buyer_rate, seller_amount, buyer_amount, payment_status], function (err) {


   
        if (err) {
            console.error("🚨 Error inserting transaction:", err.message);
            return res.status(500).json({ success: false, error: err.message });
        }

        res.json({ success: true, message: "Transaction added!", transaction_id: this.lastID });
    });
});


// 📌 Get all transactions for a financial year of that firm
// GET /transactions?fy=2025&firm_id=1&page=1&limit=10
// 📌 API to fetch transactions with customer details
app.get("/transactions", (req, res) => {
    const { fy, firm_id, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
  
    if (!/^transactions_FY\d{4}$/.test(`transactions_FY${fy}`)) {
      return res.status(400).json({ success: false, message: "Invalid financial year format." });
    }
  
    const tableName = `transactions_FY${fy}`;
  
    const sql = `
  SELECT 
  t.transaction_id, 
  t.sno,
  t.firm_id, 
  t.financial_year, 
  t.date, 
  t.item, 
  t.packaging, 
  t.qty,
  t.bqty, 
  t.bhav,
  t.seller_rate, 
  t.buyer_rate, 
  t.seller_amount, 
  t.buyer_amount, 
  t.payment_status,
  seller.client_name AS seller_name,
  seller.state AS seller_state,
  seller.city AS seller_city,
  seller.category AS seller_category,
  buyer.client_name AS buyer_name,
  buyer.state AS buyer_state,
  buyer.city AS buyer_city,
  buyer.category AS buyer_category
FROM ${tableName} t
JOIN customers seller ON t.seller_id = seller.customer_id
JOIN customers buyer ON t.buyer_id = buyer.customer_id
WHERE t.firm_id = ?
ORDER BY t.date DESC
LIMIT ? OFFSET ?;
    `;

  
    db.all(sql, [firm_id, limit, offset], (err, rows) => {
      if (err) {
        console.error("🚨 Error fetching transactions:", err.message);
        return res.status(500).json({ success: false, error: err.message });
      }
  
      // Count total rows for pagination
      const countSql = `SELECT COUNT(*) AS total FROM ${tableName} WHERE firm_id = ?`;
      db.get(countSql, [firm_id], (err, row) => {
        if (err) {
          console.error("🚨 Error counting transactions:", err.message);
          return res.status(500).json({ success: false, error: err.message });
        }
  
        res.json({
          transactions: rows,
          total: row.total,
          currentPage: parseInt(page),
          totalPages: Math.ceil(row.total / limit)
        });
      });
    });
  });
  
// 📌 filtered transaction
app.get("/filteredTransactions", (req, res) => {
    const { fy, firm_id, page = 1, limit = 10, transaction_type, client_name, city, state } = req.query;
    const offset = (page - 1) * limit;

    if (!/^transactions_FY\d{4}$/.test(`transactions_FY${fy}`)) {
        return res.status(400).json({ success: false, message: "Invalid financial year format." });
    }

    const tableName = `transactions_FY${fy}`;
    
    let filters = ["t.firm_id = ?"];
    let values = [firm_id];

    // 🛠 Fix: Transaction type filter (Check BOTH buyer and seller roles)
    if (transaction_type) {
        if (transaction_type === "buyer") {
            filters.push("(buyer.category = 'buyer' OR seller.category = 'buyer')");
        } else if (transaction_type === "seller") {
            filters.push("(buyer.category = 'seller' OR seller.category = 'seller')");
        }
    }

    // Dynamic search filters
    if (client_name) {
        filters.push("(buyer.client_name LIKE ? OR seller.client_name LIKE ?)");
        values.push(`%${client_name}%`, `%${client_name}%`);
    }
    if (city) {
        filters.push("(buyer.city LIKE ? OR seller.city LIKE ?)");
        values.push(`%${city}%`, `%${city}%`);
    }
    if (state) {
        filters.push("(buyer.state LIKE ? OR seller.state LIKE ?)");
        values.push(`%${state}%`, `%${state}%`);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

    // Fetch filtered transactions
    const sql = `
        SELECT 
            t.transaction_id, t.firm_id, t.sno, t.financial_year, t.date, t.item, t.packaging, t.qty, t.bqty, t.bhav, 
            t.seller_rate, t.buyer_rate, t.seller_amount, t.buyer_amount, t.payment_status,
            seller.client_name AS seller_name, seller.state AS seller_state, seller.city AS seller_city, seller.category AS seller_category,
            buyer.client_name AS buyer_name, buyer.state AS buyer_state, buyer.city AS buyer_city, buyer.category AS buyer_category
        FROM ${tableName} t
        JOIN customers seller ON t.seller_id = seller.customer_id
        JOIN customers buyer ON t.buyer_id = buyer.customer_id
        ${whereClause}
        ORDER BY t.date DESC
        LIMIT ? OFFSET ?;
    `;

    db.all(sql, [...values, limit, offset], (err, rows) => {
        if (err) {
            console.error("🚨 Error fetching transactions:", err.message);
            return res.status(500).json({ success: false, error: err.message });
        }

        // Count total filtered transactions
        const countSql = `SELECT COUNT(*) AS total FROM ${tableName} t 
                          JOIN customers seller ON t.seller_id = seller.customer_id
                          JOIN customers buyer ON t.buyer_id = buyer.customer_id
                          ${whereClause}`;

        db.get(countSql, values, (err, row) => {
            if (err) {
                console.error("🚨 Error counting transactions:", err.message);
                return res.status(500).json({ success: false, error: err.message });
            }

            res.json({
                transactions: rows,
                total: row.total,
                currentPage: parseInt(page),
                totalPages: Math.ceil(row.total / limit),
            });
        });
    });
});

// 📌 API: Get Customer Transactions for print pagen
// 📌 API: Get Customer Transactions for Print Page
app.get("/api/customer-transactions", (req, res) => {
    const { fy, firm_id, customer_id } = req.query;

    if (!/^transactions_FY\d{4}$/.test(`transactions_FY${fy}`)) {
        return res.status(400).json({ success: false, message: "Invalid financial year format." });
    }

    const tableName = `transactions_FY${fy}`;

    const sql = `
        SELECT 
            t.transaction_id, 
            t.sno,
            t.date, 
            t.item, 
            t.packaging, 
            t.qty,
            t.bqty, 
            t.bhav,
            t.seller_rate, 
            t.buyer_rate, 
            t.seller_amount, 
            t.buyer_amount, 
            t.seller_id,
            t.buyer_id,
            t.Seller_Billed, 
            t.Buyer_Billed,
            seller.client_name AS seller_name,
            buyer.client_name AS buyer_name,
            seller.city AS seller_city,
            buyer.city AS buyer_city
        FROM ${tableName} t
        JOIN customers seller ON t.seller_id = seller.customer_id
        JOIN customers buyer ON t.buyer_id = buyer.customer_id
        WHERE t.firm_id = ? 
        AND (t.seller_id = ? OR t.buyer_id = ?) 
        ORDER BY t.sno DESC;
    `;

    db.all(sql, [firm_id, customer_id, customer_id], (err, rows) => {
        if (err) {
            console.error("🚨 Error fetching customer transactions:", err.message);
            return res.status(500).json({ success: false, error: err.message });
        }

        // Process transactions correctly
        const transactions = rows.map(txn => {
            let transactionType = "Not Applicable";
            let brokerageRate = txn.seller_rate;
            let amount = txn.seller_amount;
            let billedStatus = txn.Buyer_Billed; // Default to Buyer_Billed
            let fqty = txn.qty;

            if (txn.seller_id == customer_id && txn.buyer_id == customer_id) {
                // Customer is both Buyer & Seller → Use Buyer_Billed
                transactionType = "Not Applicable";
                billedStatus = txn.Buyer_Billed;
                fqty = txn.qty;
            } else if (txn.seller_id == customer_id) {
                // Customer is Seller → Use Seller_Billed
                transactionType = "Sold";
                brokerageRate = txn.seller_rate;
                amount = txn.seller_amount;
                billedStatus = txn.Seller_Billed;
                fqty = txn.qty;
            } else if (txn.buyer_id == customer_id) {
                // Customer is Buyer → Use Buyer_Billed
                transactionType = "Purchased";
                brokerageRate = txn.buyer_rate;
                amount = txn.buyer_amount;
                billedStatus = txn.Buyer_Billed;
                fqty = txn.bqty;
            }

            return {
                ...txn,
                transactionType,
                brokerageRate,
                amount,
                fqty,
                billedStatus // Correct Billed Status based on role
            };
        });

        res.json({ success: true, transactions });
    });
});


app.get("/api/transactions/last-sno", async (req, res) => {
    const { firm_id, financial_year } = req.query;

    if (!firm_id || !financial_year) {
        return res.status(400).json({ error: "Missing firm_id or financial_year" });
    }

    const tableName = `transactions_FY${financial_year}`;

    const query = `
        SELECT sno FROM ${tableName}
        WHERE firm_id = ?
        ORDER BY sno DESC
        LIMIT 1;
    `;

    try {
        db.get(query, [firm_id], (err, row) => {
            if (err) {
                console.error("❌ Error fetching last S.No:", err);
                return res.status(500).json({ error: "Database error" });
            }

            const lastSno = row ? row.sno : 0; // If no record, return 0
            res.json({ lastSno });
        });
    } catch (error) {
        console.error("❌ Unexpected error:", error);
        res.status(500).json({ error: "Server error" });
    }
});








// 📌 Delete a transaction
app.post('/api/transactions/delete', (req, res) => {
    const { tid, fy, firmId } = req.body;
    const userId = req.session.user ? req.session.user.uid : null;

    if (!userId) {
        return res.status(401).json({ success: false, message: "Not logged in" });
    }

    if (!tid || !fy || !firmId) {
        return res.status(400).json({ success: false, message: "Missing required parameters" });
    }

    const tableName = `transactions_FY${fy}`;
    const query = `DELETE FROM ${tableName} WHERE transaction_id = ? AND firm_id = ?`;

    db.run(query, [tid, firmId], function (err) {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ success: false, message: "Error deleting transaction" });
        }
        if (this.changes === 0) {
            return res.status(404).json({ success: false, message: "Transaction not found" });
        }
        res.json({ success: true, message: "Transaction deleted successfully" });
    });
});

// 📌 API: Get a single transaction by ID
app.get("/api/transactions/:tid", (req, res) => {
    const { tid } = req.params;
    const { fy } = req.query; // Financial year

    if (!tid || !fy) {
        return res.status(400).json({ success: false, message: "Transaction ID and Financial Year are required." });
    }

    const tableName = `transactions_FY${fy}`;
    const sql = `
        SELECT t.*, 
               s.client_name AS seller_name, 
               b.client_name AS buyer_name 
        FROM ${tableName} t
        JOIN customers s ON t.seller_id = s.customer_id
        JOIN customers b ON t.buyer_id = b.customer_id
        WHERE t.transaction_id = ?`;

    db.get(sql, [tid], (err, transaction) => {
        if (err) {
            console.error("🚨 Error fetching transaction:", err.message);
            return res.status(500).json({ success: false, error: err.message });
        }

        if (!transaction) {
            return res.status(404).json({ success: false, message: "Transaction not found." });
        }

        res.json({ success: true, transaction });
    });
});


// 📌 API: Update a transaction
app.post("/api/transactions/update", (req, res) => {
    const { tid, fy, firmId, seller_id, seller_rate, item, qty, bqty, bhav, date, packaging, buyer_id, buyer_rate } = req.body;

   // console.log("📝 Update Transaction:", req.body); 
    if (!tid || !fy || !seller_id || !buyer_id || !qty  || !bqty || !bhav || !seller_rate || !buyer_rate) {
        return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    const tableName = `transactions_FY${fy}`;
    const seller_amount = seller_rate * qty;
    const buyer_amount = buyer_rate * bqty;

    const sql = `
        UPDATE ${tableName} 
        SET seller_id = ?, seller_rate = ?, item = ?, qty = ?, bqty = ? , bhav = ?, date = ?, packaging = ?, 
            buyer_id = ?, buyer_rate = ?, seller_amount = ?, buyer_amount = ?
        WHERE transaction_id = ?`;

    db.run(
        sql,
        [seller_id, seller_rate, item, qty, bqty, bhav, date, packaging, buyer_id, buyer_rate, seller_amount, buyer_amount, tid],
        function (err) {
            if (err) {
                console.error("🚨 Error updating transaction:", err.message);
                return res.status(500).json({ success: false, error: err.message });
            }

            if (this.changes === 0) {
                return res.status(404).json({ success: false, message: "Transaction not found or no changes made." });
            }

            res.json({ success: true, message: "Transaction updated successfully." });
        }
    );
});

app.post("/api/transactions/markBilled", async (req, res) => {
    const { transactionIds, financialYear, customer_id } = req.body;

    if (!transactionIds || transactionIds.length === 0) {
        return res.status(400).json({ error: "No transactions selected." });
    }
    if (!financialYear) {
        return res.status(400).json({ error: "Financial year is missing." });
    }
    if (!customer_id) {
        return res.status(400).json({ error: "Customer ID is missing." });
    }

    try {
        const tableName = `transactions_FY${financialYear}`; // ✅ Table name defined here

        const placeholders = transactionIds.map(() => "?").join(",");
        const fetchSql = `SELECT transaction_id, seller_id, buyer_id FROM ${tableName} WHERE transaction_id IN (${placeholders})`;
    
        const transactions = await new Promise((resolve, reject) => {
            db.all(fetchSql, [...transactionIds], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        //console.log("Fetched Transactions Type:", typeof transactions);
        //console.log("Fetched Transactions:", Array.isArray(transactions) ? transactions : "Not an array!");

        if (!Array.isArray(transactions) || transactions.length === 0) {
            return res.status(500).json({ error: "No transactions found for the given IDs." });
        }

        let buyerTxnIds = [];
        let sellerTxnIds = [];

        transactions.forEach(txn => {
            if (txn.buyer_id == customer_id) {
                buyerTxnIds.push(txn.transaction_id);
            } else if (txn.seller_id == customer_id) {
                sellerTxnIds.push(txn.transaction_id);
            }
        });

        if (buyerTxnIds.length > 0) {
            const buyerPlaceholders = buyerTxnIds.map(() => "?").join(",");
            const updateBuyerSql = `UPDATE ${tableName} SET buyer_Billed = 'Yes' WHERE transaction_id IN (${buyerPlaceholders})`;
            await db.run(updateBuyerSql, buyerTxnIds);
        }

        if (sellerTxnIds.length > 0) {
            const sellerPlaceholders = sellerTxnIds.map(() => "?").join(",");
            const updateSellerSql = `UPDATE ${tableName} SET seller_Billed = 'Yes' WHERE transaction_id IN (${sellerPlaceholders})`;
            await db.run(updateSellerSql, sellerTxnIds);
        }

        res.json({ message: "Transactions marked as billed successfully." });

    } catch (error) {
        console.error("Error updating transactions:", error);
        res.status(500).json({ error: "Failed to update transactions." });
    }
});










// Serve static files from the 'public' directory (e.g., JS, CSS, images)
app.use(express.static(path.join(__dirname, 'public')));

// Fallback route for unmatched requests (optional, useful if you're working with a single-page application)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});



app.use(express.static('public'));  // Ensure static files are served (optional)

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
