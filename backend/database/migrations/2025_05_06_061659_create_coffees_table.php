<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('coffees', function (Blueprint $table) {
            $table->id();
            $table->string('type'); // espresso, cappuccino, latte
            // Taille unique, donc pas besoin du champ size
            $table->decimal('price', 5, 2);
            $table->integer('preparation_time')->comment('en secondes');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('coffees');
    }
};