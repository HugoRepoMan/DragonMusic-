<?php
session_start();
include 'includes/db.php'; // Asegúrate de que esta ruta sea correcta

// Si ya está logueado, mandar directo al juego
if (isset($_SESSION['id_usuario'])) {
    header("Location: game.php");
    exit();
}

$mensaje = "";

// LÓGICA DE REGISTRO Y LOGIN
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $nombre = $conn->real_escape_string($_POST['usuario']); // Sanitizar entrada
    $pass = $_POST['password']; // En prod usar password_hash()
    
    if (isset($_POST['btn_registro'])) {
        // --- REGISTRO ---
        // Rol 2 = Jugador (según nuestro script SQL)
        $sql = "INSERT INTO Usuarios (nombre_usuario, password_hash, id_rol) VALUES ('$nombre', '$pass', 2)";
        
        if ($conn->query($sql) === TRUE) {
            $mensaje = "<span style='color:#00ff00'>¡Registrado con éxito! Ahora inicia sesión.</span>";
        } else {
            // Error común: Nombre de usuario duplicado
            $mensaje = "Error: El nombre de usuario ya existe.";
        }

} elseif (isset($_POST['btn_login'])) {
        // --- LOGIN ---
        $sql = "CALL sp_login_usuario('$nombre')";
        $result = $conn->query($sql);

        // CORRECCIÓN: Verificamos si $result es un objeto válido antes de usarlo
        if ($result) {
            
            // Ahora es seguro preguntar por num_rows
            if ($result->num_rows > 0) {
                $row = $result->fetch_assoc();
                
                // Verificar contraseña
                if ($pass === $row['password_hash']) {
                    $_SESSION['id_usuario'] = $row['id_usuario'];
                    $_SESSION['nombre_usuario'] = $row['nombre_usuario'];
                    $_SESSION['id_rol'] = $row['id_rol'];
                    
                    header("Location: game.php");
                    exit();
                } else {
                    $mensaje = "Contraseña incorrecta.";
                }
            } else {
                $mensaje = "El usuario no existe.";
            }
            
            // CORRECCIÓN: Solo ejecutamos free() si $result es un objeto
            $result->free();
            $conn->next_result(); // Limpiar para la siguiente consulta

        } else {
            // Si $result es false (el error original), mostramos qué pasó en MySQL en lugar de romper PHP
            $mensaje = "Error de Base de Datos: " . $conn->error;
        }
    }
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Acceso - Dragon Music</title>
    <link rel="stylesheet" href="css/style.css"> 
    <style>
        /* Estilos específicos para el Login (sobreescriben o complementan style.css) */
        body { 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            height: 100vh; 
            background: #000; /* Fondo negro por si el video falla */
        }
        .login-card {
            background: rgba(20, 20, 20, 0.95);
            padding: 40px;
            border-radius: 15px;
            border: 2px solid #ff0055;
            text-align: center;
            width: 350px;
            box-shadow: 0 0 30px rgba(255, 0, 85, 0.3);
            z-index: 10;
        }
        .login-card h1 { color: #ff0055; margin-bottom: 20px; font-size: 2em; }
        .msg-box { margin-bottom: 15px; color: #ff4444; font-weight: bold; min-height: 20px; }
        
        input[type="text"], input[type="password"] {
            width: 100%; padding: 12px; margin: 10px 0;
            background: #333; border: 1px solid #555; color: white;
            border-radius: 5px; box-sizing: border-box;
        }
        
        .btn-action {
            width: 100%; padding: 12px; margin-top: 10px;
            border: none; border-radius: 50px; font-weight: bold; cursor: pointer;
            transition: transform 0.1s;
        }
        .btn-action:active { transform: scale(0.95); }
        
        .btn-entrar { background: #00d2ff; color: #000; }
        .btn-entrar:hover { background: #00b0d4; }
        
        .btn-registro { background: transparent; border: 1px solid #ff0055; color: #ff0055; margin-top: 20px;}
        .btn-registro:hover { background: #ff0055; color: white; }
    </style>
</head>
<body>

    <video id="bg-video" autoplay muted loop style="position:fixed; top:0; left:0; min-width:100%; min-height:100%; z-index:-1; opacity:0.3; object-fit:cover;">
        <source src="https://drive.google.com/uc?export=download&id=1339697923" type="video/mp4">
    </video>

    <div class="login-card">
        <h1>DRAGON MUSIC</h1>
        <div class="msg-box"><?php echo $mensaje; ?></div>
        
        <form method="POST">
            <input type="text" name="usuario" placeholder="Nombre de Usuario" required autocomplete="off">
            <input type="password" name="password" placeholder="Contraseña" required>
            
            <button type="submit" name="btn_login" class="btn-action btn-entrar">INICIAR SESIÓN</button>
            
            <p style="margin: 15px 0; color: #666;">— O —</p>
            
            <button type="submit" name="btn_registro" class="btn-action btn-registro">CREAR CUENTA NUEVA</button>
        </form>
    </div>

</body>
</html>