<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'coffee_id',
        'status',
        'progress',
        'estimated_completion_time',
        'customer_name',
        'pickup_time'
    ];

    protected $casts = [
        'estimated_completion_time' => 'datetime',
        'pickup_time' => 'datetime'
    ];

    public function coffee()
    {
        return $this->belongsTo(Coffee::class);
    }

    public function isReservation()
    {
        return $this->pickup_time !== null;
    }
}
