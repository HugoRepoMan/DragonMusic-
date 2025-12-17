<?php
// 1. Iniciar sesión para poder destruirla
session_start();

// 2. Borrar todas las variables de sesión (nombre, id, rol, etc.)
$_SESSION = array();

// 3. Borrar la cookie de sesión si existe (Limpieza profunda)
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}

// 4. Destruir la sesión completamente
session_destroy();

// 5. Redirigir al Login
header("Location: login.php");
exit();
?>