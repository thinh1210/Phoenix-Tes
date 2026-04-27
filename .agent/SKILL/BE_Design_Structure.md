# Skill: Backend Design & Structure (Node.js)

## 1. Database Design (PostgreSQL/MongoDB)
- **Normalization:** Đảm bảo dữ liệu không bị trùng lặp (3NF).
- **Indexing:** Đánh index cho các cột thường xuyên được `WHERE` hoặc `JOIN`.
- **Naming:** Sử dụng `snake_case` cho database columns và `plural` cho table names.

## 2. Route Design (RESTful API)
- **Nouns over Verbs:** `/users` thay vì `/getUsers`.
- **Versioning:** Luôn có tiền tố phiên bản `/api/v1/...`.
- **Status Codes:** Sử dụng đúng mã lỗi (200, 201, 400, 401, 403, 404, 500).

## 3. Project Structure (Separation of Concerns)
Cấu trúc thư mục khuyến nghị:
```text
src/
  ├── controllers/ (Xử lý request/response)
  ├── services/    (Chứa logic nghiệp vụ chính)
  ├── models/      (Định nghĩa schema database)
  ├── routes/      (Định nghĩa các endpoint)
  ├── middlewares/ (Xử lý Auth, Log, Validation)
  └── utils/       (Hàm bổ trợ dùng chung)
```

## Code Snippet mẫu (Route)
```javascript
// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/auth');

router.get('/:id', authMiddleware, userController.getUserById);

module.exports = router;
```
