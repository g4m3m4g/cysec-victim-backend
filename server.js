require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const axios = require('axios');

const fs = require('fs');
const app = express();

app.use(cors());
app.use(express.json());

// TiDB Connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: {
        ca: process.env.DB_CA
    }
});

db.connect(err => {
    if (err) {
        console.error('Database connection failed:', err);
    } else {
        console.log('Connected to TiDB');
    }
});

// Create Employee Table
db.query(`CREATE TABLE IF NOT EXISTS employee (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    position VARCHAR(50) NOT NULL,
    salary DECIMAL(10,2) NOT NULL
)`, err => {
    if (err) console.error('Error creating table:', err);
    else console.log('Employee table ready');
});

// Login Route
/*
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.query(
        `SELECT * FROM user WHERE username = '${username}' AND password = '${password}'`, // ⚠️ SQL Injection for testing
        (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            if (results.length > 0) res.json(results[0]); // Return employee data
            else res.status(401).json({ error: 'Invalid credentials' });
        }
    );
});
*/

/*
app.post('/login', (req, res) => {
    const { username, password } = req.body;
  
    // Query the user table to find the user by username
    db.query(
      'SELECT * FROM user WHERE username = ?', [username],
      (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
  
        // If user exists, check if the passwords match
        if (results.length > 0) {
          const user = results[0];
  
          // Compare the passwords directly (plain text comparison)
          if (password === user.password) {
            // Query the employee table using the user.id to get employee info
            db.query(
              'SELECT * FROM employee WHERE id = ?', [user.id],
              (err, employeeResults) => {
                if (err) return res.status(500).json({ error: err.message });
                if (employeeResults.length > 0) {
                  const employee = employeeResults[0];
                  res.json({
                    id: employee.id,
                    name: employee.name,
                    email: employee.email,
                    phone: employee.phone,
                    position: employee.position,
                    salary: employee.salary,
                    role: user.role,  // User role from user table
                  });
                } else {
                  res.status(404).json({ error: 'Employee not found' });
                }
              }
            );
          } else {
            res.status(401).json({ error: 'Invalid credentials' });
          }
        } else {
          res.status(401).json({ error: 'Invalid credentials' });
        }
      }
    );
  });
  */


app.post('/login', (req, res) => {
    const { username, password } = req.body;
  
    // Query the user table to find the user by username
    db.query(
      'SELECT * FROM user WHERE username = ?', [username],
      (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
  
        // If user exists, check if the passwords match
        if (results.length > 0) {
          const user = results[0];
  
          // Compare the passwords directly (plain text comparison)
          if (password === user.password) {
            if (user.role === 'admin') {
              // If user is an admin, return all employees
              db.query('SELECT * FROM employee', (err, employees) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ role: user.role, employees });
              });
            } else {
              // Query the employee table using the user.id to get employee info
              db.query(
                'SELECT * FROM employee WHERE id = ?', [user.id],
                (err, employeeResults) => {
                  if (err) return res.status(500).json({ error: err.message });
                  if (employeeResults.length > 0) {
                    const employee = employeeResults[0];
                    res.json({
                      id: employee.id,
                      name: employee.name,
                      email: employee.email,
                      phone: employee.phone,
                      position: employee.position,
                      salary: employee.salary,
                      role: user.role,
                    });
                  } else {
                    res.status(404).json({ error: 'Employee not found' });
                  }
                }
              );
            }
          } else {
            res.status(401).json({ error: 'Invalid credentials' });
          }
        } else {
          res.status(401).json({ error: 'Invalid credentials' });
        }
      }
    );
  });
  

  /*
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    console.log(1);
    db.query('SELECT * FROM user WHERE username = ?', [username], (err, results) => {
      console.log(2);
        if (err) return res.status(500).json({ error: err.message });

        if (results.length > 0) {
          console.log(3);
            const user = results[0];

            if (password === user.password) {
              console.log(4);
                if (user.role === 'admin') {
                  console.log(5);
                  // Use an API to get the list of all employees
                    axios.get('https://cysec-victim-backend.onrender.com/employees')  // Replace with your API endpoint
                        .then(response => {
                          console.log(6);
                            res.json({ role: user.role, employees: response.data });  // Send employee data from the API
                        })
                        .catch(apiErr => {
                            res.status(500).json({ error: apiErr.message });  // Handle API error
                        });
                } else {
                  console.log(7);
                    // ✅ Return only the employee data for non-admin users
                    db.query('SELECT * FROM employee WHERE id = ?', [user.id], (err, employeeResults) => {
                        if (err) return res.status(500).json({ error: err.message });
                        if (employeeResults.length > 0) {
                            res.json({
                                role: user.role,
                                employee: employeeResults[0],  // ✅ Send only their data
                            });
                        } else {
                            res.status(404).json({ error: 'Employee not found' });
                        }
                    });
                }
            } else {
                res.status(401).json({ error: 'Invalid credentials' });
            }
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    });
});
*/



  
  

// Routes
app.get('/employees', (req, res) => {
    db.query('SELECT * FROM employee', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

//////////////// SQL Injection Vulnerability
app.get('/employees/:id', (req, res) => {
    const id = req.params.id; // Directly using user input
    db.query(`SELECT * FROM employee WHERE id = ${id}`, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});


app.post('/employees', (req, res) => {
    const { name, email, phone, position, salary } = req.body;
    db.query('INSERT INTO employee (name, email, phone, position, salary) VALUES (?, ?, ?, ?, ?)',
        [name, email, phone, position, salary], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: result.insertId, name, email, phone, position, salary });
        });
});

app.put('/employees/:id', (req, res) => {
    const { name, email, phone, position, salary } = req.body;
    db.query('UPDATE employee SET name=?, email=?, phone=?, position=?, salary=? WHERE id=?',
        [name, email, phone, position, salary, req.params.id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Employee updated' });
        });
});

app.delete('/employees/:id', (req, res) => {
    db.query('DELETE FROM employee WHERE id=?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Employee deleted' });
    });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
