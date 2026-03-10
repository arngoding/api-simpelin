const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// 1. WAJIB MENGGUNAKAN POOL UNTUK VERCEL (Serverless)
const db = mysql.createPool({
    host: 'simpelin-mysql-2e111895-arngoding.l.aivencloud.com', // CONTOH: mysql-xxx.aivencloud.com
    port: 15255,                        // SESUAIKAN DENGAN PORT AIVEN ANDA
    user: 'avnadmin',
    password: process.env.DB_PASSWORD || 'RAHASIA',
    database: 'defaultdb',
    ssl: { rejectUnauthorized: false },
    allowPublicKeyRetrieval: true,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// 2. TANGKAP ERROR (JANGAN PAKAI 'throw err' AGAR TIDAK CRASH)
db.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Gagal terhubung ke Database:', err.message);
    } else {
        console.log('✅ Berhasil terhubung ke database Aiven MySQL');
        connection.release(); // Lepaskan kembali ke pool
    }
});

// 3. ENDPOINT CEK STATUS URL (Buka URL Vercel harusnya muncul teks ini)
app.get('/', (req, res) => {
    res.send('Backend API SiMPelIn Aktif dan Berjalan!');
});

// --- URL RAHASIA UNTUK MEMBUAT TABEL (HANYA DIPAKAI SEKALI) ---
app.get('/api/setup-database', (req, res) => {
    // 1. Perintah SQL untuk membuat tabel
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            sku VARCHAR(50) NOT NULL UNIQUE,
            stock INT DEFAULT 0,
            category VARCHAR(100),
            unit VARCHAR(50)
        )
    `;

    // 2. Perintah SQL untuk memasukkan 2 data awal
    const insertDataQuery = `
        INSERT IGNORE INTO items (name, sku, stock, category, unit) VALUES
        ('Kertas HVS A4 80gr', 'ATK-001', 150, 'Alat Tulis', 'Rim'),
        ('Tinta Printer Epson Hitam', 'PRN-012', 25, 'Komputer', 'Botol')
    `;

    // Eksekusi perintah pertama (Buat Tabel)
    db.query(createTableQuery, (err) => {
        if (err) return res.status(500).send("Gagal membuat tabel: " + err.message);
        
        // Jika sukses, eksekusi perintah kedua (Isi Data)
        db.query(insertDataQuery, (err2) => {
            if (err2) return res.status(500).send("Gagal mengisi data: " + err2.message);
            
            res.send("🎉 BERHASIL! Tabel 'items' sudah dibuat dan diisi data. Silakan tutup halaman ini.");
        });
    });
});
// -------------------------------------------------------------
// --- API ROUTES ---

app.get('/api/items', (req, res) => {
    db.query('SELECT * FROM items', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.put('/api/items/:id/stock', (req, res) => {
    const { stock } = req.body;
    db.query('UPDATE items SET stock = ? WHERE id = ?', [stock, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Stok berhasil diupdate' });
    });
});

// 4. EKSPOR UNTUK VERCEL
module.exports = app;