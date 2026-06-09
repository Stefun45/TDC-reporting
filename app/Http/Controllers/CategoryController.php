<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index()
    {
        return response()->json(Category::orderBy('sort_order')->get());
    }

    public function store(Request $request)
    {
        abort_unless($request->user()->is_admin, 403);

        $request->validate([
            'id'          => 'required|string|max:100|unique:categories,id',
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'url'         => 'nullable|string',
            'icon'        => 'nullable|string|max:100',
            'critical'    => 'boolean',
            'active'      => 'boolean',
        ]);

        $category = Category::create([
            'id'          => $request->id,
            'title'       => $request->title,
            'description' => $request->description ?? '—',
            'url'         => $request->url ?? '#',
            'icon'        => $request->icon ?? 'FileBarChart',
            'critical'    => $request->boolean('critical'),
            'active'      => $request->has('active') ? $request->boolean('active') : true,
            'sort_order'  => (Category::max('sort_order') ?? 0) + 1,
        ]);

        return response()->json($category, 201);
    }

    public function update(Request $request, Category $category)
    {
        abort_unless($request->user()->is_admin, 403);

        $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'url'         => 'nullable|string',
            'icon'        => 'nullable|string|max:100',
            'critical'    => 'boolean',
            'active'      => 'boolean',
        ]);

        $category->update([
            'title'       => $request->title,
            'description' => $request->description ?? '—',
            'url'         => $request->url ?? '#',
            'icon'        => $request->icon ?? $category->icon,
            'critical'    => $request->boolean('critical'),
            'active'      => $request->has('active') ? $request->boolean('active') : $category->active,
        ]);

        return response()->json($category->fresh());
    }

    public function destroy(Request $request, Category $category)
    {
        abort_unless($request->user()->is_admin, 403);
        $category->delete();
        return response()->json(null, 204);
    }
}
