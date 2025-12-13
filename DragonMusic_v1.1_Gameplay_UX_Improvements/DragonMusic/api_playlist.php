<?php
include 'includes/db.php';
header('Content-Type: application/json');

$sql = "SELECT * FROM Canciones";
$result = $conn->query($sql);

$playlist = [];
while($row = $result->fetch_assoc()) {
    $playlist[$row['clave_interna']] = [
        "nombre" => $row['nombre_mostrar'],
        "info" => $row['info_dificultad'],
        "audio" => $row['ruta_audio'],
        "video" => $row['ruta_video'], 
        "velocidad" => intval($row['velocidad']),
        "frecuencia" => intval($row['frecuencia'])
    ];
}
echo json_encode($playlist);
?>