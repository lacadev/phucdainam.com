# Báo Cáo Điều Tra Sự Cố Trắng Trang Khi Cài Plugin Cache & Hướng Giải Quyết

- **Website mục tiêu:** `https://phucdainam.com/`
- **Môi trường Web Server:** `LiteSpeed` (HTTP/2, PHP 8.4.26)
- **Kiến trúc Theme:** `lacadev-client` (Parent - WPEmerge Framework) + `lacadev-client-child` (Child)
- **Hiện tượng:** Khi cài đặt hoặc kích hoạt bất kỳ plugin cache nào (LiteSpeed Cache, WP Rocket, WP-Optimize, WP Super Cache...), website lập tức bị **trắng trang hoàn toàn (White Screen of Death)**, response trả về HTTP 200 nhưng nội dung trống rỗng (0 bytes).

---

## I. TỔNG HỢP NGUYÊN NHÂN CỐT LÕI

Qua quá trình rà soát mã nguồn theme và cấu trúc hệ thống, sự cố trắng trang bắt nguồn từ **3 xung đột kỹ thuật nghiêm trọng**:

```
[Request từ Browser]
        │
        ▼
[LiteSpeed Web Server] ── (Có sẵn Gzip/Brotli ở tầng server)
        │
        ▼
[Plugin Cache] ───────── Bắt đầu bộ đệm ob_start() để tóm lấy mã HTML trang
        │
        ▼
[Theme Performance] ──── ob_start('ob_gzhandler') ─── (XUNG ĐỘT #1: Biến HTML thành binary Gzip)
        │
        ▼
[Theme Security] ─────── Dynamic CSP Nonce ────────── (XUNG ĐỘT #2: Nonce thay đổi phá vỡ static cache)
        │
        ▼
[Flushing Buffers] ───── Plugin Cache nhận được binary rỗng/lỗi regex ──> Trả về 0 BYTES (Trắng trang)
        │
        ▼
[Theme Cache-Control] ── Cache-Control: max-age=3600 (XUNG ĐỘT #3: Trình duyệt lưu luôn trang trắng 1 tiếng)
```

---

### 1. NGUYÊN NHÂN #1: Xung đột Output Buffering & `ob_gzhandler` (Thủ phạm chính)

- **Vị trí file:** `wp-content/themes/lacadev-client/theme/setup/performance.php`
- **Đoạn code:**
  ```php
  // Dòng 38:
  add_action('template_redirect', [self::class, 'enable_compression']);

  // Dòng 209 - 217:
  public static function enable_compression()
  {
      if (!is_admin()) {
          // Enable gzip compression
          if (function_exists('gzencode') && !ob_get_contents()) {
              ob_start('ob_gzhandler'); // <-- NGUY CƠ CHÍNH
          }
      }
  }
  ```

#### Cơ chế phát sinh lỗi:
1. **Plugin Cache cần chuỗi HTML thuần:** Mọi plugin cache đều hoạt động bằng cách mở một output buffer (`ob_start()`) sớm trong vòng đời request để tóm lấy mã HTML, phân tích chuỗi (tìm CSS/JS nối file, chuyển đổi WebP, minify HTML) rồi lưu vào file cache và trả ra cho người dùng.
2. **`ob_gzhandler` nén HTML thành nhị phân:** Khi theme chạy hook `template_redirect`, hàm `enable_compression()` tiếp tục lồng thêm một buffer `ob_start('ob_gzhandler')`.
3. **Phá vỡ bộ đệm (Buffer Corruption):**
   - Khi trang kết xuất xong, buffer con (`ob_gzhandler`) nén chuỗi HTML thành **dữ liệu nhị phân Gzip (binary stream)** rồi mới đẩy ra buffer cha (Plugin Cache).
   - Plugin cache nhận được dữ liệu nhị phân thay vì chuỗi HTML.
   - Khi plugin cache chạy các hàm xử lý chuỗi hoặc Regex UTF-8 (như `preg_replace('/<!--.*?-->/s', ...)`), hàm sẽ bị lỗi `PREG_BAD_UTF8_ERROR` và **trả về `null` hoặc chuỗi rỗng `""`**.
