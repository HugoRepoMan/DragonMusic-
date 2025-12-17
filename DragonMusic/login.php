<?php
session_start();
require_once 'includes/db.php';

$mensaje = "";
$tipo_mensaje = "";

/* ==============================
   LÓGICA PHP (LOGIN / REGISTRO)
============================== */
if ($_SERVER["REQUEST_METHOD"] === "POST") {

    /* --- REGISTRO --- */
    if (isset($_POST['accion']) && $_POST['accion'] === 'registrar') {
        $user = trim($_POST['usuario_reg']);
        $pass = $_POST['password_reg'];
        $pass_hash = password_hash($pass, PASSWORD_BCRYPT);

        $stmt = $conn->prepare("CALL sp_registrar_usuario(?, ?)"); // Ajusta si tu SP es diferente
        $stmt->bind_param("ss", $user, $pass_hash);
        $stmt->execute();
        $result = $stmt->get_result();
        $fila = $result->fetch_assoc();
        $stmt->close();

        if ($fila && $fila['estado'] === 'OK') {
            $mensaje = $fila['mensaje'];
            $tipo_mensaje = "success";
        } else {
            $mensaje = $fila['mensaje'] ?? "Error al registrar.";
            $tipo_mensaje = "danger";
        }
    }

    /* --- LOGIN --- */
    if (isset($_POST['accion']) && $_POST['accion'] === 'login') {
        $user = trim($_POST['usuario']);
        $pass = $_POST['password'];

        $stmt = $conn->prepare("CALL sp_login_usuario(?)");
        $stmt->bind_param("s", $user);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        $stmt->close();

        if ($row && password_verify($pass, $row['password_hash'])) {
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
            $mensaje = "Usuario o contraseña incorrectos.";
            $tipo_mensaje = "danger";
        }
    }
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - Dragon Music</title>
    
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    
    <link rel="stylesheet" href="css/style.css">
    
    <script src="js/jquery.min.js"></script>
</head>

<body class="login-bg">

    <div class="card card-custom">
        <div class="card-header-custom">
            <h1 class="game-title">Dragon Music</h1>
        </div>
        
        <div class="card-body p-4">
            
            <?php if ($mensaje): ?>
                <div class="alert alert-<?= $tipo_mensaje; ?> text-center" role="alert">
                    <?= htmlspecialchars($mensaje); ?>
                </div>
            <?php endif; ?>

            <div id="form-login">
                <form method="POST">
                    <input type="hidden" name="accion" value="login">
                    
                    <div class="mb-3">
                        <label for="usuario" class="form-label-custom">Usuario</label>
                        <input type="text" class="form-control form-control-dark" id="usuario" name="usuario" placeholder="Ingresa tu usuario" required>
                    </div>
                    
                    <div class="mb-4">
                        <label for="password" class="form-label-custom">Contraseña</label>
                        <input type="password" class="form-control form-control-dark" id="password" name="password" placeholder="••••••••" required>
                    </div>
                    
                    <button type="submit" class="btn btn-dragon mb-3">Iniciar Sesión</button>
                </form>
                
                <div class="text-center">
                    <span class="text-secondary small">¿No tienes cuenta?</span>
                    <button type="button" id="btn-ir-registro" class="btn btn-secondary-outline mt-2">Crear Cuenta Nueva</button>
                </div>
            </div>

            <div id="form-registro" style="display:none;">
                <h4 class="text-white text-center mb-3">Nuevo Jugador</h4>
                <form method="POST">
                    <input type="hidden" name="accion" value="registrar">
                    
                    <div class="mb-3">
                        <label for="usuario_reg" class="form-label-custom">Elige un Usuario</label>
                        <input type="text" class="form-control form-control-dark" id="usuario_reg" name="usuario_reg" required>
                    </div>
                    
                    <div class="mb-4">
                        <label for="password_reg" class="form-label-custom">Crea una Contraseña</label>
                        <input type="password" class="form-control form-control-dark" id="password_reg" name="password_reg" required>
                    </div>
                    
                    <button type="submit" class="btn btn-dragon mb-3">Registrarse</button>
                </form>
                
                <div class="text-center">
                    <button type="button" id="btn-volver-login" class="btn btn-secondary-outline">Volver al Login</button>
                </div>
            </div>

        </div>
    </div>

    <script>
        $(document).ready(function() {
            // Ir al registro
            $("#btn-ir-registro").click(function() {
                $("#form-login").fadeOut(200, function() {
                    $("#form-registro").fadeIn(200);
                });
            });

            // Volver al login
            $("#btn-volver-login").click(function() {
                $("#form-registro").fadeOut(200, function() {
                    $("#form-login").fadeIn(200);
                });
            });
        });
    </script>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>