<?php

namespace App\Http\Controllers;

use App\Models\MagicLinkToken;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if (!Auth::attempt(['email' => strtolower($request->email), 'password' => $request->password], true)) {
            return response()->json(['message' => 'Invalid email or password.'], 401);
        }

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

    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    // Invite link → redirect to SPA with token in query string
    public function inviteRedirect(string $token)
    {
        $record = MagicLinkToken::where('token', $token)->first();

        if (!$record || !$record->isValid()) {
            return redirect('/?invite_error=expired');
        }

        return redirect('/?set_password_token=' . $token);
    }

    public function setPassword(Request $request)
    {
        $request->validate([
            'token' => 'required|string',
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
