<?php

namespace App\Http\Controllers;

use App\Mail\InviteMail;
use App\Models\MagicLinkToken;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class UserController extends Controller
{
    public function index()
    {
        return response()->json(User::orderBy('name')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'is_admin' => 'boolean',
            'permissions' => 'nullable|array',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => strtolower($request->email),
            'is_admin' => $request->boolean('is_admin'),
            'permissions' => $request->is_admin ? null : ($request->permissions ?? []),
        ]);

        $token = $this->createInviteToken($user);

        Mail::to($user->email)->send(new InviteMail($user, $token, $request->user()));

        return response()->json($user, 201);
    }

    public function update(Request $request, User $user)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'is_admin' => 'boolean',
            'permissions' => 'nullable|array',
        ]);

        $user->update([
            'name' => $request->name,
            'email' => strtolower($request->email),
            'is_admin' => $request->boolean('is_admin'),
            'permissions' => $request->boolean('is_admin') ? null : ($request->permissions ?? []),
        ]);

        return response()->json($user->fresh());
    }

    public function destroy(User $user)
    {
        $user->delete();
        return response()->json(null, 204);
    }

    private function createInviteToken(User $user): string
    {
        $token = Str::random(64);

        MagicLinkToken::create([
            'user_id' => $user->id,
            'token' => $token,
            'expires_at' => now()->addHours(48),
        ]);

        return $token;
    }
}
