const supabase = require('../services/supabase.service');

const firmwareController = {
    // 1. Lấy danh sách firmware mới nhất của tất cả project (sử dụng View)
    getLatestFirmwares: async (req, res) => {
        try {
            const { data, error } = await supabase
                .from('latest_firmwares')
                .select('*')
                .order('project_name', { ascending: true });

            if (error) throw error;
            res.json(data);
        } catch (error) {
            console.error('Error fetching latest firmwares:', error);
            res.status(500).json({ error: 'Lỗi khi lấy danh sách firmware' });
        }
    },

    // 2. Lấy lịch sử phiên bản của một project cụ thể
    getProjectHistory: async (req, res) => {
        try {
            const { projectId } = req.params;
            const { data, error } = await supabase
                .from('firmware_versions')
                .select('*')
                .eq('project_id', projectId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            res.json(data);
        } catch (error) {
            console.error('Error fetching project history:', error);
            res.status(500).json({ error: 'Lỗi khi lấy lịch sử dự án' });
        }
    },

    // 3. Lấy danh sách tất cả projects
    getProjects: async (req, res) => {
        try {
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;
            res.json(data);
        } catch (error) {
            console.error('Error fetching projects:', error);
            res.status(500).json({ error: 'Lỗi khi lấy danh sách dự án' });
        }
    },

    // 4. Tạo project mới
    createProject: async (req, res) => {
        try {
            const { name, description } = req.body;

            if (!name) {
                return res.status(400).json({ error: 'Tên dự án là bắt buộc' });
            }

            const { data, error } = await supabase
                .from('projects')
                .insert([{ name, description }])
                .select();

            if (error) {
                // Handle unique constraint violation
                if (error.code === '23505') {
                    return res.status(409).json({ error: 'Tên dự án đã tồn tại' });
                }
                throw error;
            }

            res.status(201).json(data[0]);
        } catch (error) {
            console.error('Error creating project:', error);
            res.status(500).json({ error: 'Lỗi khi tạo dự án mới' });
        }
    },

    // 5. Upload Firmware mới
    uploadFirmware: async (req, res) => {
        try {
            const { projectId, version, releaseNotes } = req.body;
            const file = req.file;
            const userId = req.user.id; // Lấy từ auth middleware

            if (!file || !projectId || !version) {
                return res.status(400).json({ error: 'Thiếu file, project ID hoặc version' });
            }

            // Lấy thông tin project name để tạo đường dẫn thư mục trên Storage
            const { data: project, error: projectError } = await supabase
                .from('projects')
                .select('name')
                .eq('id', projectId)
                .single();

            if (projectError || !project) {
                return res.status(404).json({ error: 'Không tìm thấy dự án' });
            }

            const projectName = project.name;

            // Kiểm tra xem version này đã tồn tại chưa (tránh ghi đè ở DB nếu dùng chung logic cũ, 
            // nhưng ở đây có constraint UNIQUE(project_id, version) ở DB rồi)
            const { data: existingVersion } = await supabase
                .from('firmware_versions')
                .select('id')
                .eq('project_id', projectId)
                .eq('version', version)
                .single();

            if (existingVersion) {
                return res.status(409).json({ error: 'Phiên bản này đã tồn tại cho dự án' });
            }

            // --- BẮT ĐẦU QUÁ TRÌNH UPLOAD LÊN STORAGE ---
            // 1. Upload file Binary (.bin)
            const binPath = `${projectName}/${version}/firmware.bin`;
            const { error: binUploadError } = await supabase.storage
                .from('firmwares')
                .upload(binPath, file.buffer, {
                    contentType: 'application/octet-stream',
                    upsert: true
                });

            if (binUploadError) throw binUploadError;

            // Lấy link Public của file BIN
            const { data: binUrlData } = supabase.storage
                .from('firmwares')
                .getPublicUrl(binPath);

            // 2. Upload (ghi đè) file JSON trạng thái mới nhất cho thiết bị check OTA
            const stateData = {
                firmware_name: projectName,
                version: version,
                url: binUrlData.publicUrl
            };
            const stateBuffer = Buffer.from(JSON.stringify(stateData, null, 2));
            const jsonPath = `${projectName}/firmware_state.json`; // File này luôn là mới nhất

            const { error: jsonUploadError } = await supabase.storage
                .from('firmwares')
                .upload(jsonPath, stateBuffer, {
                    contentType: 'application/json',
                    upsert: true
                });

            if (jsonUploadError) throw jsonUploadError;

            // Lấy link Public của file JSON
            const { data: jsonUrlData } = supabase.storage
                .from('firmwares')
                .getPublicUrl(jsonPath);

            // --- KẾT THÚC UPLOAD STORAGE ---

            // --- LƯU VÀO DATABASE ---
            const { data: newFirmwareRecord, error: dbError } = await supabase
                .from('firmware_versions')
                .insert([{
                    project_id: projectId,
                    version: version,
                    bin_url: binUrlData.publicUrl,
                    state_url: jsonUrlData.publicUrl,
                    release_notes: releaseNotes || null,
                    uploaded_by: userId
                }])
                .select();

            if (dbError) throw dbError;

            res.status(201).json({
                message: 'Upload firmware thành công',
                data: newFirmwareRecord[0]
            });

        } catch (error) {
            console.error('Upload firmware error:', error);
            res.status(500).json({ error: 'Lỗi hệ thống trong quá trình upload' });
        }
    }
};

module.exports = firmwareController;
