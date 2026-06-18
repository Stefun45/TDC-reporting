<?php

use App\Http\Controllers\Admin;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/set-password', [AuthController::class, 'setPassword']);

Route::middleware(['auth', 'active'])->group(function () {
    Route::get('/user', [AuthController::class, 'me']);
    Route::put('/auth/password', [AuthController::class, 'changePassword']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::put('/users/{user}', [UserController::class, 'update']);
    Route::delete('/users/{user}', [UserController::class, 'destroy']);

    Route::get('/categories', [CategoryController::class, 'index']);
    Route::post('/categories', [CategoryController::class, 'store']);
    Route::put('/categories/reorder', [CategoryController::class, 'reorder']);
    Route::put('/categories/{category}', [CategoryController::class, 'update']);
    Route::delete('/categories/{category}', [CategoryController::class, 'destroy']);
});

Route::middleware('admin.api')->prefix('admin')->group(function () {
    Route::get('/users', [Admin\UserController::class, 'index']);
    Route::post('/users', [Admin\UserController::class, 'store']);
    Route::get('/users/{user}', [Admin\UserController::class, 'show']);
    Route::match(['put', 'patch'], '/users/{user}', [Admin\UserController::class, 'update']);
    Route::post('/users/{user}/enable', [Admin\UserController::class, 'enable']);
    Route::post('/users/{user}/disable', [Admin\UserController::class, 'disable']);
    Route::delete('/users/{user}', [Admin\UserController::class, 'destroy']);

    Route::post('/auth/login-link', [Admin\LoginLinkController::class, 'store']);
});
