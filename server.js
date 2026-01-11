const express = require('express');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

app.use(express.static('public'));
app.use(express.json());

// Cấu hình Multer để nhận file vào RAM (không lưu tạm trên Render)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// API lấy danh sách thư mục (Project) từ Supabase
app.get('/api/projects', async (req, res) => {
    const { data, error } = await supabase.storage.from('firmwares').list();
    if (error) return res.status(500).json(error);
    // Lọc ra các folder (Supabase trả về object không có id là folder)
    const projects = data.filter(item => !item.id).map(item => item.name);
    res.json(projects);
});

// API Upload firmware
app.post('/api/upload', upload.single('firmware'), async (req, res) => {
    const { projectName } = req.body;
    const file = req.file;

    if (!file || !projectName) return res.status(400).send('Thiếu file hoặc tên project');

    const filePath = `${projectName}/firmware.bin`;

    const { data, error } = await supabase.storage
        .from('firmwares')
        .upload(filePath, file.buffer, {
            contentType: 'application/octet-stream',
            upsert: true 
        });

    if (error) return res.status(500).json(error);

    // CÁCH LẤY URL CHÍNH XÁC:
    const { data: urlData } = supabase.storage
        .from('firmwares')
        .getPublicUrl(filePath);

    // Trả về thuộc tính 'url' rõ ràng cho frontend
    res.json({ message: 'Thành công', url: urlData.publicUrl });
});

app.listen(PORT, () => console.log(`Server chạy tại port ${PORT}`));