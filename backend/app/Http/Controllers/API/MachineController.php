<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;

class MachineController extends Controller
{
    public function openingHours()
    {
        return response()->json([
            'opening_hours' => [
                'monday' => ['start' => '08:00', 'end' => '18:00'],
                'tuesday' => ['start' => '08:00', 'end' => '18:00'],
                'wednesday' => ['start' => '08:00', 'end' => '18:00'],
                'thursday' => ['start' => '08:00', 'end' => '18:00'],
                'friday' => ['start' => '08:00', 'end' => '18:00'],
                'saturday' => ['start' => '09:00', 'end' => '17:00'],
                'sunday' => null
            ],
            'timezone' => config('app.timezone'),
            'current_time' => now()
        ]);
    }
}
