<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\LoginToken;
use App\Models\User;
use Illuminate\Http\Request;

class LoginLinkController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'user_id' => 'required_without:email|integer|exists:users,id',
            'email'   => 'required_without:user_id|email',
        ]);

        $user = $request->filled('user_id')
            ? User::findOrFail($request->user_id)
            : User::where('email', strtolower($request->email))->firstOrFail();

        if (!$user->is_active) {
            return response()->json(['error' => 'account_disabled'], 422);
        }

        $rawToken  = bin2hex(random_bytes(32));
        $ttl       = (int) env('LOGIN_TOKEN_TTL', 300);
        $expiresAt = now()->addSeconds($ttl);

        LoginToken::create([
            'user_id'    => $user->id,
            'token_hash' => hash('sha256', $rawToken),
            'expires_at' => $expiresAt,
        ]);

        return response()->json(['data' => [
            'login_url'  => url('/auth/sso') . '?token=' . $rawToken,
            'token'      => $rawToken,
            'expires_at' => $expiresAt->toIso8601String(),
            'expires_in' => $ttl,
            'user'       => [
                'id'            => $user->id,
                'name'          => $user->name,
                'email'         => $user->email,
                'is_active'     => (bool) $user->is_active,
                'last_login_at' => $user->last_login_at?->toIso8601String(),
                'created_at'    => $user->created_at->toIso8601String(),
            ],
        ]]);
    }
}
