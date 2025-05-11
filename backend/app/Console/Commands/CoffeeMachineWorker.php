<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Order;
use App\Models\Coffee;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class CoffeeMachineWorker extends Command
{
    protected $signature = 'coffee:worker';
    protected $description = 'Service continu de machine à café';

    private $isRunning = true;
    private $currentOrder = null;

    public function __construct()
    {
        parent::__construct();

        if (extension_loaded('pcntl')) {
            pcntl_async_signals(true);
            pcntl_signal(SIGTERM, [$this, 'gracefulStop']);
            pcntl_signal(SIGINT, [$this, 'gracefulStop']);
        }
    }

    public function handle()
    {
        $this->info('🤖 Machine à café démarrée...');
        Log::info('🤖 Service Coffee Machine Worker démarré avec gestion robuste des réservations');

        while ($this->isRunning) {
            try {
                // D'abord, gérer les réservations passées
                $this->handlePastReservations();

                if (rand(1, 60) === 1) {
                    $this->logMachineStatus();
                }

                if (!$this->currentOrder) {
                    $this->checkForNewOrders();
                }

                if ($this->currentOrder) {
                    $this->processCurrentOrder();
                } else {
                    $this->info('⏳ En attente de commandes...');
                    sleep(2);
                }
            } catch (\Exception $e) {
                $this->error("❌ Erreur: " . $e->getMessage());
                Log::error("Coffee Worker Error: " . $e->getMessage());
                Log::error($e->getTraceAsString());
                sleep(1);
            }
        }
    }

    private function handlePastReservations()
    {
        // Gestion des réservations très en retard (plus de 30 minutes)
        $veryOldReservations = Order::where('status', 'pending')
            ->whereNotNull('pickup_time')
            ->where('pickup_time', '<', Carbon::now('UTC')->subMinutes(30))
            ->get();

        foreach ($veryOldReservations as $order) {
            // Option 1: Convertir en commande immédiate
            $order->update(['pickup_time' => null]);
            $this->info("🔄 Réservation #{$order->id} très en retard convertie en commande immédiate");
            Log::warning("Réservation #{$order->id} convertie en immédiate après 30+ minutes de retard");

            // Option 2: Annuler automatiquement si besoin
            // $order->update(['status' => 'cancelled']);
            // $this->info("❌ Réservation #{$order->id} annulée après 30+ minutes de retard");
        }
    }

    private function checkForNewOrders()
    {
        // 1. D'abord les commandes immédiates
        $this->currentOrder = Order::where('status', 'pending')
            ->whereNull('pickup_time')
            ->orderBy('created_at')
            ->first();

        if ($this->currentOrder) {
            $this->info("📋 Commande immédiate trouvée: #{$this->currentOrder->id}");
            Log::info("Commande immédiate trouvée: #{$this->currentOrder->id}");
            return;
        }

        // 2. Ensuite les réservations dans leur fenêtre (même passées)
        $now = Carbon::now('UTC');
        $windowStart = $now->copy()->subMinutes(30); // Accepter jusqu'à 30 min de retard
        $windowEnd = $now->copy()->addMinutes(5);    // Préparer 5 min à l'avance

        $this->currentOrder = Order::where('status', 'pending')
            ->whereNotNull('pickup_time')
            ->whereBetween('pickup_time', [$windowStart, $windowEnd])
            ->orderBy('pickup_time')  // Traiter d'abord les plus anciennes
            ->first();

        if ($this->currentOrder) {
            $pickupTimeUTC = Carbon::parse($this->currentOrder->pickup_time, 'UTC');
            $minutesUntil = $pickupTimeUTC->diffInMinutes($now, false);

            if ($minutesUntil > 0) {
                $this->info("📋 Réservation dans {$minutesUntil} minutes trouvée: #{$this->currentOrder->id}");
            } else {
                $this->info("📋 Réservation prête trouvée: #{$this->currentOrder->id} (retard: " . abs($minutesUntil) . " minutes)");
            }
            Log::info("Réservation trouvée: #{$this->currentOrder->id} à {$this->currentOrder->pickup_time}");
            return;
        }

        // 3. Logging pour le debug
        if (rand(1, 10) === 1) {
            $nextReservations = Order::where('status', 'pending')
                ->whereNotNull('pickup_time')
                ->orderBy('pickup_time')
                ->take(5)
                ->get();

            if ($nextReservations->count() > 0) {
                $this->info("📅 Prochaines réservations :");
                foreach ($nextReservations as $reservation) {
                    $pickupTimeUTC = Carbon::parse($reservation->pickup_time, 'UTC');
                    $minutesUntil = $pickupTimeUTC->diffInMinutes($now, false);
                    $status = "";

                    if ($minutesUntil <= -30) {
                        $status = "❌ TRÈS EN RETARD";
                    } elseif ($minutesUntil <= 0) {
                        $status = "⚡ PRÊT À TRAITER";
                    } elseif ($minutesUntil <= 5) {
                        $status = "⏰ BIENTÔT PRÊT";
                    }

                    $this->info("   #{$reservation->id} à {$reservation->pickup_time} (dans {$minutesUntil} minutes) {$status}");
                }
            }
        }
    }

    private function processCurrentOrder()
    {
        $type = $this->currentOrder->pickup_time ? "réservation" : "commande";
        $this->info("☕ Début de préparation - {$type} #{$this->currentOrder->id}");

        if ($this->currentOrder->pickup_time) {
            Log::info("Début préparation réservation #{$this->currentOrder->id} (pickup à {$this->currentOrder->pickup_time})");
        } else {
            Log::info("Début préparation commande immédiate #{$this->currentOrder->id}");
        }

        // Si c'est une réservation, gérer le timing
        if ($this->currentOrder->pickup_time) {
            $now = Carbon::now('UTC');
            $pickupTimeUTC = Carbon::parse($this->currentOrder->pickup_time, 'UTC');
            $secondsUntilPickup = $pickupTimeUTC->diffInSeconds($now, false);

            // Si la réservation est dans le futur mais proche
            if ($secondsUntilPickup > 0 && $secondsUntilPickup < 300) { // < 5 minutes
                $preparation_time = $this->currentOrder->coffee->preparation_time;
                $waitTime = max(0, $secondsUntilPickup - $preparation_time);

                if ($waitTime > 0) {
                    $this->info("⏳ Attente de {$waitTime}s avant de préparer la réservation #{$this->currentOrder->id}");
                    sleep($waitTime);
                }
            }
        }

        // Protection contre les boucles infinies
        $maxProcessingTime = $this->currentOrder->coffee->preparation_time * 3; // 3x le temps normal maximum
        $startTime = microtime(true);

        // Commencer la préparation
        $this->currentOrder->update([
            'status' => 'brewing',
            'progress' => 0,
            'estimated_completion_time' => Carbon::now('UTC')->addSeconds($this->currentOrder->coffee->preparation_time)
        ]);

        $preparation_time = $this->currentOrder->coffee->preparation_time;
        $this->info("⚡ Début de la préparation physique - Commande #{$this->currentOrder->id}");

        while (microtime(true) - $startTime < $preparation_time) {
            // Vérifier le timeout maximum
            if (microtime(true) - $startTime > $maxProcessingTime) {
                Log::error("TIMEOUT: Commande #{$this->currentOrder->id} abandonnée après {$maxProcessingTime}s");
                $this->error("⏰ TIMEOUT: Commande #{$this->currentOrder->id} abandonnée");

                // Remettre en pending ou annuler
                $this->currentOrder->update([
                    'status' => 'pending',
                    'progress' => 0,
                    'estimated_completion_time' => null
                ]);

                $this->currentOrder = null;
                return;
            }

            $elapsed = microtime(true) - $startTime;
            $progress = min(99, round(($elapsed / $preparation_time) * 100));

            $this->currentOrder->update(['progress' => $progress]);

            if ($progress % 20 == 0) {
                $this->info("⚡ Progrès: {$progress}% - Commande #{$this->currentOrder->id}");
            }

            $this->currentOrder = $this->currentOrder->fresh();
            if (!$this->currentOrder || $this->currentOrder->status !== 'brewing') {
                $this->error("❌ Commande annulée ou modifiée!");
                return;
            }

            usleep(100000);
        }

        $this->currentOrder->update([
            'status' => 'completed',
            'progress' => 100
        ]);

        $this->info("✅ Commande #{$this->currentOrder->id} terminée!");
        Log::info("Commande #{$this->currentOrder->id} terminée avec succès");

        $this->currentOrder = null;
        sleep(2);
    }

    private function logMachineStatus()
    {
        $currentOrder = Order::where('status', 'brewing')->first();
        $pendingImmediate = Order::where('status', 'pending')->whereNull('pickup_time')->count();
        $pendingReservations = Order::where('status', 'pending')->whereNotNull('pickup_time')->count();
        $pastReservations = Order::where('status', 'pending')
            ->whereNotNull('pickup_time')
            ->where('pickup_time', '<', Carbon::now('UTC'))
            ->count();

        Log::info("📊 État de la machine - Actuelle: " . ($currentOrder ? "#{$currentOrder->id}" : "Aucune") .
            ", Immédiates: {$pendingImmediate}, Réservations: {$pendingReservations}, En retard: {$pastReservations}");
    }

    public function gracefulStop()
    {
        $this->info('🛑 Arrêt gracieux du service...');
        Log::info('Coffee Worker s\'arrête gracieusement');

        $this->isRunning = false;

        if ($this->currentOrder) {
            $this->currentOrder->update([
                'status' => 'pending',
                'progress' => 0,
                'estimated_completion_time' => null
            ]);

            $this->info("♻️  Commande #{$this->currentOrder->id} remise en attente");
        }

        exit(0);
    }
}
