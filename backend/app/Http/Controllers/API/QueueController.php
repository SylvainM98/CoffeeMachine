<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Carbon\Carbon;

/**
 * @OA\Tag(
 *     name="Queue",
 *     description="Opérations sur la file d'attente et les créneaux"
 * )
 * 
 * @OA\Schema(
 *     schema="QueueStatus",
 *     type="object",
 *     @OA\Property(property="current_order", ref="#/components/schemas/Order"),
 *     @OA\Property(property="queue", type="array", @OA\Items(ref="#/components/schemas/Order")),
 *     @OA\Property(property="queue_length", type="integer", example=3),
 *     @OA\Property(property="estimated_wait_time", type="number", format="float", example=180.5),
 *     @OA\Property(property="machine_status", type="string", enum={"idle", "busy"}, example="busy")
 * )
 * 
 * @OA\Schema(
 *     schema="TimeSlot",
 *     type="object",
 *     @OA\Property(property="time", type="string", format="date-time", example="2025-05-11T15:30:00Z"),
 *     @OA\Property(property="formatted_time", type="string", example="2025-05-11 15:30:00"),
 *     @OA\Property(property="display_time", type="string", example="11/05 à 15:30"),
 *     @OA\Property(property="is_next_available", type="boolean", example=true)
 * )
 */
