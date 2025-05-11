<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\CoffeeController;
use App\Http\Controllers\API\OrderController;
use App\Http\Controllers\API\ProcessController;
use App\Http\Controllers\API\QueueController;
use App\Http\Controllers\API\MachineController;

Route::get('/test', function () {
    return response()->json(['message' => 'API fonctionne!']);
});

Route::prefix('v1')->group(function () {
    Route::get('/coffees', [CoffeeController::class, 'index']);
    Route::get('/coffees/{coffee}', [CoffeeController::class, 'show']);

    Route::apiResource('orders', OrderController::class);

    Route::post('/process/{order}/start', [ProcessController::class, 'startProcess']);
    Route::get('/process/{order}/progress', [ProcessController::class, 'getProgress']);

    Route::get('/queue/status', [QueueController::class, 'status']);
    Route::get('/queue/next-slot', [QueueController::class, 'nextSlot']);
    Route::get('/queue/available-slots', [QueueController::class, 'availableSlots']);
    Route::post('/queue/validate-slot', [QueueController::class, 'validateSlot']);

    Route::get('/machine/opening-hours', [MachineController::class, 'openingHours']);
});
