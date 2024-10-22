// routes/transactions.js
const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db/database.db');

// Add a new transaction
router.post('/', (req, res) => {
  const { type, category, amount, date, description } = req.body;

  if (!type || !category || !amount || !date) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const query = `INSERT INTO transactions (type, category, amount, date, description) 
                 VALUES (?, ?, ?, ?, ?)`;
  db.run(query, [type, category, amount, date, description], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id: this.lastID });
  });
});

// Get all transactions
router.get('/', (req, res) => {
  const query = "SELECT * FROM transactions";
  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ transactions: rows });
  });
});

// Get transaction by ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const query = "SELECT * FROM transactions WHERE id = ?";
  db.get(query, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    res.json({ transaction: row });
  });
});

// Update a transaction by ID
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { type, category, amount, date, description } = req.body;

  const query = `UPDATE transactions 
                 SET type = ?, category = ?, amount = ?, date = ?, description = ? 
                 WHERE id = ?`;
  db.run(query, [type, category, amount, date, description, id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    res.json({ message: "Transaction updated" });
  });
});

// Delete a transaction by ID
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const query = "DELETE FROM transactions WHERE id = ?";
  db.run(query, [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    res.json({ message: "Transaction deleted" });
  });
});

// routes/transactions.js (Add this after the delete route)

// Get summary (total income, expenses, balance)
router.get('/summary', (req, res) => {
    const queryIncome = "SELECT SUM(amount) AS totalIncome FROM transactions WHERE type = 'income'";
    const queryExpense = "SELECT SUM(amount) AS totalExpense FROM transactions WHERE type = 'expense'";
  
    db.get(queryIncome, (err, incomeRow) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      db.get(queryExpense, (err, expenseRow) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        const totalIncome = incomeRow.totalIncome || 0;
        const totalExpense = expenseRow.totalExpense || 0;
        const balance = totalIncome - totalExpense;
  
        res.json({ totalIncome, totalExpense, balance });
      });
    });
  });
  

module.exports = router;
