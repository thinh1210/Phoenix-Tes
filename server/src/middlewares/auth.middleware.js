const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'phoenix-super-secret-key-2026';

const requireAuth = (req, res, next) => {
    // Đọc token từ cookie (yêu cầu cookie-parser) hoặc từ header
    const token = req.cookies.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    }
};

module.exports = { requireAuth };