4. **Hậu quả:** Web server trả về response HTTP 200 nhưng kích thước **0 bytes (Body hoàn toàn rỗng)** $\rightarrow$ Trình duyệt hiển thị một màu trắng tinh.
5. **Double Gzip với LiteSpeed Server:** Bản thân máy chủ `phucdainam.com` đang chạy **LiteSpeed Web Server** (đã tích hợp nén Gzip/Brotli cấp độ server tự động). Việc nén `ob_gzhandler` ở tầng PHP là hoàn toàn thừa thãi và gây xung đột giải nén trên trình duyệt.

---

### 2. NGUYÊN NHÂN #2: CSP Nonce (`Content-Security-Policy`) phá vỡ Page Cache

- **Vị trí file:** `wp-content/themes/lacadev-client/theme/setup/security.php`
- **Đoạn code:**
  ```php
  // Dòng 15 - 52:
  add_action('send_headers', function() {
      $nonce = base64_encode(random_bytes(16)); // Tạo ngẫu nhiên nonce mỗi request
      ...
      $csp .= "script-src 'self' 'nonce-{$nonce}' https://cdn.jsdelivr.net ...";
      header( "Content-Security-Policy: {$csp}" );
  });

  // Dòng 57 - 68:
  add_filter('script_loader_tag', function($tag, $handle) {
      ...
      $tag = str_replace('<script ', '<script nonce="' . $nonce . '" ', $tag);
      return $tag;
  });
  ```

#### Cơ chế phát sinh lỗi:
1. **Tính chất của Page Cache:** Page Cache là việc lưu toàn bộ mã HTML vào ổ cứng/RAM để phục vụ hàng ngàn người dùng sau đó mà không cần gọi lại PHP.
2. **Lỗi lệch Nonce:**
   - Khi sinh file cache lần đầu, file HTML được lưu kèm `<script nonce="NONCE_ABC">`.
   - Ở các lần truy cập tiếp theo (Cache Hit), nếu request đi qua PHP để gửi header hoặc server trả header mới có `nonce-NONCE_XYZ`, thì `NONCE_XYZ` ở header sẽ **không khớp** với `NONCE_ABC` trong file cache tĩnh.
   - Trình duyệt phát hiện vi phạm bảo mật và **chặn 100% JavaScript** của toàn bộ website.
3. **Lỗi Inline Script của Plugin Cache:**
   - Các plugin cache (như LiteSpeed Cache, WP Rocket) sẽ chèn các đoạn script inline phục vụ lazyload ảnh, critical CSS, delay JS.
   - Các script này được chèn sau bước render của WordPress nên không có attribute `nonce="..."`.
   - Directive `script-src 'self' 'nonce-...'` của theme không chứa `'unsafe-inline'`. Do đó, toàn bộ script của plugin cache bị trình duyệt chặn đứng $\rightarrow$ Website mất chức năng, các khối nội dung dùng hiệu ứng mờ/cuộn (AOS, opacity) không được kích hoạt, gây ra hiện tượng giao diện trống trơn hoặc biến mất.

---

### 3. NGUYÊN NHÂN #3: Theme tự ép Header `Cache-Control` tĩnh vào trang HTML

- **Vị trí file:** `wp-content/themes/lacadev-client/theme/setup/performance.php`
- **Đoạn code:**
  ```php
  // Dòng 92 - 97:
  // Cache HTML for 1 hour
  else {
      header('Cache-Control: public, max-age=3600, must-revalidate');
      header('Expires: ' . gmdate('D, d M Y H:i:s', time() + 3600) . ' GMT');
      header('Vary: Accept-Encoding');
  }
  ```

#### Cơ chế phát sinh lỗi:
- Theme đang gửi header `Cache-Control: public, max-age=3600` cưỡng chế cho mọi trang HTML ở hook `template_redirect`.
- Khi người dùng vô tình truy cập trúng phiên bản trang bị lỗi trắng (0 bytes), **trình duyệt máy tính/điện thoại lập tức lưu trang trắng đó vào Disk Cache trong 1 tiếng**.
- Kể cả khi quản trị viên đã tắt plugin cache hoặc xóa cache trên hosting, khi tải lại trang, trình duyệt vẫn tự đọc từ bộ nhớ máy ra trang trắng cũ.

---

## II. KẾ HOẠCH & HƯỚNG GIẢI QUYẾT TRIỆT ĐỂ

Để website có thể tương thích 100% với các plugin cache hiện đại (đặc biệt là LiteSpeed Cache), cần thực hiện 3 bước sửa đổi sau:

### Bước 1: Vô hiệu hóa `ob_gzhandler` trong theme

