<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Routing\Controller as BaseController;
use OpenApi\Annotations as OA;

/**
 * @OA\Info(
 *     version="1.0.0",
 *     title="API Machine à Café Connectée",
 *     description="API pour simuler une machine à café connectée",
 *     @OA\Contact(
 *         email="contact@cafe-connecte.com"
 *     )
 * )
 * 
 * @OA\Server(
 *     url="/api/v1",
 *     description="Serveur API"
 * )
 * 
 * @OA\Tag(
 *     name="Coffees",
 *     description="Opérations sur les types de café"
 * )
 * 
 * @OA\Tag(
 *     name="Orders",
 *     description="Opérations sur les commandes"
 * )
 * 
 * @OA\Tag(
 *     name="Process",
 *     description="Opérations sur le processus de préparation"
 * )
 * 
 * @OA\Schema(
 *     schema="Coffee",
 *     type="object",
 *     @OA\Property(property="id", type="integer", format="int64", example=1),
 *     @OA\Property(property="type", type="string", example="Espresso"),
 *     @OA\Property(property="price", type="number", format="float", example=2.50),
 *     @OA\Property(property="preparation_time", type="integer", example=30),
 *     @OA\Property(property="created_at", type="string", format="date-time"),
 *     @OA\Property(property="updated_at", type="string", format="date-time")
 * )
 * 
 * @OA\Schema(
 *     schema="Order",
 *     type="object",
 *     @OA\Property(property="id", type="integer", format="int64", example=1),
 *     @OA\Property(property="coffee_id", type="integer", format="int64", example=1),
 *     @OA\Property(property="status", type="string", enum={"pending", "brewing", "completed", "cancelled"}, example="pending"),
 *     @OA\Property(property="progress", type="integer", format="int32", example=0),
 *     @OA\Property(property="estimated_completion_time", type="string", format="date-time"),
 *     @OA\Property(property="customer_name", type="string", example="John Doe"),
 *     @OA\Property(property="created_at", type="string", format="date-time"),
 *     @OA\Property(property="updated_at", type="string", format="date-time")
 * )
 * 
 * @OA\Components(
 *     @OA\Response(
 *         response="NotFound",
 *         description="Ressource non trouvée",
 *         @OA\JsonContent(
 *             @OA\Property(property="message", type="string", example="Ressource non trouvée")
 *         )
 *     ),
 *     @OA\Response(
 *         response="ValidationError",
 *         description="Erreur de validation",
 *         @OA\JsonContent(
 *             @OA\Property(property="message", type="string", example="Validation error"),
 *             @OA\Property(
 *                 property="errors",
 *                 type="object",
 *                 @OA\AdditionalProperties(
 *                     type="array",
 *                     @OA\Items(type="string")
 *                 )
 *             )
 *         )
 *     )
 * )
 */
class Controller extends BaseController
{
    use AuthorizesRequests, ValidatesRequests;
}