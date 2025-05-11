<?php

namespace Database\Seeders;

use App\Models\Coffee;
use Illuminate\Database\Seeder;

class CoffeeSeeder extends Seeder
{
    public function run()
    {
        $coffees = [
            [
                'type' => 'espresso',
                'price' => 2.50,
                'preparation_time' => 30, // 30 secondes
            ],
            [
                'type' => 'cappuccino',
                'price' => 3.50,
                'preparation_time' => 60, // 1 minute
            ],
            [
                'type' => 'latte',
                'price' => 4.00,
                'preparation_time' => 90, // 1 minute 30
            ],
        ];

        foreach ($coffees as $coffee) {
            Coffee::create($coffee);
        }
    }
}