<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>You've been invited</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #F0E6D8; margin: 0; padding: 40px 20px; }
  .card { background: #fff; border-radius: 12px; max-width: 480px; margin: 0 auto; padding: 40px; }
  .logo { font-size: 18px; font-weight: 700; color: #1a1a1a; margin-bottom: 32px; }
  h1 { font-size: 22px; font-weight: 700; color: #1a1a1a; margin: 0 0 12px; }
  p { font-size: 15px; color: #555; line-height: 1.6; margin: 0 0 24px; }
  .btn { display: inline-block; background: #1a1a1a; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-size: 15px; font-weight: 600; }
  .expire { font-size: 13px; color: #999; margin-top: 24px; }
  .url { font-size: 12px; color: #999; word-break: break-all; margin-top: 16px; }
</style>
</head>
<body>
  <div class="card">
    <div class="logo">TDC Reporting</div>
    <h1>Hi {{ $user->name }},</h1>
    <p>{{ $invitedBy->name }} has invited you to TDC Reporting — The Despatch Company's internal reporting dashboard.</p>
    <p>Click the button below to accept your invitation and sign in.</p>
    <a href="{{ $loginUrl }}" class="btn">Accept invitation</a>
    <p class="expire">This link expires in 48 hours and can only be used once. After that, you can log in from the homepage using your email address.</p>
    <p class="url">Or copy this link: {{ $loginUrl }}</p>
  </div>
</body>
</html>
