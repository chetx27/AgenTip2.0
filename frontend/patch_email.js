const fs = require('fs');
let s = fs.readFileSync('/Users/ayushshetty/AgenTip2.0/frontend/src/components/EmailNotifications.tsx', 'utf8');

s = s.replace(
  `      <button
        onClick={handleRegister}
        disabled={loading || !email}
        className="btn btn-rust"
      >`,
  `      {error && <div style={{ color: '#FFB74D', fontSize: '0.85rem' }}>{error}</div>}
      <button
        onClick={handleRegister}
        disabled={loading || !email || success}
        className="btn btn-rust"
      >`
);
fs.writeFileSync('/Users/ayushshetty/AgenTip2.0/frontend/src/components/EmailNotifications.tsx', s);
