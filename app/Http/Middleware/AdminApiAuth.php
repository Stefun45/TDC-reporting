<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class AdminApiAuth
{
    public function handle(Request $request, Closure $next)
    {
        $configured = env('ADMIN_API_TOKEN');

        if (empty($configured)) {
            return response()->json(['error' => 'server_misconfigured'], 503);
        }

        $header = $request->header('Authorization', '');

        if (!str_starts_with($header, 'Bearer ')) {
            return response()->json(['error' => 'unauthorized'], 401);
        }

        $provided = substr($header, 7);

        if (!hash_equals($configured, $provided)) {
            return response()->json(['error' => 'unauthorized'], 401);
        }

        return $next($request);
    }
}
