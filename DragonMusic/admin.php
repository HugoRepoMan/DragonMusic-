<?php
session_start();
// SEGURIDAD: Si no es Admin (Rol 1), mandar al juego o al login
if (!isset($_SESSION['id_usuario']) || $_SESSION['rol'] != 1) {
    header("Location: game.php");
    exit();
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Panel Admin - Dragon Music</title>
    <link rel="stylesheet" href="css/style.css">
    <style>
        /* ESTILOS GENERALES */
        body { 
            background-color: #050505; 
            color: #ddd; 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            padding: 20px; 
            margin: 0;
            display: flex;
            justify-content: center;
        }

        .main-container {
            width: 100%;
            max-width: 1200px; 
            display: flex;
            flex-direction: column;
        }
        
        .admin-header {
            display: flex; 
            justify-content: space-between; 
            align-items: center;
            border-bottom: 2px solid #ff0055; 
            padding-bottom: 20px; 
            margin-bottom: 30px;
            flex-wrap: wrap; 
            gap: 15px;
        }

        /* KPI CARDS (BOTONES) */
        .kpi-container {
            display: flex; 
            gap: 20px; 
            margin-bottom: 30px;
            flex-wrap: wrap; 
        }
        .kpi-card {
            flex: 1; 
            min-width: 200px; 
            background: #111; 
            border: 1px solid #333; 
            padding: 20px;
            border-radius: 10px; 
            text-align: center;
            box-shadow: 0 0 10px rgba(0, 210, 255, 0.1);
            transition: all 0.3s ease;
            position: relative;
            cursor: pointer; /* Manito para indicar click */
            user-select: none; /* Evita que se seleccione el texto al hacer click rápido */
        }
        
        .kpi-card:hover { 
            transform: translateY(-5px); 
            border-color: #ff0055;
            box-shadow: 0 0 15px rgba(255, 0, 85, 0.3);
        }
        
        /* ESTADO ACTIVO (FILTRO APLICADO) */
        .kpi-card.active {
            border-color: #00d2ff;
            background: #0a0a0a;
            box-shadow: 0 0 20px rgba(0, 210, 255, 0.2);
        }
        
        .kpi-card h3 { margin: 0; color: #888; font-size: 0.9em; text-transform: uppercase; }
        .kpi-card .value { font-size: 2.5em; font-weight: bold; color: #00d2ff; margin-top: 10px; }
        
        /* Tooltip */
        .kpi-card:hover::after {
            content: "Clic para filtrar / Resetear";
            position: absolute;
            bottom: -25px;
            left: 50%;
            transform: translateX(-50%);
            background: #333;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.7em;
            white-space: nowrap;
            pointer-events: none;
        }

        /* AUDITORÍA */
        .audit-box {
            background: #111; 
            border: 1px solid #333; 
            border-radius: 10px; 
            padding: 20px;
            display: flex;
            flex-direction: column;
            height: 500px;
        }

        .table-responsive {
            flex: 1;
            overflow-y: auto;
            overflow-x: auto;
            border: 1px solid #222;
            margin-top: 10px;
        }

        table { width: 100%; border-collapse: collapse; min-width: 800px; }
        th, td { text-align: left; padding: 12px; border-bottom: 1px solid #222; }
        
        th { 
            color: #ff0055; 
            text-transform: uppercase; 
            font-size: 0.8em; 
            position: sticky; 
            top: 0; 
            background: #151515; 
            z-index: 10;
            box-shadow: 0 2px 5px rgba(0,0,0,0.5);
        }
        
        tr:hover { background: #1a1a1a; }
        
        .badge { padding: 3px 8px; border-radius: 4px; font-size: 0.8em; font-weight: bold; }
        .act-login { background: #004400; color: #0f0; }
        .act-fail { background: #440000; color: #f00; }
        .act-game { background: #002244; color: #0ff; }
        .act-reg { background: #440044; color: #f0f; }

        .btn-logout {
            background: transparent; border: 1px solid red; color: red; padding: 8px 15px; cursor: pointer; border-radius: 5px; transition: 0.3s;
        }
        .btn-logout:hover { background: red; color: white; }
        
        .btn-game {
            background: #00d2ff; border: none; color: black; padding: 8px 15px; cursor: pointer; font-weight: bold; margin-right: 10px; border-radius: 5px; transition: 0.3s;
        }
        .btn-game:hover { background: white; box-shadow: 0 0 10px white; }

        ::-webkit-scrollbar { width: 10px; height: 10px; }
        ::-webkit-scrollbar-track { background: #111; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 5px; }
        ::-webkit-scrollbar-thumb:hover { background: #555; }
    </style>
</head>
<body>

    <div class="main-container">

        <div class="admin-header">
            <div>
                <h1 style="margin:0; color: #ff0055;">CENTRO DE COMANDO</h1>
                <small>Bienvenido, Administrador <?php echo $_SESSION['nombre_usuario']; ?></small>
            </div>
            <div>
                <button onclick="window.location.href='game.php'" class="btn-game">IR AL JUEGO</button>
                <button onclick="window.location.href='logout.php'" class="btn-logout">CERRAR SESIÓN</button>
            </div>
        </div>

        <div class="kpi-container">
            <div class="kpi-card" id="btn-users" data-filtro="REGISTER_NEW">
                <h3>Usuarios Registrados</h3>
                <div class="value" id="stat-users">...</div>
            </div>
            
            <div class="kpi-card" id="btn-games" data-filtro="GAME_SAVED">
                <h3>Partidas Jugadas</h3>
                <div class="value" id="stat-games">...</div>
            </div>
            
            <div class="kpi-card" id="btn-song" data-filtro="">
                <h3>Canción Top (Ver Todo)</h3>
                <div class="value" id="stat-song" style="font-size: 1.2em; margin-top: 20px;">...</div>
            </div>
        </div>

        <div class="audit-box">
            <h2 style="color: white; margin-top: 0;">📡 LOGS DE AUDITORÍA (Últimos 100 eventos)</h2>
            <p id="filtro-info" style="color: #666; font-size: 0.8em;">Mostrando todos los registros.</p>
            
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Fecha/Hora</th>
                            <th>Usuario</th>
                            <th>Acción</th>
                            <th>Detalle</th>
                        </tr>
                    </thead>
                    <tbody id="audit-table-body">
                        <tr><td colspan="5" style="text-align:center; padding: 20px;">Cargando datos...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>

    </div>

    <script src="js/jquery.min.js"></script>
    <script>
    // Variable global para recordar qué filtro está activo
    let filtroActivo = ''; 

    function cargarAuditoria(filtro = '') {
        // Feedback visual de carga
        $('#audit-table-body').css('opacity', '0.5');
        
        let url = 'api_admin.php?accion=auditoria';
        if (filtro) {
            url += '&filtro=' + filtro;
            $('#filtro-info').text('Filtro activo: ' + filtro).css('color', '#00d2ff');
        } else {
            $('#filtro-info').text('Mostrando todos los registros.').css('color', '#666');
        }

        $.getJSON(url, function(data) {
            let html = '';
            if (data.length === 0) {
                html = '<tr><td colspan="5" style="text-align:center; padding: 20px; color: #888;">No hay registros con este filtro.</td></tr>';
            } else {
                data.forEach(log => {
                    let badgeClass = '';
                    if(log.accion.includes('FAIL') || log.accion.includes('ERROR')) badgeClass = 'act-fail';
                    else if(log.accion.includes('LOGIN') || log.accion.includes('REGISTER')) badgeClass = 'act-login';
                    else if(log.accion.includes('GAME')) badgeClass = 'act-game';
                    else badgeClass = 'act-reg';

                    html += `
                        <tr>
                            <td style="color:#555;">#${log.id_log}</td>
                            <td style="color:#aaa;">${log.fecha_hora}</td>
                            <td style="font-weight:bold;">${log.usuario_responsable}</td>
                            <td><span class="badge ${badgeClass}">${log.accion}</span></td>
                            <td style="color:#ccc;">${log.detalle}</td>
                        </tr>
                    `;
                });
            }
            $('#audit-table-body').html(html).css('opacity', '1');
        });
    }

    $(document).ready(function() {
        // 1. Cargar Estadísticas
        $.getJSON('api_admin.php?accion=stats', function(data) {
            $('#stat-users').text(data.usuarios);
            $('#stat-games').text(data.partidas);
            $('#stat-song').text(data.top_cancion);
        });

        // 2. Cargar tabla inicial (Todo)
        cargarAuditoria();

        // 3. Lógica CLICK INTELIGENTE (Toggle)
        $('.kpi-card').click(function() {
            let filtroClickeado = $(this).data('filtro');

            // Quitar clase 'active' de todas las tarjetas
            $('.kpi-card').removeClass('active');

            // CASO A: Si hago clic en el mismo filtro que ya tengo activo
            if (filtroClickeado === filtroActivo) {
                // RESETEAR (Mostrar todo)
                filtroActivo = ''; 
                cargarAuditoria(''); // Carga sin filtro
                // No le ponemos clase active a nada
            } 
            // CASO B: Si hago clic en un filtro nuevo
            else {
                filtroActivo = filtroClickeado;
                
                // Si el filtro no es vacío (es decir, no es el botón de "Canción Top" actuando como reset)
                if (filtroActivo !== '') {
                    $(this).addClass('active'); // Iluminar tarjeta
                }
                
                cargarAuditoria(filtroActivo);
            }
        });
    });
    </script>
</body>
</html>