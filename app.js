const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());

// Connect to SQLite database
const db = new sqlite3.Database('./expense_tracker.db', (err) => {
    if (err) {
        console.error('Error connecting to the database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

// Create tables if they don't exist
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        category TEXT NOT NULL,
        amount REAL NOT NULL,
        date TEXT NOT NULL,
        description TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL
    )`);
});

// Add a new transaction
app.post('/transactions', (req, res) => {
    const { type, category, amount, date, description } = req.body;
    const sql = `INSERT INTO transactions (type, category, amount, date, description) VALUES (?, ?, ?, ?, ?)`;

    db.run(sql, [type, category, amount, date, description], function (err) {
        if (err) {
            return res.status(500).json({ error: 'Error adding transaction' });
        }
        res.status(201).json({ id: this.lastID, type, category, amount, date, description });
    });
});

// Retrieve all transactions
app.get('/transactions', (req, res) => {
    const sql = `SELECT * FROM transactions`;

    db.all(sql, [], (err, transactions) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching transactions' });
        }
        res.json({ transactions });
    });
});

// Retrieve a transaction by ID
app.get('/transactions/:id', (req, res) => {
    const sql = `SELECT * FROM transactions WHERE id = ?`;
    const transactionId = req.params.id;

    db.get(sql, [transactionId], (err, transaction) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching transaction' });
        }
        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        res.json(transaction);
    });
});

// Update a transaction by ID
app.put('/transactions/:id', (req, res) => {
    const { type, category, amount, date, description } = req.body;
    const sql = `UPDATE transactions SET type = ?, category = ?, amount = ?, date = ?, description = ? WHERE id = ?`;
    const transactionId = req.params.id;

    db.run(sql, [type, category, amount, date, description, transactionId], function (err) {
        if (err) {
            return res.status(500).json({ error: 'Error updating transaction' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        res.json({ id: transactionId, type, category, amount, date, description });
    });
});

// Delete a transaction by ID
app.delete('/transactions/:id', (req, res) => {
    const sql = `DELETE FROM transactions WHERE id = ?`;
    const transactionId = req.params.id;

    db.run(sql, transactionId, function (err) {
        if (err) {
            return res.status(500).json({ error: 'Error deleting transaction' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        res.json({ message: 'Transaction deleted successfully' });
    });
});

// Get summary of transactions
app.get('/transactions/summary', (req, res) => {
    const sql = `SELECT * FROM transactions`;

    db.all(sql, [], (err, transactions) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching transactions' });
        }

        if (!transactions || transactions.length === 0) {
            return res.status(404).json({ error: 'No transactions found' });
        }

        const totalIncome = transactions
    .filter(transaction => transaction.type === 'income')
    .reduce((sum, transaction) => sum + transaction.amount, 0);

const totalExpenses = transactions
    .filter(transaction => transaction.type === 'expense')
    .reduce((sum, transaction) => sum + transaction.amount, 0);

const balance = totalIncome - totalExpenses;

return res.json({
    totalIncome,
    totalExpenses,
    balance
});

    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
