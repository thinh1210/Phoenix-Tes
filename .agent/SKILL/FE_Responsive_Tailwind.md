# Skill: Responsive Design & Tailwind CSS

## Mobile First Strategy
Luôn bắt đầu viết CSS cho màn hình nhỏ nhất, sau đó dùng các prefix `md:`, `lg:`, `xl:` cho màn hình lớn hơn.

## Quy tắc Tailwind
1. **Container:** Sử dụng class `container mx-auto` để căn giữa nội dung.
2. **Grid/Flex:** Ưu tiên `grid` cho bố cục tổng thể và `flex` cho các thành phần nhỏ bên trong.
3. **Spacing:** Sử dụng hệ thống spacing chuẩn của Tailwind (`p-4`, `m-2`, v.v.) để đảm bảo tính nhất quán.

## Code Snippet mẫu
```jsx
const ResponsiveCard = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
        <h2 className="text-xl font-bold mb-2 text-indigo-600">Premium Card</h2>
        <p className="text-gray-600">This card is responsive and uses Tailwind CSS.</p>
      </div>
    </div>
  );
};
```
