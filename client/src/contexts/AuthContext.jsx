import { createContext, useState, useEffect, useContext } from 'react';
import axiosClient from '../api/axiosClient';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); // Trạng thái check login lần đầu

    // Kiểm tra xem user có đang đăng nhập không (khi reload trang)
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await axiosClient.get('/auth/me');
                if (res.user) {
                    setUser(res.user);
                }
            } catch (error) {
                console.log('User not logged in or token expired');
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    const login = async (username, password) => {
        try {
            const res = await axiosClient.post('/auth/login', { username, password });
            if (res.user) {
                setUser(res.user);
                return { success: true };
            }
            return { success: false, error: 'Login failed' };
        } catch (error) {
            console.error('Login error:', error);
            return { 
                success: false, 
                error: error.response?.data?.error || 'Network error' 
            };
        }
    };

    const logout = async () => {
        try {
            await axiosClient.post('/auth/logout');
            setUser(null);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
