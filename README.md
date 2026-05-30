# ⚡ EVNHCMC Personal Dashboard

Dashboard cá nhân để xem thông tin tiêu thụ điện từ trang [evnhcmc.vn](https://www.evnhcmc.vn) mà không cần đăng nhập lại mỗi lần và không phải dùng giao diện gốc.

## Tính năng
- Đăng nhập 1 lần bằng SĐT + mật khẩu EVN.
- Tự lấy danh sách mã khách hàng (PE...) liên kết với tài khoản, có combobox tìm kiếm.
- 4 trang: **Tổng quan** (KPI + sparkline 30 ngày + ước tính hóa đơn tháng), **Theo ngày** (stacked TD/BT/CD + presets 7/15/30 ngày…), **Theo giờ** (đồ thị phụ tải 24h với dải khung giờ), **Theo kỳ hóa đơn** (cả năm + cột tiền ước tính).
- Ước tính tiền điện sinh hoạt 6 bậc theo Quyết định 1416/QĐ-BCT, đã gồm VAT 8%, prorate theo số ngày kỳ.
- Light / Dark / System theme, lưu localStorage.
- Responsive: desktop sidebar, mobile bottom tab bar.
- Chạy hoàn toàn local — credentials không lưu vào đĩa, chỉ giữ trong RAM của server Node trong phiên hiện tại.

## Yêu cầu
- Node.js **≥ 18** (cần native `fetch`).

## Cài đặt & chạy

### Production (1 server)
```bash
npm install            # deps cho Express server
npm run install:web    # deps cho frontend (Vite + React)
npm run build          # build SPA ra web/dist
npm start              # chạy server tại http://localhost:3000
```

### Dev (2 process, hot-reload UI)
Terminal 1 — backend:
```bash
npm run dev
```
Terminal 2 — frontend (Vite dev server, proxy /api → :3000):
```bash
npm run dev:web        # http://localhost:5173
```

## Kiến trúc
```
Browser  ──fetch──►  Express (server.js)  ──fetch──►  evnhcmc.vn
   ▲                       │
   │                       └─ giữ cookie session theo từng phiên người dùng
   │                          (tough-cookie, in-memory)
   │
   └── SPA React (Vite + TS + Tailwind v4 + Recharts) ở web/, build vào web/dist
```

Frontend gọi các route:
- `POST /api/login` — `{ sdt, password, remember }`
- `POST /api/logout`
- `GET  /api/me`
- `POST /api/dien/ngay`     — `{ input_makh, input_tungay, input_denngay }` (dd/MM/yyyy)
- `POST /api/dien/gio`      — `{ input_makh, input_ngay }`
- `POST /api/dien/kyhoadon` — `{ input_makh, input_nam }`

Backend tương ứng proxy thẳng đến:
- `POST /Dangnhap/checkLG`
- `POST /Tracuu/ajax_dienNangTieuThuTheoNgay`
- `POST /Tracuu/thongtinphutai_theogio_result`
- `POST /Tracuu/ajax_dienNangTieuThuTheoKyHoaDon`

## Lưu ý
- Nếu EVN bật lại reCAPTCHA cho `/Dangnhap/checkLG`, đăng nhập từ app này sẽ thất bại (cần token reCAPTCHA hợp lệ). Khi đó tạm thời đăng nhập trên trình duyệt rồi copy cookie qua (chưa hỗ trợ UI).
- Chỉ tra cứu **mã khách hàng của chính bạn** — vi phạm có thể trái Nghị định 13/2023 về bảo vệ DLCN.
- Không deploy ra public — đây là tool cá nhân chạy localhost.
