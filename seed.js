//to entere sample data into the database

const db = require('./database');

// Insert sample data
db.run(
    `INSERT INTO firm (firm_name, account_no, mobile_no, ifsc_no, pan_no, bank_name, address, proprietor, email) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
        'Manav Brokers',          // firm_name
        '123456789',         // account_no
        '9425918012',        // mobile_no
        'ABCD123456',        // ifsc_no
        '22ABCDE1234FZ1',    // pan_no
        'IDFC',               // bank_name
        '32, Bhaktnagar Ujjain', // address
        'Hetal Shah',             // proprietor
        'firm3@xyz.com'      // email
    ],
    function (err) {
        if (err) {
            console.error('Error inserting firm data:', err.message);
        } else {
            console.log('Sample firm data inserted successfully');
        }
    }
);

// Close the database connection (optional but recommended)
db.close((err) => {
    if (err) {
        console.error('Error closing database:', err.message);
    } else {
        console.log('Database connection closed.');
    }
});
//to seed the database with sample data, run the following command in the terminal:
// node seed.js