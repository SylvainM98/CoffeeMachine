<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Coffee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class OrderController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/v1/orders",
     *     summary="Liste toutes les commandes",
     *     tags={"Orders"},
     *     @OA\Response(
     *         response=200,
     *         description="Liste des commandes"
     *     )
     * )
     */
    public function index()
    {
        $orders = Order::with('coffee')->get();
        return response()->json([
            'message' => 'Liste des commandes',
            'data' => $orders
        ]);
    }

    /**
     * @OA\Post(
     *     path="/api/v1/orders",
     *     summary="Crée une nouvelle commande",
     *     tags={"Orders"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"coffee_id"},
     *             @OA\Property(property="coffee_id", type="integer", example=1),
     *             @OA\Property(property="customer_name", type="string", example="John Doe"),
     *             @OA\Property(property="pickup_time", type="string", format="date-time", example="2025-05-11 15:30:00")
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Commande créée"
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Données invalides"
     *     )
     * )
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'coffee_id' => 'required|exists:coffees,id',
            'customer_name' => 'nullable|string|max:255',
            'pickup_time' => 'nullable|date|after:now'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $coffee = Coffee::findOrFail($request->coffee_id);

        if (!$request->pickup_time) {
            // C'est une commande immédiate

            // Vérifier s'il y a une commande en cours de préparation
            $currentProcessingOrder = Order::where('status', 'brewing')->first();

            // Vérifier s'il y a des commandes immédiates en attente
            $pendingImmediateOrders = Order::where('status', 'pending')
                ->whereNull('pickup_time')
                ->count();

            if ($currentProcessingOrder || $pendingImmediateOrders > 0) {
                return response()->json([
                    'message' => 'Une commande immédiate est déjà en cours. Veuillez attendre ou réserver un créneau.',
                    'current_order' => $currentProcessingOrder ?? Order::where('status', 'pending')->whereNull('pickup_time')->first()->load('coffee'),
                    'suggested_action' => 'reservation'
                ], 409);
            }
        } else {
            // C'est une réservation
            $currentOrder = Order::where('status', 'brewing')->first();
            $pendingOrders = Order::where('status', 'pending')->with('coffee')->get();

            $totalPreparationTime = 0;

            if ($currentOrder && $currentOrder->estimated_completion_time) {
                $remaining = max(0, $currentOrder->estimated_completion_time->diffInSeconds(now()));
                $totalPreparationTime += $remaining;
            }

            // Ajouter le temps des commandes immédiates et des réservations proches seulement
            foreach ($pendingOrders as $order) {
                if (!$order->pickup_time) {
                    // Commandes immédiates
                    $totalPreparationTime += $order->coffee->preparation_time;
                } elseif ($order->pickup_time && $order->pickup_time <= now()->addMinutes(30)) {
                    // Réservations dans la prochaine demi-heure
                    $totalPreparationTime += $order->coffee->preparation_time;
                }
            }

            $totalPreparationTime += $coffee->preparation_time;

            $earliestAvailable = now()->addSeconds($totalPreparationTime);
            $requestedTime = Carbon::parse($request->pickup_time);

            // NOUVELLE VÉRIFICATION : Vérifier si le créneau exact est déjà occupé
            $overlappingReservation = Order::where('status', 'pending')
                ->whereNotNull('pickup_time')
                ->where(function ($query) use ($requestedTime, $coffee) {
                    $startWindow = $requestedTime->copy()->subSeconds(max(30, $coffee->preparation_time));
                    $endWindow = $requestedTime->copy()->addSeconds(max(30, $coffee->preparation_time));

                    $query->where('pickup_time', $requestedTime)
                        ->orWhereBetween('pickup_time', [$startWindow, $endWindow]);
                })
                ->first();

            if ($overlappingReservation) {
                // Calculer le prochain créneau disponible après cet overlap
                $nextAvailableTime = $overlappingReservation->pickup_time->copy();

                // Si la réservation a le même horaire, ajouter le temps de préparation
                if ($nextAvailableTime->equalTo($requestedTime)) {
                    $nextAvailableTime->addSeconds($overlappingReservation->coffee->preparation_time + 60); // 1 minute de buffer
                } else {
                    // Si c'est dans la fenêtre, calculer le vrai prochain disponible
                    $overlapEnd = $overlappingReservation->pickup_time->copy()->addSeconds($overlappingReservation->coffee->preparation_time);
                    $nextAvailableTime = max($overlapEnd, $requestedTime)->addSeconds(60); // 1 minute de buffer
                }

                // Arrondir au prochain multiple de 15 minutes
                $minutes = $nextAvailableTime->minute;
                $roundedMinutes = ceil($minutes / 15) * 15;
                if ($roundedMinutes >= 60) {
                    $nextAvailableTime->addHour()->minute(0);
                } else {
                    $nextAvailableTime->minute($roundedMinutes);
                }
                $nextAvailableTime->second(0);

                return response()->json([
                    'message' => 'Ce créneau est déjà occupé. Choisissez un créneau après ' . $nextAvailableTime->format('H:i'),
                    'earliest_available' => $nextAvailableTime,
                    'requested_time' => $requestedTime,
                    'overlapping_reservation' => $overlappingReservation->load('coffee')
                ], 422);
            }

            if ($requestedTime->lessThan($earliestAvailable)) {
                return response()->json([
                    'message' => 'Le créneau demandé n\'est pas disponible. Choisissez un créneau après ' . $earliestAvailable->format('H:i'),
                    'earliest_available' => $earliestAvailable,
                    'requested_time' => $requestedTime
                ], 422);
            }
        }

        $order = Order::create([
            'coffee_id' => $request->coffee_id,
            'customer_name' => $request->customer_name ?? 'Client',
            'status' => 'pending',
            'progress' => 0,
            'pickup_time' => $request->pickup_time
        ]);

        return response()->json([
            'message' => $request->pickup_time ? 'Réservation créée avec succès' : 'Commande créée avec succès',
            'data' => $order->load('coffee'),
            'pickup_info' => $request->pickup_time ?
                "Votre café sera prêt à " . Carbon::parse($request->pickup_time)->format('H:i') :
                "Votre café sera prêt dans environ " . $coffee->preparation_time . " secondes"
        ], 201);
    }

    /**
     * @OA\Get(
     *     path="/api/v1/orders/{order}",
     *     summary="Affiche une commande spécifique",
     *     tags={"Orders"},
     *     @OA\Parameter(
     *         name="order",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Détails de la commande"
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Commande non trouvée"
     *     )
     * )
     */
    public function show(Order $order)
    {
        $order->load('coffee');

        return response()->json([
            'message' => 'Détail de la commande',
            'data' => $order
        ]);
    }

    /**
     * @OA\Put(
     *     path="/api/v1/orders/{order}",
     *     summary="Met à jour une commande",
     *     tags={"Orders"},
     *     @OA\Parameter(
     *         name="order",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         @OA\JsonContent(
     *             @OA\Property(property="coffee_id", type="integer", example=2),
     *             @OA\Property(property="customer_name", type="string", example="Jane Doe"),
     *             @OA\Property(property="pickup_time", type="string", format="date-time", example="2025-05-11 15:30:00")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Commande mise à jour"
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Commande non trouvée"
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Données invalides"
     *     )
     * )
     */
    public function update(Request $request, Order $order)
    {
        $validator = Validator::make($request->all(), [
            'coffee_id' => 'sometimes|exists:coffees,id',
            'customer_name' => 'nullable|string|max:255',
            'pickup_time' => 'nullable|date|after:now'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        if ($order->status !== 'pending') {
            return response()->json([
                'message' => 'Impossible de modifier une commande déjà en cours de traitement'
            ], 400);
        }

        $order->update($request->only(['coffee_id', 'customer_name', 'pickup_time']));

        return response()->json([
            'message' => 'Commande mise à jour',
            'data' => $order->load('coffee')
        ]);
    }

    /**
     * @OA\Delete(
     *     path="/api/v1/orders/{order}",
     *     summary="Supprime une commande",
     *     tags={"Orders"},
     *     @OA\Parameter(
     *         name="order",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Commande supprimée"
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Commande non trouvée"
     *     ),
     *     @OA\Response(
     *         response=400,
     *         description="Impossible de supprimer une commande en cours"
     *     )
     * )
     */
    public function destroy(Order $order)
    {
        if ($order->status !== 'pending') {
            return response()->json([
                'message' => 'Impossible de supprimer une commande déjà en cours de traitement'
            ], 400);
        }

        $order->delete();

        return response()->json([
            'message' => 'Commande supprimée'
        ]);
    }
}
