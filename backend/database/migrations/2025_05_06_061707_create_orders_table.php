<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('coffee_id')->constrained();
            $table->enum('status', ['pending', 'brewing', 'completed', 'cancelled'])->default('pending');
            $table->integer('progress')->default(0);
            $table->timestamp('estimated_completion_time')->nullable();
            $table->string('customer_name')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};