<?php

namespace App\Http\Controllers;

use App\Mail\MagicLinkMail;
use App\Models\MagicLinkToken;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function requestLink(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        $user = User::where('email', strtolower($request->email))->first();

        if (!$user) {
            // Return success regardless to avoid email enumeration
            return response()->json(['message' => 'If that email is registered, a login link has been sent.']);
        }

        $token = $this->createToken($user);

        Mail::to($user->email)->send(new MagicLinkMail($user, $token));

        return response()->json(['message' => 'If that email is registered, a login link has been sent.']);
    }

    public function verify(string $token)
    {
        $record = MagicLinkToken::where('token', $token)->with('user')->first();

        if (!$record || !$record->isValid()) {
            return redirect('/')->with('error', 'This login link has expired or already been used.');
        }

        $record->update(['used_at' => now()]);

        Auth::login($record->user, remember: true);

        $request = request();
        $request->session()->regenerate();

        return redirect('/');
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

    private function createToken(User $user): string
    {
        // Invalidate any previous unused tokens
        $user->magicLinkTokens()->whereNull('used_at')->delete();

        $token = Str::random(64);

        MagicLinkToken::create([
            'user_id' => $user->id,
            'token' => $token,
            'expires_at' => now()->addMinutes(15),
        ]);

        return $token;
    }
}