- **Mục tiêu:** Trả quyền nén gzip/brotli cho LiteSpeed Web Server và Plugin Cache.
- **Thực hiện tại:** `wp-content/themes/lacadev-client/theme/setup/performance.php`
- **Thay đổi:**
  Comment hoặc xoá hook `enable_compression`:
  ```diff
  - // Advanced compression
  - add_action('template_redirect', [self::class, 'enable_compression']);
  ```
  *(Đồng thời kiểm tra `wp-content/themes/lacadev-client/app/src/Settings/LacaTools/Security.php` để đảm bảo phương thức `enableCompression()` không bị gọi ngầm).*

---

### Bước 2: Bỏ ép buộc `Cache-Control` cho trang HTML trong theme

- **Mục tiêu:** Cho phép plugin cache toàn quyền điều phối các header phản hồi (`X-LiteSpeed-Cache`, `Cache-Control: no-cache` cho trang đăng nhập/giỏ hàng/admin, và `public` cho trang tĩnh).
- **Thực hiện tại:** `wp-content/themes/lacadev-client/theme/setup/performance.php`
- **Thay đổi:**
  ```diff
  - // Cache HTML for 1 hour
  - else {
  -     header('Cache-Control: public, max-age=3600, must-revalidate');
  -     header('Expires: ' . gmdate('D, d M Y H:i:s', time() + 3600) . ' GMT');
  -     header('Vary: Accept-Encoding');
  - }
  ```
  *(Chỉ giữ lại cache header cho tài nguyên tĩnh như CSS, JS, Fonts, Images).*

---

### Bước 3: Cấu hình lại CSP (`Content-Security-Policy`) tương thích với Page Cache

- **Mục tiêu:** Ngăn chặn việc CSP chặn đứng các inline scripts và script gộp của plugin cache khi load từ cache tĩnh.
- **Thực hiện tại:** `wp-content/themes/lacadev-client/theme/setup/security.php`
- **Giải pháp khuyến nghị:**
  1. Nếu dùng Page Cache (HTML tĩnh), CSP không được dùng `nonce` ngẫu nhiên cho từng request trên frontend. Thay vào đó sử dụng directive cho phép `'unsafe-inline'` hoặc hash cho script, hoặc chỉ kích hoạt nonce nghiêm ngặt cho khu vực admin/logged-in users.
  2. Bổ sung các directive cần thiết cho phép inline script hoạt động an toàn mà không chặn các tính năng tối ưu (Delay JS, Inline Critical CSS, WebP lazyloader) của plugin cache.

---

### Bước 4: Lựa chọn & Cấu hình Plugin Cache chuẩn cho `phucdainam.com`

Do server đang chạy **LiteSpeed Web Server**, giải pháp số 1 về hiệu năng và độ ổn định là sử dụng **LiteSpeed Cache (LSCache)**:

1. **Cài đặt:** Plugin `litespeed-cache` trực tiếp từ kho WordPress.
2. **Cấu hình tối ưu ban đầu:**
   - **General:** Enable LiteSpeed Cache $\rightarrow$ `ON`.
   - **Cache:** Enable Cache $\rightarrow$ `ON`, Cache Mobile $\rightarrow$ `ON` (nếu cần giao diện riêng), Cache REST API / Feeds $\rightarrow$ `ON`.
   - **Page Optimization (CSS/JS):**
     - Ban đầu nên bật chế độ **CSS Minify** và **JS Minify**.
     - Thử nghiệm tắt `JS Combine` và `Load JS Deferred` nếu theme đã tự quản lý defer scripts trong `assets.php`.
   - **Tích hợp sẵn:** LiteSpeed Cache sẽ tự động giao tiếp với module cache cấp server của LiteSpeed mà không làm quá tải PHP.

---

## III. KẾT LUẬN

Hiện tượng trắng trang **không phải do lỗi code giao diện hay lỗi cơ sở dữ liệu**, mà là do **cơ chế tối ưu nén thủ công (`ob_gzhandler`) và dynamic nonce CSP trong theme va chạm trực tiếp với cơ chế gom đệm của plugin cache**.

Chỉ cần tháo gỡ `ob_gzhandler` và điều chỉnh CSP tương thích với cache, website sẽ cài đặt và vận hành mượt mà với bất kỳ plugin cache nào, cải thiện đáng kể điểm Google PageSpeed và tốc độ tải trang.
