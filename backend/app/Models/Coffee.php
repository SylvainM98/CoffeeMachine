<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Coffee extends Model
{
    use HasFactory;

    protected $fillable = [
        'type',
        'price',
        'preparation_time',
    ];

    public function orders()
    {
        return $this->hasMany(Order::class);
    }
}