import axios from 'axios';

const axiosClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api', // Trỏ đến backend server (local hoặc production)
    withCredentials: true, // Quan trọng: Cho phép gửi HttpOnly cookie (JWT token) đi kèm request
});

// Interceptor cho response để xử lý lỗi token chung (ví dụ: token hết hạn)
axiosClient.interceptors.response.use(
    (response) => {
        return response.data; // Trả về data trực tiếp cho tiện lợi
    },
    (error) => {
        // Xử lý chung các lỗi API
        if (error.response && error.response.status === 401) {
            // Nếu API báo lỗi 401 Unauthorized (token hết hạn/sai)
            // Bạn có thể xử lý redirect về login ở mức độ components hoặc context
            console.error('Unauthorized access. Please login again.');
        }
        return Promise.reject(error);
    }
);

export default axiosClient;
