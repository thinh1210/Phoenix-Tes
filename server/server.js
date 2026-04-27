require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoutes = require('./src/routes/auth.routes');
const firmwareRoutes = require('./src/routes/firmware.routes');

// Khởi tạo app
const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Vite default port hoặc URL thật trên Render
    credentials: true // Cho phép gửi cookie
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/firmwares', firmwareRoutes);

// Test routes
app.get('/', (req, res) => {
    // Tự động chuyển hướng người dùng sang giao diện Frontend
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(frontendUrl);
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Backend is running' });
});

// Chạy server
app.listen(PORT, () => console.log(`Server đang chạy tại port ${PORT}`));