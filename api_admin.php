<?php
session_start();
require_once 'includes/db.php';
header('Content-Type: application/json');

// SEGURIDAD: Solo Rol 1 (Admin) puede usar esto
if (!isset($_SESSION['id_usuario']) || $_SESSION['rol'] != 1) {
    echo json_encode(["error" => "Acceso denegado"]);
    exit();
}

$accion = $_GET['accion'] ?? '';

if ($accion == 'stats') {
    // 1. OBTENER ESTADÍSTICAS GENERALES (Sin cambios)
    $stats = [];
    
    // Total Usuarios
    $res = $conn->query("SELECT COUNT(*) as c FROM Usuarios");
    $stats['usuarios'] = $res->fetch_assoc()['c'];

    // Total Partidas
    $res = $conn->query("SELECT COUNT(*) as c FROM Puntuaciones");
    $stats['partidas'] = $res->fetch_assoc()['c'];

    // Canción más jugada
    $sql = "SELECT c.nombre_mostrar, COUNT(p.id_cancion) as veces 
            FROM Puntuaciones p 
            JOIN Canciones c ON p.id_cancion = c.id_cancion 
            GROUP BY p.id_cancion ORDER BY veces DESC LIMIT 1";
    $res = $conn->query($sql);
    $row = $res->fetch_assoc();
    $stats['top_cancion'] = $row ? $row['nombre_mostrar'] : 'N/A';

    echo json_encode($stats);

} elseif ($accion == 'auditoria') {
    // 2. OBTENER LOGS DE AUDITORÍA (CON FILTRADO)
    $filtro = $_GET['filtro'] ?? '';
    
    $sql = "SELECT id_log, usuario_responsable, accion, detalle, fecha_hora 
            FROM Auditoria";

    if ($filtro === 'REGISTER_NEW' || $filtro === 'GAME_SAVED') {
        // Si hay un filtro válido, añadimos WHERE y usamos sentencia preparada
        $sql .= " WHERE accion = ? ORDER BY fecha_hora DESC LIMIT 100";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $filtro);
        $stmt->execute();
        $result = $stmt->get_result();
    } else {
        // Si no hay filtro, traemos todo como antes
        $sql .= " ORDER BY fecha_hora DESC LIMIT 100";
        $result = $conn->query($sql);
    }
    
    $logs = [];
    while($row = $result->fetch_assoc()) {
        $logs[] = $row;
    }
    
    echo json_encode($logs);
    
    // Cerramos el statement si se usó
    if (isset($stmt)) {
        $stmt->close();
    }
}
?>