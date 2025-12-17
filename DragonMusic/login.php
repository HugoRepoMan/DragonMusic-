<?php
session_start();
require_once 'includes/db.php';

$mensaje = "";
$tipo_mensaje = "";

/* ==============================
   LÓGICA PHP (INTACTA)
============================== */
if ($_SERVER["REQUEST_METHOD"] === "POST") {

    /* ---------- REGISTRO ---------- */
    if (isset($_POST['accion']) && $_POST['accion'] === 'registrar') {
        $user = trim($_POST['usuario_reg']);
        $pass = $_POST['password_reg'];
        $pass_hash = password_hash($pass, PASSWORD_BCRYPT);

        // Ajusta el nombre del SP si es diferente
        $stmt = $conn->prepare("CALL sp_registrar_usuario(?, ?)");
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

    /* ---------- LOGIN ---------- */
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
    
    <script src="js/jquery.min.js"></script>

    <style>
        /* ESTILOS PERSONALIZADOS SOBRE BOOTSTRAP */
        body {
            background-color: #000;
            background-image: radial-gradient(circle at center, #222 0%, #000 100%);
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
        }

        /* La tarjeta central */
        .card-custom {
            background: rgba(15, 15, 15, 0.95);
            border: 2px solid #ff0055;
            box-shadow: 0 0 30px rgba(255, 0, 85, 0.3);
            width: 100%;
            max-width: 400px; /* Esto evita que se estire como en tu foto */
            border-radius: 15px;
        }

        .card-header {
            background: transparent;
            border-bottom: 1px solid #333;
            padding: 20px;
        }

        .game-title {
            color: #ff0055;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 2px;
            font-size: 1.8rem;
            text-shadow: 0 0 10px rgba(255, 0, 85, 0.5);
            margin: 0;
        }

        /* Inputs de Bootstrap modificados a oscuro */
        .form-control {
            background-color: #222;
            border: 1px solid #444;
            color: #fff;
            height: 45px;
        }

        .form-control:focus {
            background-color: #000;
            color: #fff;
            border-color: #00d2ff; /* Cian al hacer click */
            box-shadow: 0 0 10px rgba(0, 210, 255, 0.3);
        }
        
        /* Etiquetas */
        .form-label {
            color: #00d2ff;
            font-size: 0.85rem;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        /* Botón Principal */
        .btn-dragon {
            background: linear-gradient(90deg, #ff0055, #ff3366);
            border: none;
            color: white;
            font-weight: bold;
            padding: 12px;
            text-transform: uppercase;
            width: 100%;
            border-radius: 30px;
            transition: transform 0.2s;
        }

        .btn-dragon:hover {
            transform: scale(1.02);
            box-shadow: 0 0 15px rgba(255, 0, 85, 0.6);
            color: white;
        }

        /* Botón Secundario */
        .btn-outline-secondary {
            border-color: #444;
            color: #aaa;
            border-radius: 30px;
            width: 100%;
        }
        
        .btn-outline-secondary:hover {
            background: #222;
            color: white;
            border-color: white;
        }
    </style>
</head>
<body>

    <div class="card card-custom">
        <div class="card-header text-center">
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
                        <label for="usuario" class="form-label">Usuario</label>
                        <input type="text" class="form-control" id="usuario" name="usuario" placeholder="Ingresa tu usuario" required>
                    </div>
                    
                    <div class="mb-4">
                        <label for="password" class="form-label">Contraseña</label>
                        <input type="password" class="form-control" id="password" name="password" placeholder="••••••••" required>
                    </div>
                    
                    <button type="submit" class="btn btn-dragon mb-3">Iniciar Sesión</button>
                </form>
                
                <div class="text-center">
                    <span class="text-secondary small">¿No tienes cuenta?</span>
                    <button type="button" id="btn-ir-registro" class="btn btn-outline-secondary btn-sm mt-2">Crear Cuenta Nueva</button>
                </div>
            </div>

            <div id="form-registro" style="display:none;">
                <h4 class="text-white text-center mb-3">Nuevo Jugador</h4>
                <form method="POST">
                    <input type="hidden" name="accion" value="registrar">
                    
                    <div class="mb-3">
                        <label for="usuario_reg" class="form-label">Elige un Usuario</label>
                        <input type="text" class="form-control" id="usuario_reg" name="usuario_reg" required>
                    </div>
                    
                    <div class="mb-4">
                        <label for="password_reg" class="form-label">Crea una Contraseña</label>
                        <input type="password" class="form-control" id="password_reg" name="password_reg" required>
                    </div>
                    
                    <button type="submit" class="btn btn-dragon mb-3">Registrarse</button>
                </form>
                
                <div class="text-center">
                    <button type="button" id="btn-volver-login" class="btn btn-outline-secondary btn-sm">Volver al Login</button>
                </div>
            </div>

        </div>
    </div>

    <script>
        $(document).ready(function() {
            $("#btn-ir-registro").click(function() {
                $("#form-login").fadeOut(200, function() {
                    $("#form-registro").fadeIn(200);
                });
            });

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