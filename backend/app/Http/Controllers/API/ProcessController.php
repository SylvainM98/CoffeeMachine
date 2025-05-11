<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class ProcessController extends Controller
{
    /**
     * @OA\Post(
     *     path="/api/v1/process/{order}/start",
     *     summary="Démarre le processus de préparation",
     *     tags={"Process"},
     *     @OA\Parameter(
     *         name="order",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Processus démarré"
     *     ),
     *     @OA\Response(
     *         response=400,
     *         description="Commande déjà en cours"
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Commande non trouvée"
     *     )
     * )
     */
    public function startProcess(Order $order)
    {
        Log::info("🎯 Tentative de démarrage du processus pour la commande #{$order->id}");

        if ($order->status !== 'pending') {
            Log::warning("⚠️  Commande #{$order->id} n'est pas en statut 'pending', statut actuel: {$order->status}");
            return response()->json([
                'message' => 'Cette commande est déjà en cours de traitement'
            ], 400);
        }

        // Plus besoin de dispatcher un job ou de modifier le statut
        // Le coffee-worker s'en chargera automatiquement !

        Log::info("📋 Commande #{$order->id} ajoutée à la file d'attente (sera gérée par le worker)");

        return response()->json([
            'message' => 'Commande ajoutée à la file d\'attente',
            'order' => $order->load('coffee')
        ]);
    }

    /**
     * @OA\Get(
     *     path="/api/v1/process/{order}/progress",
     *     summary="Récupère la progression du processus",
     *     tags={"Process"},
     *     @OA\Parameter(
     *         name="order",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Progression du processus"
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Commande non trouvée"
     *     )
     * )
     */
    public function getProgress(Order $order)
    {
        Log::info("📊 Demande de progression pour la commande #{$order->id} - Status: {$order->status}, Progress: {$order->progress}%");

        // Si la commande est en cours, calculer le temps restant
        $remainingTime = 0;
        if ($order->status === 'brewing' && $order->estimated_completion_time) {
            $remainingTime = max(0, Carbon::parse($order->estimated_completion_time)->diffInSeconds(now()));
        }

        return response()->json([
            'status' => $order->status,
            'progress' => $order->progress,
            'estimated_completion' => $order->estimated_completion_time,
            'remaining_seconds' => $remainingTime
        ]);
    }
}
