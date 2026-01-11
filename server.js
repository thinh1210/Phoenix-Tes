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
    try {
        const { projectName, version } = req.body;
        const file = req.file;

        if (!file || !projectName || !version) {
            return res.status(400).json({ error: 'Thiếu file, tên project hoặc version' });
        }

        // 1. Upload file Binary (.bin)
        const binPath = `${projectName}/firmware.bin`;
        const { error: binError } = await supabase.storage
            .from('firmwares')
            .upload(binPath, file.buffer, {
                contentType: 'application/octet-stream',
                upsert: true 
            });

        if (binError) throw binError;

        // Lấy link Public của file BIN
        const { data: binUrlData } = supabase.storage
            .from('firmwares')
            .getPublicUrl(binPath);

        // 2. Tạo nội dung file JSON trạng thái
        const stateData = {
            firmware_name: projectName,
            version: version,
            url: binUrlData.publicUrl
        };
        const stateBuffer = Buffer.from(JSON.stringify(stateData, null, 2));
        const jsonPath = `${projectName}/firmware_state.json`;

        // 3. Upload/Ghi đè file JSON lên Supabase
        const { error: jsonError } = await supabase.storage
            .from('firmwares')
            .upload(jsonPath, stateBuffer, {
                contentType: 'application/json',
                upsert: true 
            });

        if (jsonError) throw jsonError;

        // Lấy link Public của file JSON
        const { data: jsonUrlData } = supabase.storage
            .from('firmwares')
            .getPublicUrl(jsonPath);

        res.json({ 
            message: 'Thành công', 
            url: binUrlData.publicUrl,
            jsonUrl: jsonUrlData.publicUrl 
        });

    } catch (err) {
        console.error("Lỗi hệ thống:", err);
        res.status(500).json({ error: err.message || "Internal Server Error" });
    }
});

app.listen(PORT, () => console.log(`Server chạy tại port ${PORT}`));