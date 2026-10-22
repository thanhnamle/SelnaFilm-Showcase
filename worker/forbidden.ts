const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);

/** Minimal 403 page. Shows the visitor's IP so the owner can add it to ALLOWED_IPS. */
export function forbiddenPage(ip: string): string {
  return `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Không có quyền truy cập</title>
<style>
  :root { color-scheme: dark; }
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #07080b;
         color: #f4f4f6; font: 15px/1.6 system-ui, -apple-system, "Segoe UI", sans-serif; padding: 16px; }
  main { max-width: 420px; text-align: center; }
  h1 { font-size: 22px; margin: 0 0 8px; letter-spacing: -0.01em; }
  p { color: #9b9ca6; margin: 0 0 20px; }
  code { display: inline-block; padding: 8px 14px; border-radius: 10px; background: #15161c;
         border: 1px solid #262833; font: 14px ui-monospace, SFMono-Regular, Menlo, monospace; word-break: break-all; }
</style>
</head>
<body>
<main>
  <h1>Trang này là riêng tư</h1>
  <p>Địa chỉ IP của bạn chưa nằm trong danh sách được phép truy cập.</p>
  <code>${escapeHtml(ip || 'không xác định')}</code>
</main>
</body>
</html>`;
}
