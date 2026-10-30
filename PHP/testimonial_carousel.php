<?php

$allowed_origins = [
    'http://localhost:5173',
    'https://rasalstudio.com',
    'https://www.rasalstudio.com',
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? null;

if ($origin !== null && in_array($origin, $allowed_origins, true)) {
    header("Access-Control-Allow-Origin: $origin");
} elseif ($origin === null) {

    // Allow same-origin and direct requests.

} else {
    header('HTTP/1.1 403 Forbidden');
    exit;
}

header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$config = parse_ini_file(__DIR__ . '/../.env', false, INI_SCANNER_RAW);
$apiKey = $config['GOOGLE_PLACES_API_KEY'] ?? '';

if ($config === false || trim($apiKey) === '') {
    error_log('Google Places API key not found in .env file');
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server configuration error']);
    exit;
}

$placeId   = 'ChIJD-O8y1AZdkgRRVQRC_KrZ9Y';
$fieldMask = implode(',', [
    'rating',
    'userRatingCount',
    'googleMapsUri',
    'reviews.authorAttribution',
    'reviews.rating',
    'reviews.text',
    'reviews.publishTime',
    'reviews.relativePublishTimeDescription',
    'reviews.googleMapsUri',
]);

$url  = 'https://places.googleapis.com/v1/places/' . rawurlencode($placeId);
$curl = curl_init($url);

curl_setopt_array($curl, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER     => [
        'X-Goog-Api-Key: ' . $apiKey,
        'X-Goog-FieldMask: ' . $fieldMask,
        'Accept: application/json',
    ],
    CURLOPT_CONNECTTIMEOUT => 10,
    CURLOPT_TIMEOUT        => 20,
]);

$responseBody = curl_exec($curl);
$curlError    = curl_error($curl);
$statusCode   = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
curl_close($curl);

if ($responseBody === false || $statusCode < 200 || $statusCode >= 300) {
    error_log('Google Places request failed: ' . ($curlError ?: 'HTTP ' . $statusCode));
    http_response_code(502);
    echo json_encode(['success' => false, 'message' => 'Unable to load reviews right now.']);
    exit;
}

$place = json_decode($responseBody, true);
if (! is_array($place)) {
    error_log('Google Places returned invalid JSON');
    http_response_code(502);
    echo json_encode(['success' => false, 'message' => 'Unable to load reviews right now.']);
    exit;
}

$reviews = array_map(static function ($review) {
    $author = $review['authorAttribution'] ?? [];

    return [
        'rating'         => $review['rating'] ?? 0,
        'text'           => $review['text']['text'] ?? '',
        'publishedAt'    => $review['relativePublishTimeDescription'] ?? '',
        'authorName'     => $author['displayName'] ?? 'Google reviewer',
        'authorUri'      => $author['uri'] ?? '',
        'authorPhotoUri' => $author['photoUri'] ?? '',
        'googleMapsUri'  => $review['googleMapsUri'] ?? '',
    ];
}, $place['reviews'] ?? []);

echo json_encode([
    'success'         => true,
    'rating'          => $place['rating'] ?? null,
    'userRatingCount' => $place['userRatingCount'] ?? null,
    'googleMapsUri'   => $place['googleMapsUri'] ?? '',
    'reviews'         => $reviews,
], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
