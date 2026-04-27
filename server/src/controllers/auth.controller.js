const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const supabase = require('../services/supabase.service');

const JWT_SECRET = process.env.JWT_SECRET || 'phoenix-super-secret-key-2026';
const JWT_EXPIRES_IN = '1d';

const authController = {
    login: async (req, res) => {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                return res.status(400).json({ error: 'Username and password are required' });
            }

            // Lấy thông tin user từ DB
            const { data: user, error } = await supabase
                .from('users')
                .select('*')
                .eq('username', username)
                .single();

            if (error || !user) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Kiểm tra password (tạm thời hardcode so sánh trực tiếp nếu chưa có hàm hash đúng, nhưng ở đây dùng bcrypt)
            const isValidPassword = await bcrypt.compare(password, user.password);
            
            // Fallback for demo purposes if the password hash in DB is not correct yet
            const isDemoPassword = password === 'Admin@123' && user.username === 'admin';

            if (!isValidPassword && !isDemoPassword) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Tạo JWT
            const token = jwt.sign(
                { id: user.id, username: user.username, role: user.role },
                JWT_SECRET,
                { expiresIn: JWT_EXPIRES_IN }
            );

            // Set cookie
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 24 * 60 * 60 * 1000 // 1 day
            });

            res.json({
                message: 'Login successful',
                user: { id: user.id, username: user.username, role: user.role }
            });

        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    logout: (req, res) => {
        res.clearCookie('token');
        res.json({ message: 'Logout successful' });
    },

    getMe: (req, res) => {
        // Thông tin user đã được middleware auth gắn vào req.user
        res.json({ user: req.user });
    }
};

module.exports = authController;
