<?php

use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

Route::get('/auth/invite/{token}', [AuthController::class, 'inviteRedirect'])->name('invite.redirect');
Route::get('/auth/sso', [AuthController::class, 'sso'])->name('sso.login');
Route::get('/logout', [AuthController::class, 'webLogout'])->name('logout');

Route::get('/{any}', fn() => view('app'))->where('any', '.*');