class QueueController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/v1/queue/status",
     *     summary="Obtient le statut de la file d'attente",
     *     tags={"Queue"},
     *     @OA\Response(
     *         response=200,
     *         description="Statut de la file d'attente",
     *         @OA\JsonContent(ref="#/components/schemas/QueueStatus")
     *     )
     * )
     */
    public function status()
    {
        $currentOrder = Order::where('status', 'brewing')->first();

        // Tri correct des commandes en attente (même logique que le worker)
        $pendingOrders = Order::where('status', 'pending')
            ->orderByRaw('pickup_time IS NULL DESC')  // Immédiates d'abord
            ->orderBy('pickup_time', 'asc')           // Puis réservations par ordre chronologique
            ->orderBy('created_at', 'asc')           // Puis création pour les égalités
            ->with('coffee')
            ->get();

        $estimatedTime = 0;
        if ($currentOrder && $currentOrder->estimated_completion_time) {
            $estimatedTime += max(0, $currentOrder->estimated_completion_time->diffInSeconds(now()));
        }

        // Calculer le temps d'attente en tenant compte du bon ordre
        foreach ($pendingOrders as $order) {
            $estimatedTime += $order->coffee->preparation_time;
        }

        return response()->json([
            'current_order' => $currentOrder ? $currentOrder->load('coffee') : null,
            'queue' => $pendingOrders,
            'queue_length' => $pendingOrders->count(),
            'estimated_wait_time' => $estimatedTime,
            'machine_status' => $currentOrder ? 'busy' : 'idle'
        ]);
    }

    /**
     * @OA\Get(
     *     path="/api/v1/queue/next-slot",
     *     summary="Obtient le prochain créneau disponible",
     *     tags={"Queue"},
     *     @OA\Response(
     *         response=200,
     *         description="Prochain créneau disponible",
     *         @OA\JsonContent(
     *             type="object",
     *             @OA\Property(property="next_available_slot", type="string", format="date-time"),
     *             @OA\Property(property="waiting_time_minutes", type="integer", example=3),
     *             @OA\Property(property="queue_position", type="integer", example=4),
     *             @OA\Property(property="estimated_completion_time", type="string", format="date-time")
     *         )
     *     )
     * )
     */
    public function nextSlot()
    {
        $currentOrder = Order::where('status', 'brewing')->first();
        $pendingOrders = Order::where('status', 'pending')->with('coffee')->get();

        $totalPreparationTime = 0;

        if ($currentOrder && $currentOrder->estimated_completion_time) {
            $remaining = max(0, $currentOrder->estimated_completion_time->diffInSeconds(now()));
            $totalPreparationTime += $remaining;
        }

        foreach ($pendingOrders as $order) {
            $totalPreparationTime += $order->coffee->preparation_time;
        }

        $nextAvailableSlot = now()->addSeconds($totalPreparationTime);

        $minutes = $nextAvailableSlot->minute;
        $roundedMinutes = ceil($minutes / 5) * 5;
        if ($roundedMinutes >= 60) {
            $nextAvailableSlot->addHour()->minute(0);
        } else {
            $nextAvailableSlot->minute($roundedMinutes);
        }
        $nextAvailableSlot->second(0);

        return response()->json([
            'next_available_slot' => $nextAvailableSlot,
            'waiting_time_minutes' => round($totalPreparationTime / 60),
            'queue_position' => $pendingOrders->count() + 1,
            'estimated_completion_time' => $nextAvailableSlot
        ]);
    }

    /**
     * @OA\Get(
     *     path="/api/v1/queue/available-slots",
     *     summary="Obtient la liste des créneaux disponibles",
     *     tags={"Queue"},
     *     @OA\Response(
     *         response=200,
     *         description="Liste des créneaux disponibles",
     *         @OA\JsonContent(
     *             type="object",
     *             @OA\Property(
     *                 property="available_slots",
     *                 type="array",
     *                 @OA\Items(ref="#/components/schemas/TimeSlot")
     *             ),
     *             @OA\Property(property="earliest_slot", ref="#/components/schemas/TimeSlot"),
     *             @OA\Property(property="total_options", type="integer", example=8)
     *         )
     *     )
     * )
     */
    public function availableSlots()
    {
        $currentOrder = Order::where('status', 'brewing')->first();
        $pendingOrders = Order::where('status', 'pending')->with('coffee')->get();

        // Récupérer toutes les réservations futures pour éviter les conflits
        $existingReservations = Order::where('status', 'pending')
            ->whereNotNull('pickup_time')
            ->orderBy('pickup_time')
            ->get();

        $totalPreparationTime = 0;

        if ($currentOrder && $currentOrder->estimated_completion_time) {
            $remaining = max(0, $currentOrder->estimated_completion_time->diffInSeconds(now()));
            $totalPreparationTime += $remaining;
        }

        foreach ($pendingOrders as $order) {
            $totalPreparationTime += $order->coffee->preparation_time;
        }

        $availableSlots = [];
        $baseTime = now()->addSeconds($totalPreparationTime);

        $minutes = $baseTime->minute;
        $roundedMinutes = ceil($minutes / 15) * 15;
        if ($roundedMinutes >= 60) {
            $baseTime = $baseTime->addHour()->minute(0);
        } else {
            $baseTime = $baseTime->minute($roundedMinutes);
        }
        $baseTime = $baseTime->second(0);

        // Générer les créneaux et vérifier la disponibilité
        for ($i = 0; $i < 32; $i++) {
            $slot = $baseTime->copy()->addMinutes($i * 15);

            if ($slot->hour >= 8 && $slot->hour < 18) {
                // Vérifier si ce créneau est déjà occupé par une réservation
                $isOccupied = $existingReservations->contains(function ($reservation) use ($slot) {
                    return $reservation->pickup_time->equalTo($slot);
                });

                if (!$isOccupied) {
                    $availableSlots[] = [
                        'time' => $slot,
                        'formatted_time' => $slot->format('Y-m-d H:i:s'),
                        'display_time' => $slot->format('d/m à H:i'),
                        'is_next_available' => count($availableSlots) === 0 // Premier créneau disponible
                    ];
                }
            }
        }

        return response()->json([
            'available_slots' => $availableSlots,
            'earliest_slot' => $availableSlots[0] ?? null,
            'total_options' => count($availableSlots)
        ]);
    }

    /**
     * @OA\Post(
     *     path="/api/v1/queue/validate-slot",
     *     summary="Valide si un créneau est disponible",
     *     tags={"Queue"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"pickup_time"},
     *             @OA\Property(property="pickup_time", type="string", format="date-time", example="2025-05-11 15:30:00")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Résultat de la validation",
     *         @OA\JsonContent(
     *             type="object",
     *             @OA\Property(property="is_available", type="boolean", example=true),
     *             @OA\Property(property="requested_time", type="string", format="date-time"),
     *             @OA\Property(property="earliest_available_time", type="string", format="date-time"),
     *             @OA\Property(property="message", type="string", example="Créneau disponible")
     *         )
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Données invalides",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string"),
     *             @OA\Property(property="errors", type="object")
     *         )
     *     )
     * )
     */
    public function validateSlot(Request $request)
    {
        $request->validate([
            'pickup_time' => 'required|date|after:now'
        ]);

        $requestedTime = Carbon::parse($request->pickup_time);

        $currentOrder = Order::where('status', 'brewing')->first();
        $pendingOrders = Order::where('status', 'pending')->with('coffee')->get();

        $totalPreparationTime = 0;

        if ($currentOrder && $currentOrder->estimated_completion_time) {
            $remaining = max(0, $currentOrder->estimated_completion_time->diffInSeconds(now()));
            $totalPreparationTime += $remaining;
        }

        foreach ($pendingOrders as $order) {
            $totalPreparationTime += $order->coffee->preparation_time;
        }

        $earliestAvailable = now()->addSeconds($totalPreparationTime);

        // Vérifier aussi s'il y a déjà une réservation à ce créneau exact
        $existingReservation = Order::where('status', 'pending')
            ->whereNotNull('pickup_time')
            ->where('pickup_time', $requestedTime)
            ->first();

        $isAvailable = $requestedTime->greaterThan($earliestAvailable) && !$existingReservation;

        if ($existingReservation) {
            $message = 'Créneau déjà occupé. Choisissez un autre horaire.';
        } elseif (!$requestedTime->greaterThan($earliestAvailable)) {
            $message = 'Créneau trop tôt. Le prochain disponible est à ' . $earliestAvailable->format('H:i');
        } else {
            $message = 'Créneau disponible';
        }

        return response()->json([
            'is_available' => $isAvailable,
            'requested_time' => $requestedTime,
            'earliest_available_time' => $earliestAvailable,
            'message' => $message
        ]);
    }
}
