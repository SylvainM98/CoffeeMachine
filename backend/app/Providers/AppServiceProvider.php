<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->register(\L5Swagger\L5SwaggerServiceProvider::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->loadViewsFrom(base_path('resources/views/vendor/l5-swagger'), 'l5-swagger');

        $this->publishes([
            base_path('vendor/swagger-api/swagger-ui/dist') => public_path('vendor/swagger-ui'),
        ], 'public');
    }
}
