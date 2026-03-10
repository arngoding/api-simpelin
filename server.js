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
    // 1. Perintah SQL untuk membuat tabel Items (Barang)
    const createItemsTable = `
        CREATE TABLE IF NOT EXISTS items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            sku VARCHAR(50) NOT NULL UNIQUE,
            stock INT DEFAULT 0,
            category VARCHAR(100),
            unit VARCHAR(50)
        )
    `;

    // 2. Perintah SQL untuk membuat tabel Users (Pengguna)
    const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(50) PRIMARY KEY,
            pass VARCHAR(255) NOT NULL,
            name VARCHAR(255) NOT NULL,
            role VARCHAR(50) DEFAULT 'user',
            bidang VARCHAR(100)
        )
    `;

    // 3. Perintah SQL untuk memasukkan data awal
    const insertItems = `
        INSERT IGNORE INTO items (name, sku, stock, category, unit) VALUES
        ('Kertas HVS A4 80gr', 'ATK-001', 150, 'Alat Tulis', 'Rim'),
        ('Tinta Printer Epson Hitam', 'PRN-012', 25, 'Komputer', 'Botol')
    `;

    const insertUsers = `
        INSERT IGNORE INTO users (id, pass, name, role, bidang) VALUES
        ('admin', 'admin123', 'admin', 'admin', 'UMUM'),
        ('userumum', 'adminumum', 'UMUM', 'user', 'UMUM')
    `;

    // Eksekusi perintah secara berurutan (Berantai)
    db.query(createItemsTable, (err) => {
        if (err) return res.status(500).send("Gagal membuat tabel items: " + err.message);
        
        db.query(createUsersTable, (err2) => {
            if (err2) return res.status(500).send("Gagal membuat tabel users: " + err2.message);
            
            db.query(insertItems, (err3) => {
                if (err3) return res.status(500).send("Gagal mengisi data items: " + err3.message);
                
                db.query(insertUsers, (err4) => {
                    if (err4) return res.status(500).send("Gagal mengisi data users: " + err4.message);
                    
                    res.send("🎉 BERHASIL! Semua tabel (items & users) sudah dibuat dan diisi data. Silakan tutup halaman ini.");
                });
            });
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