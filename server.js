const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Konfigurasi Koneksi ke Aiven MySQL
const db = mysql.createConnection({
    host: simpelin-mysql-2e111895-arngoding.l.aivencloud.com,
    port: 15255, // GANTI DENGAN PORT AIVEN ANDA
    user: avnadmin, // GANTI JIKA BERBEDA
    password: process.env.DB_PASSWORD || 'RAHASIA',
    database: defaultdb,
    ssl: { rejectUnauthorized: false }, // Wajib ada untuk Aiven
    allowPublicKeyRetrieval: true       // SOLUSI ERROR PUBLIC KEY
});

db.connect((err) => {
    if (err) throw err;
    console.log('✅ Berhasil terhubung ke database Aiven MySQL');
});

// API Mengambil Data Barang
app.get('/api/items', (req, res) => {
    db.query('SELECT * FROM items', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// API Mengupdate Stok Barang
app.put('/api/items/:id/stock', (req, res) => {
    const { stock } = req.body;
    db.query('UPDATE items SET stock = ? WHERE id = ?', [stock, req.params.id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: 'Stok berhasil diupdate' });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server Backend berjalan di port ${PORT}`);
});
module.exports = app;
