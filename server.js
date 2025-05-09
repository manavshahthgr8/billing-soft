const express = require('express');
const app = express();
const bodyParser = require('body-parser');

const fs = require('fs-extra');
const sqlite3 = require('sqlite3');
const csv = require('fast-csv');
const archiver = require('archiver');


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

// ✅ API to fetch multiple customers by IDs
app.get('/api/customers', (req, res) => {
    const idsString = req.query.ids;  // Comma-separated IDs (e.g., "113,87,11,2")
    if (!idsString) {
        return res.status(400).json({ success: false, message: 'No customer IDs provided' });
    }

    const customerIds = idsString.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));

    if (customerIds.length === 0) {
        return res.status(400).json({ success: false, message: 'Invalid customer IDs' });
    }

    const placeholders = customerIds.map(() => '?').join(',');  // Creates ?,?,? for query
    const sql = `
        SELECT customer_id, category, client_name, contact, email, state, city, city_id
        FROM customers
        WHERE customer_id IN (${placeholders})
    `;

    db.all(sql, customerIds, (err, rows) => {
        if (err) {
            console.error('Error fetching customer details:', err.message);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        } else {
            res.json({ success: true, customers: rows });
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

// Fetch all cities without state filter
app.get('/city/all', (req, res) => {
    const query = `SELECT city_id, city_name FROM city ORDER BY LOWER(city_name) ASC`;

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Error fetching cities:', err.message);
            return res.status(500).json({ error: 'Failed to fetch cities.' });
        }

        if (rows.length === 0) {
            return res.status(404).json({ error: 'No cities found.' });
        }

        res.json(rows);
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
  
    const query = `SELECT city_id, city_name FROM city WHERE LOWER(state) = LOWER(?) ORDER BY LOWER(city_name) ASC`;

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

  //fetch customer for customer html
  app.get('/customers', (req, res) => {
    const { page = 1, limit = 10, search = '', column = 'client_name' } = req.query;
  
    const offset = (page - 1) * limit;
    const allowedColumns = ['client_name', 'city', 'state', 'category']; // Define valid columns for dynamic queries.
  
    if (!allowedColumns.includes(column)) {
      return res.status(400).json({ error: 'Invalid search column.' });
    }
  
    const searchQuery = search ? `%${search}%` : '%';
    const query = `
      SELECT customer_id, category, client_name, contact, email, state, city
      FROM customers
      WHERE ${column} LIKE ?
      ORDER BY client_name
      LIMIT ? OFFSET ?
    `;
  
    db.all(query, [searchQuery, parseInt(limit), parseInt(offset)], (err, rows) => {
      if (err) {
        console.error('Error fetching customers:', err.message);
        return res.status(500).json({ error: 'Failed to fetch customers.' });
      }
  
      // Count total customers for pagination info.
      const countQuery = `SELECT COUNT(*) as total FROM customers WHERE ${column} LIKE ?`;
      db.get(countQuery, [searchQuery], (err, result) => {
        if (err) {
          console.error('Error counting customers:', err.message);
          return res.status(500).json({ error: 'Failed to count customers.' });
        }
  
        res.json({
          customers: rows,
          total: result.total,
          currentPage: parseInt(page),
          totalPages: Math.ceil(result.total / limit),
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
  // 📌 DELETE Endpoint: Move Customer to Deleted Table
  // ✅ Endpoint for deleting customer (move + hard delete)
app.delete('/api/customers/:customerId', async (req, res) => {
    const customerId = req.params.customerId;

    if (!customerId) {
        return res.status(400).json({ message: "❌ Invalid customer ID." });
    }

    try {
        // 🔥 1. Fetch customer details before moving
        const customerQuery = `SELECT * FROM customers WHERE customer_id = ?`;
        const customer = await new Promise((resolve, reject) => {
            db.get(customerQuery, [customerId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!customer) {
            return res.status(404).json({ message: "❌ Customer not found." });
        }

        // 🔥 2. Check for existing transactions across all years
        const fyQuery = `SELECT startYear FROM financial_years`;
        const years = await new Promise((resolve, reject) => {
            db.all(fyQuery, (err, rows) => {
                if (err) reject(err);
                else resolve(rows.map(row => row.startYear));
            });
        });

        const txnYears = [];

        for (const year of years) {
            const tableName = `transactions_FY${year}`;
            
            const txnCheckQuery = `
                SELECT COUNT(*) AS txn_count FROM ${tableName} 
                WHERE seller_id = ? OR buyer_id = ?
            `;

            const txnCount = await new Promise((resolve, reject) => {
                db.get(txnCheckQuery, [customerId, customerId], (err, row) => {
                    if (err) reject(err);
                    else resolve(row.txn_count);
                });
            });

            if (txnCount > 0) {
                txnYears.push(year);
            }
        }

        // 🔥 3. Handle case when transactions exist
        if (txnYears.length > 0) {
            return res.status(409).json({
                message: "⚠️ Customer has transactions in multiple years.",
                txnYears
            });
        }

        // ✅ 4. No transactions → Move to `deleted_customers` & Hard Delete
        const moveQuery = `
            INSERT OR IGNORE INTO deleted_customers (
                customer_id, category, client_name, contact, email, state, city, city_id, deleted_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `;

        await new Promise((resolve, reject) => {
            db.run(moveQuery, [
                customer.customer_id,
                customer.category,
                customer.client_name,
                customer.contact,              // ✅ Added contact
                customer.email,                // ✅ Added email
                customer.state,
                customer.city,
                customer.city_id
            ], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        console.log(`✅ Customer moved to deleted_customers: ${customerId}`);

        // ✅ 5. Hard delete the customer from `customers`
        const deleteQuery = `DELETE FROM customers WHERE customer_id = ?`;
        await new Promise((resolve, reject) => {
            db.run(deleteQuery, [customerId], function (err) {
                if (err) reject(err);
                else resolve();
            });
        });

        console.log(`✅ Customer hard deleted: ${customerId}`);

        res.status(200).json({
            message: "✅ Customer moved to deleted_customers and hard deleted."
        });

    } catch (error) {
        console.error("❌ Error deleting customer:", error);
        res.status(500).json({ message: "❌ Internal server error." });
    }
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

          res.json({ success:true, id: this.lastID, startYear, endYear , message: "Status : Created" });
      }
  );
});

app.post("/bills/generate/:financialYear", async (req, res) => {
    const { financialYear } = req.params;
    const transactionsTable = `transactions_FY${financialYear}`;
    const billTable = `BillNo_FY${financialYear}`;

    try {
        const query = `
            INSERT INTO ${billTable} (customer_id)
            SELECT DISTINCT c.customer_id
            FROM customers c
            JOIN (
                SELECT seller_id AS customer_id FROM ${transactionsTable}
                UNION
                SELECT buyer_id FROM ${transactionsTable}
            ) t ON c.customer_id = t.customer_id
            WHERE c.customer_id NOT IN (SELECT customer_id FROM ${billTable});
        `;

        db.run(query, [], (err) => {
            if (err) {
                console.error("❌ Error inserting missing bill numbers:", err);
                return res.status(500).json({ success: false, message: "Database error" });
            }
            res.json({ success: true, message: "Missing bill numbers inserted successfully" });
        });

    } catch (error) {
        console.error("❌ API Error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});
app.get("/bills/:financialYear/:customerId", async (req, res) => {
    const { financialYear, customerId } = req.params;
    const billTable = `BillNo_FY${financialYear}`;

    try {
        const query = `SELECT bill_id FROM ${billTable} WHERE customer_id = ?`;
        db.get(query, [customerId], (err, row) => {
            if (err) {
                console.error("❌ Error fetching Bill ID:", err);
                return res.status(500).json({ success: false, message: "Database error" });
            }
            if (row) {
                res.json({ success: true, bill_id: row.bill_id });
            } else {
                res.json({ success: false, message: "Bill ID not found" });
            }
        });
    } catch (error) {
        console.error("❌ API Error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});





// 📌 Delete a financial year
app.delete("/financial-years/:startYear", (req, res) => {
    const { startYear } = req.params;

    db.run("DELETE FROM financial_years WHERE startYear = ?", [startYear], function (err) {
        if (err) return res.status(500).json({ error: err.message });

        // Drop transactions and bill tables
        const transactionsTable = `transactions_FY${startYear}`;
        const billTable = `BillNo_FY${startYear}`;
        db.run(`DROP TABLE IF EXISTS ${transactionsTable}`);
        db.run(`DROP TABLE IF EXISTS ${billTable}`);

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

app.get("/customers/all/orderbycity/:financialYear", (req, res) => {
    const { financialYear } = req.params;
    const billTable = `BillNo_FY${financialYear}`;

    const sql = `
        SELECT c.customer_id, c.client_name AS name, c.city, c.state, b.bill_id
        FROM customers c
        INNER JOIN ${billTable} b ON c.customer_id = b.customer_id
        ORDER BY c.city COLLATE NOCASE ASC, c.client_name COLLATE NOCASE ASC;
    `;

    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error("❌ Error fetching customers:", err);
            return res.status(500).json({ success: false, message: "Database error" });
        }
        res.json({ success: true, customers: rows });
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

// 📌 API: Get Customers by City
app.get("/customers/city", (req, res) => {
    const { city_id } = req.query;

    if (!city_id) {
        return res.status(400).json({ success: false, message: "City ID is required." });
    }

    const sql = "SELECT customer_id, client_name, city, category, state FROM customers WHERE city_id = ? ORDER BY client_name";

    db.all(sql, [city_id], (err, customers) => {
        if (err) {
            console.error("🚨 Error fetching customers by city:", err.message);
            return res.status(500).json({ success: false, error: err.message });
        }

        res.json({ success: true, customers: customers.length > 0 ? customers : [] });
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
// 📌 Add a Transaction
app.post("/transactions/:fy", (req, res) => {
    const { fy } = req.params;

    // 🛑 Destructure all expected fields from request body
    const {
        sno, firm_id, financial_year, seller_id, buyer_id, date,
        item, packaging,
        S_QuintQty, B_QuintQty, S_QuintRate, B_QuintRate,
        S_QuintAmount, B_QuintAmount,
        qty, bqty, bhav, seller_rate, buyer_rate,
        seller_amount, buyer_amount,
        payment_status
    } = req.body;

    // ✅ Validate key required fields (you can expand this further as needed)
    if (!firm_id || !financial_year || !seller_id || !buyer_id || !date || !item || !payment_status) {
        return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    // 💡 Validate financial year table name
    if (!/^transactions_FY\d{4}$/.test(`transactions_FY${fy}`)) {
        return res.status(400).json({ success: false, message: "Invalid financial year format." });
    }

    const tableName = `transactions_FY${fy}`;

    // ✅ Check for duplicates
    const checkDuplicateSql = `SELECT COUNT(*) AS count FROM ${tableName} WHERE sno = ? AND firm_id = ?`;

    db.get(checkDuplicateSql, [sno, firm_id], (err, row) => {
        if (err) {
            console.error("🚨 Error checking for duplicates:", err.message);
            return res.status(500).json({ success: false, error: err.message });
        }

        if (row.count > 0) {
            console.warn(`⚠️ Duplicate transaction detected for SNO: ${sno}, Firm ID: ${firm_id}`);
            return res.status(409).json({
                success: false,
                message: `Duplicate transaction detected for SNO: ${sno} in Firm ID: ${firm_id}`
            });
        }

        // 🧾 Insert Transaction
        const insertSql = `
            INSERT INTO ${tableName} (
                sno, firm_id, financial_year, seller_id, buyer_id, date,
                item, packaging,
                S_QuintQty, B_QuintQty, S_QuintRate, B_QuintRate,
                S_QuintAmount, B_QuintAmount,
                qty, bqty, bhav, seller_rate, buyer_rate,
                seller_amount, buyer_amount,
                payment_status, Seller_Billed, Buyer_Billed
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Not', 'Not')
        `;

        const values = [
            sno, firm_id, financial_year, seller_id, buyer_id, date,
            item, packaging,
            S_QuintQty, B_QuintQty, S_QuintRate, B_QuintRate,
            S_QuintAmount, B_QuintAmount,
            qty, bqty, bhav, seller_rate, buyer_rate,
            seller_amount, buyer_amount,
            payment_status
        ];

        db.run(insertSql, values, function (err) {
            if (err) {
                console.error("🚨 Error inserting transaction:", err.message);
                return res.status(500).json({ success: false, error: err.message });
            }

            res.json({ success: true, message: "Transaction added!", transaction_id: this.lastID });
        });
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
  t.S_QuintQty,
  t.B_QuintQty,
    t.S_QuintRate,
    t.B_QuintRate,
    t.S_QuintAmount,
    t.B_QuintAmount,
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
ORDER BY t.sno DESC
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
    const { fy, firm_id, page = 1, limit = 10, transaction_type, client_name, city, state, sno } = req.query;
    const offset = (page - 1) * limit;

    if (!/^transactions_FY\d{4}$/.test(`transactions_FY${fy}`)) {
        return res.status(400).json({ success: false, message: "Invalid financial year format." });
    }

    const tableName = `transactions_FY${fy}`;
    
    let filters = ["t.firm_id = ?"];
    let values = [firm_id];

    // ✅ Transaction type filter
    if (transaction_type) {
        if (transaction_type === "buyer") {
            filters.push("(buyer.category = 'buyer' OR seller.category = 'buyer')");
        } else if (transaction_type === "seller") {
            filters.push("(buyer.category = 'seller' OR seller.category = 'seller')");
        }
    }

    // ✅ Dynamic search filters
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
    
    // ✅ New Sno Filter
    if (sno) {
        filters.push("t.sno = ?");
        values.push(sno);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

    // ✅ Fetch filtered transactions
    const sql = `
        SELECT 
            t.transaction_id, t.firm_id, t.sno, t.financial_year, t.date, t.item, t.packaging, t.qty, t.bqty, t.bhav, 
            t.seller_rate, t.buyer_rate, t.seller_amount, t.buyer_amount, t.payment_status,t.S_QuintQty, t.B_QuintQty, t.S_QuintRate, t.B_QuintRate,
            t.S_QuintAmount, t.B_QuintAmount,
            seller.client_name AS seller_name, seller.state AS seller_state, seller.city AS seller_city, seller.category AS seller_category,
            buyer.client_name AS buyer_name, buyer.state AS buyer_state, buyer.city AS buyer_city, buyer.category AS buyer_category
        FROM ${tableName} t
        JOIN customers seller ON t.seller_id = seller.customer_id
        JOIN customers buyer ON t.buyer_id = buyer.customer_id
        ${whereClause}
        ORDER BY t.sno DESC
        LIMIT ? OFFSET ?;
    `;

    db.all(sql, [...values, limit, offset], (err, rows) => {
        if (err) {
            console.error("🚨 Error fetching transactions:", err.message);
            return res.status(500).json({ success: false, error: err.message });
        }

        // ✅ Count total filtered transactions
        const countSql = `
            SELECT COUNT(*) AS total 
            FROM ${tableName} t
            JOIN customers seller ON t.seller_id = seller.customer_id
            JOIN customers buyer ON t.buyer_id = buyer.customer_id
            ${whereClause}
        `;

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
// 📌 API: Get Customer Transactions for Print Page with Formatted Dates
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
            strftime('%d-%m-%Y', t.date) AS date,     -- ✅ Formatted date
            t.item, 
            t.packaging, 
            t.S_QuintQty,
            t.B_QuintQty,
            t.S_QuintRate,
            t.B_QuintRate,
            t.S_QuintAmount,
            t.B_QuintAmount,
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
        ORDER BY t.sno ASC;
    `;

    db.all(sql, [firm_id, customer_id, customer_id], (err, rows) => {
        if (err) {
            console.error("🚨 Error fetching customer transactions:", err.message);
            return res.status(500).json({ success: false, error: err.message });
        }

        // 🚀 Ensure all dates are reformatted in case of inconsistencies
        const transactions = rows.map(txn => {
            let transactionType = "Not Applicable";
            let brokerageRate = txn.seller_rate;
            let amount = txn.seller_amount;
            let billedStatus = txn.Buyer_Billed;  
            let fqty = txn.qty;
            let fQuintQty = txn.S_QuintQty;
            let fQuintRate = txn.S_QuintRate;
            let fQuintAmount = txn.S_QuintAmount;

            if (txn.seller_id == customer_id && txn.buyer_id == customer_id) {
                transactionType = "Not Applicable";
                billedStatus = txn.Buyer_Billed;
                fqty = txn.qty;
                fQuintQty = txn.S_QuintQty;
                fQuintRate = txn.S_QuintRate;
                fQuintAmount = txn.S_QuintAmount;
            } else if (txn.seller_id == customer_id) {
                transactionType = "Sold";
                brokerageRate = txn.seller_rate;
                amount = txn.seller_amount;
                billedStatus = txn.Seller_Billed;
                fqty = txn.qty;
                fQuintQty = txn.S_QuintQty;
                fQuintRate = txn.S_QuintRate;
                fQuintAmount = txn.S_QuintAmount;
            } else if (txn.buyer_id == customer_id) {
                transactionType = "Purchased";
                brokerageRate = txn.buyer_rate;
                amount = txn.buyer_amount;
                billedStatus = txn.Buyer_Billed;
                fqty = txn.bqty;
                fQuintQty = txn.B_QuintQty;
                fQuintRate = txn.B_QuintRate;
                fQuintAmount = txn.B_QuintAmount;
            }

            // ✅ Force format date again in JS as a failsafe 
            let formattedDate = txn.date;
            if (txn.date.includes('-') && txn.date.split('-')[0].length === 4) {
                const [yyyy, mm, dd] = txn.date.split('-');
                formattedDate = `${dd}-${mm}-${yyyy}`;
            }

            return {
                ...txn,
                date: formattedDate,   // ✅ Consistent date format
                transactionType,
                brokerageRate,
                amount,
                fqty,
                fQuintQty,
                fQuintAmount,
                fQuintRate,
                billedStatus
            };
        });

        res.json({ success: true, transactions });
    });
});



app.get("/api/customer-billing-status", (req, res) => {
    const { fy, firm_id, customer_id } = req.query;

    if (!/^transactions_FY\d{4}$/.test(`transactions_FY${fy}`)) {
        return res.status(400).json({ success: false, message: "Invalid financial year format." });
    }

    const tableName = `transactions_FY${fy}`;

    const sql = `
        SELECT 
            -- Seller Billed/Unbilled
            SUM(CASE WHEN t.seller_id = ? AND t.seller_id <> t.buyer_id AND COALESCE(t.Seller_Billed, 'Not') = 'Yes' THEN t.seller_amount ELSE 0 END) AS seller_billed,
            SUM(CASE WHEN t.seller_id = ? AND t.seller_id <> t.buyer_id AND COALESCE(t.Seller_Billed, 'Not') = 'Not' THEN t.seller_amount ELSE 0 END) AS seller_unbilled,

            -- Buyer Billed/Unbilled
            SUM(CASE WHEN t.buyer_id = ? AND t.seller_id <> t.buyer_id AND COALESCE(t.Buyer_Billed, 'Not') = 'Yes' THEN t.buyer_amount ELSE 0 END) AS buyer_billed,
            SUM(CASE WHEN t.buyer_id = ? AND t.seller_id <> t.buyer_id AND COALESCE(t.Buyer_Billed, 'Not') = 'Not' THEN t.buyer_amount ELSE 0 END) AS buyer_unbilled,

            -- Seller Qtl Billed/Unbilled
            SUM(CASE WHEN t.seller_id = ? AND t.seller_id <> t.buyer_id AND COALESCE(t.Seller_Billed, 'Not') = 'Yes' THEN t.S_QuintAmount ELSE 0 END) AS seller_billed_qtl,
            SUM(CASE WHEN t.seller_id = ? AND t.seller_id <> t.buyer_id AND COALESCE(t.Seller_Billed, 'Not') = 'Not' THEN t.S_QuintAmount ELSE 0 END) AS seller_unbilled_qtl,

            -- Buyer Qtl Billed/Unbilled
            SUM(CASE WHEN t.buyer_id = ? AND t.seller_id <> t.buyer_id AND COALESCE(t.Buyer_Billed, 'Not') = 'Yes' THEN t.B_QuintAmount ELSE 0 END) AS buyer_billed_qtl,
            SUM(CASE WHEN t.buyer_id = ? AND t.seller_id <> t.buyer_id AND COALESCE(t.Buyer_Billed, 'Not') = 'Not' THEN t.B_QuintAmount ELSE 0 END) AS buyer_unbilled_qtl,

            -- Not Applicable (seller = buyer)
            SUM(CASE WHEN t.seller_id = ? AND t.buyer_id = ? AND COALESCE(t.Buyer_Billed, 'Not') = 'Not' THEN t.seller_amount ELSE 0 END) AS not_applicable_unbilled,
            SUM(CASE WHEN t.seller_id = ? AND t.buyer_id = ? AND COALESCE(t.Buyer_Billed, 'Not') = 'Yes' THEN t.seller_amount ELSE 0 END) AS not_applicable_billed,

            SUM(CASE WHEN t.seller_id = ? AND t.buyer_id = ? AND COALESCE(t.Buyer_Billed, 'Not') = 'Not' THEN t.S_QuintAmount ELSE 0 END) AS not_applicable_unbilled_qtl,
            SUM(CASE WHEN t.seller_id = ? AND t.buyer_id = ? AND COALESCE(t.Buyer_Billed, 'Not') = 'Yes' THEN t.S_QuintAmount ELSE 0 END) AS not_applicable_billed_qtl,

            -- Transaction counts
            COUNT(CASE WHEN t.seller_id = ? AND t.seller_id <> t.buyer_id AND COALESCE(t.Seller_Billed, 'Not') = 'Yes' THEN 1 END) AS seller_billed_txn_count,
            COUNT(CASE WHEN t.seller_id = ? AND t.seller_id <> t.buyer_id AND COALESCE(t.Seller_Billed, 'Not') = 'Not' THEN 1 END) AS seller_unbilled_txn_count,
            COUNT(CASE WHEN t.buyer_id = ? AND t.seller_id <> t.buyer_id AND COALESCE(t.Buyer_Billed, 'Not') = 'Yes' THEN 1 END) AS buyer_billed_txn_count,
            COUNT(CASE WHEN t.buyer_id = ? AND t.seller_id <> t.buyer_id AND COALESCE(t.Buyer_Billed, 'Not') = 'Not' THEN 1 END) AS buyer_unbilled_txn_count,
            COUNT(CASE WHEN t.seller_id = ? AND t.buyer_id = ?  AND COALESCE(t.Buyer_Billed, 'Not') = 'Not' THEN 1 END) AS not_applicable_unbilled_txn_count,
            COUNT(CASE WHEN t.seller_id = ? AND t.buyer_id = ?  AND COALESCE(t.Buyer_Billed, 'Not') = 'Yes' THEN 1 END) AS not_applicable_billed_txn_count
        FROM ${tableName} t
        WHERE t.firm_id = ? AND (t.seller_id = ? OR t.buyer_id = ?);
    `;

    // Exactly 27 parameters:
    const params = [
        customer_id, // 1 seller billed
        customer_id, // 2 seller unbilled

        customer_id, // 3 buyer billed
        customer_id, // 4 buyer unbilled

        customer_id, // 5 seller qtl billed
        customer_id, // 6 seller qtl unbilled

        customer_id, // 7 buyer qtl billed
        customer_id, // 8 buyer qtl unbilled

        customer_id, // 9 not applicable unbilled
        customer_id, // 10

        customer_id, // 11 not applicable billed
        customer_id, // 12

        customer_id, // 13 not applicable unbilled qtl
        customer_id, // 14

        customer_id, // 15 not applicable billed qtl
        customer_id, // 16

        customer_id, // 17 seller billed count
        customer_id, // 18 seller unbilled count
        customer_id, // 19 buyer billed count
        customer_id, // 20 buyer unbilled count

        customer_id,customer_id,
        customer_id,customer_id,

        firm_id,      // 21 WHERE
        customer_id,  // 22 WHERE seller_id = ?
        customer_id   // 23 WHERE buyer_id = ?
    ];

    db.get(sql, params, (err, row) => {
        if (err) {
            console.error("SQL error:", err.message);
            return res.status(500).json({ success: false, error: err.message });
        }

        const safe = (v) => v || 0;
        const result = {
            success: true,
            billedAmount: safe(row?.seller_billed) + safe(row?.buyer_billed) + safe(row?.not_applicable_billed),
            unbilledAmount: safe(row?.seller_unbilled) + safe(row?.buyer_unbilled) + safe(row?.not_applicable_unbilled),
            QtlBilledAmount: safe(row?.seller_billed_qtl) + safe(row?.buyer_billed_qtl) + safe(row?.not_applicable_billed_qtl),
            QtlUnbilledAmount: safe(row?.seller_unbilled_qtl) + safe(row?.buyer_unbilled_qtl) + safe(row?.not_applicable_unbilled_qtl),
            billedTxnCount: safe(row?.seller_billed_txn_count) + safe(row?.buyer_billed_txn_count)+ safe(row?.not_applicable_billed_txn_count),
            unbilledTxnCount: safe(row?.seller_unbilled_txn_count) + safe(row?.buyer_unbilled_txn_count) + safe(row?.not_applicable_unbilled_txn_count),
        };

        res.json(result);
    });
});



app.get("/sellers/active/:financialYear", async (req, res) => {
    const { financialYear } = req.params;
    const tableName = `transactions_FY${financialYear}`;

    // Validate financial year format
    if (!/^\d{4}$/.test(financialYear)) {
        return res.status(400).json({ success: false, message: "Invalid financial year format" });
    }

    try {
        // Fetch distinct customer IDs from transactions (both seller & buyer)
        const query = `
            SELECT DISTINCT customer_id, client_name, state, city, category
            FROM customers 
            WHERE customer_id IN (
                SELECT DISTINCT seller_id FROM ${tableName}
                UNION
                SELECT DISTINCT buyer_id FROM ${tableName}
            )
            ORDER BY client_name COLLATE NOCASE;
        `;

        db.all(query, [], (err, rows) => {
            if (err) {
                console.error("❌ Error fetching active customers:", err);
                return res.status(500).json({ success: false, message: "Database error" });
            }

            res.json({ success: true, sellers: rows });
        });

    } catch (error) {
        console.error("❌ API Error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});





app.get("/api/transactions/last-sno", async (req, res) => {
    const { firm_id, financial_year } = req.query;

    if (!firm_id || !financial_year) {
        return res.status(400).json({ error: "Missing firm_id or financial_year" });
    }

    const tableName = `transactions_FY${financial_year}`;

    const query = `
        SELECT sno,
        date
        FROM ${tableName}
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
            const lastDate = row ? row.date : null;
            res.json({ lastSno , lastDate });
        });
    } catch (error) {
        console.error("❌ Unexpected error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

app.get("/lastTransaction/details", (req, res) => {
    const { sno, fy, firm_id } = req.query;

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
        t.S_QuintQty,
        t.B_QuintQty,
        t.S_QuintRate,
        t.B_QuintRate,
        t.S_QuintAmount,
        t.B_QuintAmount,
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
    WHERE t.sno = ? AND t.firm_id = ?;
    `;

    db.get(sql, [sno, firm_id], (err, row) => {
        if (err) {
            console.error("🚨 Error fetching transaction details:", err.message);
            return res.status(500).json({ success: false, error: err.message });
        }
        if (!row) {
            return res.status(404).json({ success: false, message: "Transaction not found." });
        }
        res.json({ success: true, transaction: row });
    });
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
    const {
        tid, fy, firmId, seller_id, seller_rate, item, qty, bqty, bhav, date, packaging,
        buyer_id, buyer_rate,
        S_QuintQty, B_QuintQty, S_QuintRate, B_QuintRate,
        S_QuintAmount, B_QuintAmount
    } = req.body;

    if (!tid || !fy || !seller_id || !buyer_id || !qty || !bqty || !bhav || !S_QuintQty || !B_QuintQty || !S_QuintRate || !B_QuintRate) {
        return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    const tableName = `transactions_FY${fy}`;

    const sql = `
        UPDATE ${tableName}
        SET
            seller_id = ?, seller_rate = ?, item = ?, qty = ?, bqty = ?, bhav = ?,
            date = ?, packaging = ?, buyer_id = ?, buyer_rate = ?,
            seller_amount = ?, buyer_amount = ?,
            S_QuintQty = ?, B_QuintQty = ?, S_QuintRate = ?, B_QuintRate = ?,
            S_QuintAmount = ?, B_QuintAmount = ?,
            Seller_Billed = 'Not', Buyer_Billed = 'Not'
        WHERE transaction_id = ?`;

    const params = [
        seller_id, seller_rate, item, qty, bqty, bhav,
        date, packaging, buyer_id, buyer_rate,
        seller_rate * qty, buyer_rate * bqty,
        S_QuintQty, B_QuintQty, S_QuintRate, B_QuintRate,
        S_QuintAmount, B_QuintAmount,
        tid
    ];

    db.run(sql, params, function (err) {
        if (err) {
            console.error("🚨 Error updating transaction:", err.message);
            return res.status(500).json({ success: false, error: err.message });
        }

        if (this.changes === 0) {
            return res.status(404).json({ success: false, message: "Transaction not found or no changes made." });
        }

        res.json({ success: true, message: "Transaction updated successfully. Billing status reset." });
    });
});


//special api for multiple customer
// ✅ API: Mark Multiple Customers as Billed
app.post("/api/transactions/markMultipleBilled", async (req, res) => {
    const { customerTransactions, financialYear } = req.body;

    if (!customerTransactions || Object.keys(customerTransactions).length === 0) {
        return res.status(400).json({ error: "No customer transactions provided." });
    }

    if (!financialYear) {
        return res.status(400).json({ error: "Financial year is missing." });
    }

    try {
        const tableName = `transactions_FY${financialYear}`;
        
        // ✅ Batch update for all customers
        const updatePromises = [];

        for (const [customerId, transactionIds] of Object.entries(customerTransactions)) {
            if (!transactionIds.length) continue;

            const placeholders = transactionIds.map(() => "?").join(",");
            
            const fetchSql = `
                SELECT transaction_id, seller_id, buyer_id 
                FROM ${tableName} 
                WHERE transaction_id IN (${placeholders})
            `;

            const transactions = await new Promise((resolve, reject) => {
                db.all(fetchSql, transactionIds, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });

            if (!transactions.length) continue;

            const buyerTxnIds = [];
            const sellerTxnIds = [];

            transactions.forEach(txn => {
                if (txn.buyer_id == customerId) {
                    buyerTxnIds.push(txn.transaction_id);
                } else if (txn.seller_id == customerId) {
                    sellerTxnIds.push(txn.transaction_id);
                }
            });

            if (buyerTxnIds.length) {
                const buyerSql = `
                    UPDATE ${tableName} 
                    SET buyer_Billed = 'Yes' 
                    WHERE transaction_id IN (${buyerTxnIds.map(() => "?").join(",")})
                `;
                updatePromises.push(db.run(buyerSql, buyerTxnIds));
            }

            if (sellerTxnIds.length) {
                const sellerSql = `
                    UPDATE ${tableName} 
                    SET seller_Billed = 'Yes' 
                    WHERE transaction_id IN (${sellerTxnIds.map(() => "?").join(",")})
                `;
                updatePromises.push(db.run(sellerSql, sellerTxnIds));
            }
        }

        // ✅ Execute all updates in parallel
        await Promise.all(updatePromises);

        res.json({ message: "All customers marked as billed successfully." });

    } catch (error) {
        console.error("Error marking multiple customers as billed:", error);
        res.status(500).json({ error: "Failed to update multiple transactions." });
    }
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

// 📌 GET Setting by ID
app.get("/api/settings/:id", (req, res) => {
    const id = req.params.id;
    db.get("SELECT * FROM settings WHERE id = ?", [id], (err, row) => {
        if (err) {
            console.error("❌ Error fetching setting:", err.message);
            return res.status(500).json({ error: "Database error" });
        }
        if (!row) return res.status(404).json({ error: "Setting not found" });
        res.json(row);
    });
});

// 📌 UPDATE Setting by ID
app.post("/api/settings/:id", (req, res) => {
    const id = req.params.id;
    const newValue = req.body.value;

    db.run(
        "UPDATE settings SET value = ? WHERE id = ?",
        [newValue, id],
        function (err) {
            if (err) {
                console.error("❌ Error updating setting:", err.message);
                return res.status(500).json({ error: "Database error" });
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: "Setting not found" });
            }
            res.json({ success: true, message: "Setting updated" });
        }
    );
});

// Correct path to billing.db
const DATABASE_PATH = path.join(__dirname, 'billing.db');

// Full Database Backup API
app.get('/api/backup/database', (req, res) => {
    res.download(DATABASE_PATH, 'billing.db', (err) => {
        if (err) {
            console.error('Database download failed:', err);
            res.status(500).send('Error downloading database.');
        }
    });
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
