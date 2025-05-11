<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Coffee;
use Illuminate\Http\Request;

class CoffeeController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/v1/coffees",
     *     summary="Liste tous les cafés disponibles",
     *     tags={"Coffees"},
     *     @OA\Response(
     *         response=200,
     *         description="Liste des cafés"
     *     )
     * )
     */
    public function index()
    {
        $coffees = Coffee::all();
        return response()->json([
            'message' => 'Liste des cafés',
            'data' => $coffees
        ]);
    }

    /**
     * @OA\Get(
     *     path="/api/v1/coffees/{coffee}",
     *     summary="Affiche les détails d'un café",
     *     tags={"Coffees"},
     *     @OA\Parameter(
     *         name="coffee",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Détails du café"
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Café non trouvé"
     *     )
     * )
     */
    public function show($id)
    {
        $coffee = Coffee::findOrFail($id);
        return response()->json([
            'message' => 'Détail du café',
            'data' => $coffee
        ]);
    }
}
