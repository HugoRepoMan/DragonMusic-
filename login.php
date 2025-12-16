<?php
session_start();
require_once 'includes/db.php'; 

$mensaje = "";
$tipo_mensaje = "";

// LÓGICA DE LOGIN Y REGISTRO
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    
    // --- CASO 1: REGISTRO ---
    if (isset($_POST['accion']) && $_POST['accion'] == 'registrar') {
        $user = trim($_POST['usuario_reg']);
        $pass = $_POST['password_reg'];
        $pass_hash = password_hash($pass, PASSWORD_BCRYPT);

        $stmt = $conn->prepare("CALL sp_registrar_usuario(?, ?)");
        $stmt->bind_param("ss", $user, $pass_hash);
        $stmt->execute();
        $result = $stmt->get_result();
        $fila = $result->fetch_assoc();

        if ($fila['estado'] == 'OK') {
            $mensaje = $fila['mensaje'];
            $tipo_mensaje = "success";
        } else {
            $mensaje = $fila['mensaje'];
            $tipo_mensaje = "error";
        }
        $stmt->close();
    }
    
    // --- CASO 2: LOGIN (CORREGIDO) ---
    else if (isset($_POST['accion']) && $_POST['accion'] == 'login') {
        $user = trim($_POST['usuario']);
        $pass = $_POST['password'];

        $stmt = $conn->prepare("CALL sp_login_usuario(?)");
        $stmt->bind_param("s", $user);
        $stmt->execute();
        $result = $stmt->get_result();

        // 1. OBTENEMOS LOS DATOS
        $row = $result->fetch_assoc();

        // 2. ¡IMPORTANTE! CERRAMOS EL SP AQUÍ MISMO
        // Esto libera la variable $conn para poder usarla en las auditorías de abajo.
        $stmt->close(); 

        if ($row) {
            // VERIFICAR CONTRASEÑA
            if (password_verify($pass, $row['password_hash'])) {
                
                // 3. AUDITAR ÉXITO (Ahora $conn ya está libre y funcionará)
                // Escapamos $user por seguridad extra aunque ya venga limpio
                $user_safe = $conn->real_escape_string($user);
                $conn->query("INSERT INTO Auditoria (usuario_responsable, accion, detalle) VALUES ('$user_safe', 'LOGIN', 'Ingreso exitoso al sistema')");

                $_SESSION['id_usuario'] = $row['id_usuario'];
                $_SESSION['nombre_usuario'] = $row['nombre_usuario'];
                $_SESSION['rol'] = $row['id_rol'];
                
                if ($row['id_rol'] == 1) {
                    header("Location: admin.php");
                } else {
                    header("Location: game.php");
                }
                exit();

            } else {
                // 4. AUDITAR FALLO DE CONTRASEÑA
                $user_safe = $conn->real_escape_string($user);
                $conn->query("INSERT INTO Auditoria (usuario_responsable, accion, detalle) VALUES ('$user_safe', 'LOGIN_FAIL_PASS', 'Usuario encontrado pero contraseña incorrecta')");

                $mensaje = "Contraseña incorrecta.";
                $tipo_mensaje = "error";
            }
        } else {
            // El SP ya auditó internamente que el usuario no existe
            $mensaje = "El usuario no existe.";
            $tipo_mensaje = "error";
        }
        // Ya no hace falta cerrar $stmt aquí porque lo cerramos arriba.
    }
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Login - Dragon Music</title>
    <link rel="stylesheet" href="css/style.css">
    <script src="js/jquery.min.js"></script>
    <style>
        body {
            display: flex; justify-content: center; align-items: center;
            height: 100vh; background: black; color: white;
            font-family: Arial, sans-serif;
        }
        .login-card {
            border: 2px solid #ff0055;
            padding: 40px; border-radius: 20px;
            box-shadow: 0 0 30px rgba(255, 0, 85, 0.3);
            text-align: center; width: 350px;
            background: #111;
        }
        input {
            width: 100%; padding: 10px; margin: 10px 0;
            background: #222; border: 1px solid #444; color: white;
            border-radius: 5px;
        }
        .btn-action {
            width: 100%; padding: 12px; margin-top: 10px;
            background: #00d2ff; border: none; font-weight: bold;
            cursor: pointer; border-radius: 30px;
        }
        .btn-secondary {
            background: transparent; border: 1px solid #ff0055; color: #ff0055;
        }
        .btn-secondary:hover { background: #ff0055; color: white; }
        
        .alert { padding: 10px; margin-bottom: 10px; border-radius: 5px; font-size: 0.9em; }
        .success { background: #28a745; color: white; }
        .error { background: #dc3545; color: white; }
    </style>
</head>
<body>

    <div class="login-card">
        <h1 style="color: #ff0055; margin-bottom: 20px;">DRAGON MUSIC</h1>

        <?php if($mensaje): ?>
            <div class="alert <?php echo $tipo_mensaje; ?>"><?php echo $mensaje; ?></div>
        <?php endif; ?>

        <div id="form-login">
            <form method="POST" action="">
                <input type="hidden" name="accion" value="login">
                <input type="text" name="usuario" placeholder="Nombre de Usuario" required>
                <input type="password" name="password" placeholder="Contraseña" required>
                
                <button type="submit" class="btn-action">INICIAR SESIÓN</button>
            </form>
            
            <p style="margin: 20px 0; font-size: 0.8em; color: #888;">— O —</p>
            
            <button type="button" class="btn-action btn-secondary" id="btn-ir-registro">
                CREAR CUENTA NUEVA
            </button>
        </div>

        <div id="form-registro" style="display: none;">
            <h3 style="color: #00d2ff;">Crear Cuenta</h3>
            <form method="POST" action="">
                <input type="hidden" name="accion" value="registrar">
                <input type="text" name="usuario_reg" placeholder="Nuevo Usuario" required>
                <input type="password" name="password_reg" placeholder="Crea una Contraseña" required>
                
                <button type="submit" class="btn-action" style="background: #00ff00; color: black;">
                    REGISTRARSE
                </button>
            </form>
            
            <button type="button" class="btn-action btn-secondary" id="btn-volver-login" style="margin-top: 10px; border-color: #888; color: #888;">
                Volver al Login
            </button>
        </div>
    </div>

    <script>
        $(document).ready(function() {
            $("#btn-ir-registro").click(function() {
                $("#form-login").fadeOut(200, function() { $("#form-registro").fadeIn(200); });
            });
            $("#btn-volver-login").click(function() {
                $("#form-registro").fadeOut(200, function() { $("#form-login").fadeIn(200); });
            });
        });
    </script>
</body>
</html>