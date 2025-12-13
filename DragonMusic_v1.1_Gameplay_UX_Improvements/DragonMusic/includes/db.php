<?php
// Configuración de Conexión Segura
// Usamos el usuario limitado 'app_dragon' en lugar de 'root'
// Esto cumple con el requerimiento de SEGURIDAD y ROLES de base de datos.

$host = "localhost";
$user = "app_dragon";  // Usuario creado en el script SQL
$pass = "musica123";   // Contraseña definida en el script SQL
$db   = "DragonMusicDB";

// Crear conexión
$conn = new mysqli($host, $user, $pass, $db);

// Verificar conexión
if ($conn->connect_error) {
    // En producción no se debe mostrar el error real al usuario, pero para desarrollo está bien
    die("Error de conexión a la Base de Datos: " . $conn->connect_error);
}

// Establecer codificación a UTF-8 (para tildes y ñ)
$conn->set_charset("utf8");
?>