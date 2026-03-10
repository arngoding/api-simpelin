const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Konfigurasi Koneksi ke Aiven MySQL
const db = mysql.createConnection({
    host: simpelin-mysql-2e111895-arngoding.l.aivencloud.com, // Contoh: mysql-xxx.aivencloud.com
    port: 15255,                        // Ganti dengan port Aiven Anda
    user: avnadmin,
    password: process.env.DB_PASSWORD || 'RAHASIA',
    database: 'defaultdb',
    ssl: { rejectUnauthorized: false },
    allowPublicKeyRetrieval: true
});

// Perbaikan 1: Jangan pakai 'throw err' di Vercel agar tidak Crash
db.connect((err) => {
    if (err) {
        console.error('❌ Gagal terhubung ke database:', err.message);
    } else {
        console.log('✅ Berhasil terhubung ke database Aiven MySQL');
    }
});

app.get('/api/items', (req, res) => {
    db.query('SELECT * FROM items', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.put('/api/items/:id/stock', (req, res) => {
    const { stock } = req.body;
    db.query('UPDATE items SET stock = ? WHERE id = ?', [stock, req.params.id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: 'Stok berhasil diupdate' });
    });
});

// Perbaikan 2: Matikan app.listen saat berjalan di Vercel
if (!process.env.VERCEL) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`🚀 Server Backend berjalan di port ${PORT}`);
    });
}

// Perbaikan 3: Export wajib untuk Vercel
module.exports = app;