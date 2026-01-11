const express = require('express');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// THAY THẾ THÔNG TIN CỦA BẠN TẠI ĐÂY
const SUPABASE_URL = 'https://orttvvuuocflxesiamxf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ydHR2dnV1b2NmbHhlc2lhbXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwODQyOTEsImV4cCI6MjA4MzY2MDI5MX0.q_1eOjDCT0-oWXIDo7N_Gu6FqcS05sHk5RjG-GL-edM';
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

    // Đường dẫn trên Supabase: <projectName>/firmware.bin
    const filePath = `${projectName}/firmware.bin`;

    // Upload lên Supabase (Ghi đè nếu đã tồn tại)
    const { data, error } = await supabase.storage
        .from('firmwares')
        .upload(filePath, file.buffer, {
            contentType: 'application/octet-stream',
            upsert: true 
        });

    if (error) return res.status(500).json(error);

    // Lấy link Public
    const { data: publicUrl } = supabase.storage
        .from('firmwares')
        .getPublicUrl(filePath);

    res.json({ message: 'Thành công', url: publicUrl.publicUrl });
});

app.listen(PORT, () => console.log(`Server chạy tại port ${PORT}`));