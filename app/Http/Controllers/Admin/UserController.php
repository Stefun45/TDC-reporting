<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::query();

        if ($request->filled('email')) {
            $query->where('email', strtolower($request->email));
        }
        if ($request->has('is_active')) {
            $query->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN));
        }

        return response()->json([
            'data' => $query->orderBy('name')->get()->map(fn($u) => $this->resource($u)),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name'      => 'required|string|max:255',
            'email'     => 'required|email|unique:users,email',
            'password'  => 'nullable|string|min:8',
            'is_active' => 'boolean',
        ]);

        $user = User::create([
            'name'        => $request->name,
            'email'       => strtolower($request->email),
            'password'    => $request->password,
            'is_active'   => $request->input('is_active', true),
            'is_admin'    => false,
            'permissions' => [],
        ]);

        return response()->json(['data' => $this->resource($user)], 201);
    }

    public function show(User $user)
    {
        return response()->json(['data' => $this->resource($user)]);
    }

    public function update(Request $request, User $user)
    {
        $request->validate([
            'name'      => 'sometimes|string|max:255',
            'email'     => 'sometimes|email|unique:users,email,' . $user->id,
            'password'  => 'nullable|string|min:8',
            'is_active' => 'boolean',
        ]);

        $data = $request->only(['name', 'password', 'is_active']);
        if ($request->filled('email')) {
            $data['email'] = strtolower($request->email);
        }

        $user->update($data);

        return response()->json(['data' => $this->resource($user->fresh())]);
    }

    public function enable(User $user)
    {
        $user->update(['is_active' => true]);
        return response()->json(['data' => $this->resource($user->fresh())]);
    }

    public function disable(User $user)
    {
        $user->update(['is_active' => false]);
        return response()->json(['data' => $this->resource($user->fresh())]);
    }

    public function destroy(User $user)
    {
        $user->loginTokens()->delete();
        $user->magicLinkTokens()->delete();
        $user->delete();
        return response()->json(null, 204);
    }

    private function resource(User $user): array
    {
        return [
            'id'            => $user->id,
            'name'          => $user->name,
            'email'         => $user->email,
            'is_active'     => (bool) $user->is_active,
            'last_login_at' => $user->last_login_at?->toIso8601String(),
            'created_at'    => $user->created_at->toIso8601String(),
        ];
    }
}
