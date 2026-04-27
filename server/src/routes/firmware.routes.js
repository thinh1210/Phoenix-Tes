const express = require('express');
const router = express.Router();
const firmwareController = require('../controllers/firmware.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const { upload } = require('../middlewares/upload.middleware');

// Các route không cần auth (hoặc có thể cần tùy nhu cầu, hiện tại requireAuth hết cho an toàn quản lý)
// Nếu public cho ESP32 lấy json thì không cần auth, nhưng ESP32 gọi thẳng URL Storage rồi
// Các API này dành cho Dashboard Frontend

// Projects
router.get('/projects', requireAuth, firmwareController.getProjects);
router.post('/projects', requireAuth, firmwareController.createProject);
router.put('/projects/:id', requireAuth, firmwareController.updateProject);
router.delete('/projects/:id', requireAuth, firmwareController.deleteProject);

// Firmwares
router.get('/', requireAuth, firmwareController.getLatestFirmwares);
router.get('/:projectId/history', requireAuth, firmwareController.getProjectHistory);
router.post('/upload', requireAuth, upload.single('firmware'), firmwareController.uploadFirmware);
router.put('/:id', requireAuth, upload.single('firmware'), firmwareController.updateFirmware);
router.delete('/:id', requireAuth, firmwareController.deleteFirmware);

module.exports = router;
