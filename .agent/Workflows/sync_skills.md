# Workflow: Sync Skills via MCP

## Mục tiêu
Tự động cập nhật các skill lập trình từ kho lưu trữ trung tâm.

## Quy trình
1. **Kiểm tra Nguồn:** Xác định danh sách các skill cần tải từ `https://raw.githubusercontent.com/user/skills-repo/main/manifest.json` (ví dụ).
2. **Sử dụng MCP Fetch:**
    - Gọi tool `fetch` từ MCP để lấy nội dung manifest.
    - Duyệt qua từng skill trong manifest.
3. **Tải và Lưu:**
    - Đối với mỗi skill, gọi `fetch` để lấy nội dung file `.md`.
    - Ghi nội dung vào `.agent/SKILL/` với tên tương ứng.
4. **Xác nhận:** Thông báo cho người dùng số lượng skill đã được cập nhật.

## Lưu ý
Workflow này yêu cầu MCP server `fetch` phải được cấu hình sẵn trong `mcp_config.json`.
