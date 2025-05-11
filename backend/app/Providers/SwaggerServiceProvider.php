<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class SwaggerServiceProvider extends ServiceProvider
{
    public function register() {}

    public function boot()
    {
        $this->loadViewsFrom(base_path('resources/views/vendor/l5-swagger'), 'l5-swagger');

        $this->publishes([
            base_path('vendor/swagger-api/swagger-ui/dist') => public_path('vendor/swagger-ui'),
        ], 'public');
    }
}
