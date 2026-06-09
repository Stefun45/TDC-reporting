<?php

use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

Route::get('/auth/invite/{token}', [AuthController::class, 'inviteRedirect'])->name('invite.redirect');

Route::get('/{any}', fn() => view('app'))->where('any', '.*');
