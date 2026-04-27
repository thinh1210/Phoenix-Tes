const multer = require('multer');

// Sử dụng memory storage để upload trực tiếp lên Supabase Storage
// Tránh lưu file tạm trên ổ đĩa server (phù hợp với Render/Heroku)
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // Giới hạn file 10MB (tuỳ chỉnh theo nhu cầu)
    },
    fileFilter: (req, file, cb) => {
        // Có thể thêm filter chỉ cho phép file .bin nếu cần
        if (file.originalname.endsWith('.bin')) {
            cb(null, true);
        } else {
            cb(new Error('Chỉ cho phép upload file .bin'));
        }
    }
});

module.exports = { upload };
