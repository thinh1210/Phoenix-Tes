# Skill: Frontend Security (React)

## Nguyên tắc chung
1. **Sanitize Data:** Luôn làm sạch dữ liệu từ user trước khi render để tránh XSS. React mặc định escape string, nhưng cẩn thận với `dangerouslySetInnerHTML`.
2. **JWT Storage:** Không lưu JWT trong `localStorage`. Ưu tiên `httpOnly Cookie`. Nếu bắt buộc dùng localStorage, hãy đảm bảo cơ chế refresh token an toàn.
3. **Environment Variables:** Không bao giờ lưu API Key bí mật ở Client side (`.env` file trong React chỉ là giả lập).
4. **Input Validation:** Validation ở FE chỉ để UX, luôn phải re-validate ở BE.

## Code Snippet mẫu
```javascript
// Tránh XSS khi render HTML từ nguồn lạ
import DOMPurify from 'dompurify';

const SafeHTML = ({ html }) => {
  const cleanHTML = DOMPurify.sanitize(html);
  return <div dangerouslySetInnerHTML={{ __html: cleanHTML }} />;
};
```
