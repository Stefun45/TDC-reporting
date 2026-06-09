<?php

use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

Route::get('/auth/magic-link/{token}', [AuthController::class, 'verify'])->name('magic-link.verify');

Route::get('/{any}', fn() => view('app'))->where('any', '.*');
