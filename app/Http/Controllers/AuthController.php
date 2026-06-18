<?php

namespace App\Http\Controllers;

use App\Models\LoginToken;
use App\Models\MagicLinkToken;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        if (!Auth::attempt(['email' => strtolower($request->email), 'password' => $request->password], true)) {
            return response()->json(['message' => 'Invalid email or password.'], 401);
        }

        if (!Auth::user()->is_active) {
            Auth::logout();
            return response()->json(['message' => 'Your account has been disabled.'], 403);
        }

        Auth::user()->update(['last_login_at' => now()]);
        $request->session()->regenerate();

        return response()->json(Auth::user());
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Logged out.']);
    }

    public function webLogout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }

    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    public function sso(Request $request)
    {
        $rawToken = $request->query('token', '');

        if (empty($rawToken)) {
            abort(403, 'Invalid or expired login link.');
        }

        $record = LoginToken::where('token_hash', hash('sha256', $rawToken))
            ->with('user')
            ->first();

        if (!$record || !$record->isValid()) {
            abort(403, 'Invalid or expired login link.');
        }

        if (!$record->user->is_active) {
            abort(403, 'Your account has been disabled.');
        }

        $record->update(['used_at' => now()]);
        $record->user->update(['last_login_at' => now()]);

        Auth::login($record->user, remember: false);
        $request->session()->regenerate();

        return redirect('/');
    }

    public function inviteRedirect(string $token)
    {
        $record = MagicLinkToken::where('token', $token)->first();

        if (!$record || !$record->isValid()) {
            return redirect('/?invite_error=expired');
        }

        return redirect('/?set_password_token=' . $token);
    }

    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'password'         => 'required|string|min:8|confirmed',
        ]);

        if (!Hash::check($request->current_password, $request->user()->password)) {
            return response()->json(['message' => 'Current password is incorrect.'], 422);
        }

        $request->user()->update(['password' => $request->password]);

        return response()->json(['message' => 'Password updated.']);
    }

    public function setPassword(Request $request)
    {
        $request->validate([
            'token'    => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $record = MagicLinkToken::where('token', $request->token)->with('user')->first();

        if (!$record || !$record->isValid()) {
            return response()->json(['message' => 'This link has expired or already been used.'], 422);
        }

        $record->update(['used_at' => now()]);
        $record->user->update(['password' => $request->password]);

        Auth::login($record->user, remember: true);
        $request->session()->regenerate();

        return response()->json(Auth::user());
    }
}
