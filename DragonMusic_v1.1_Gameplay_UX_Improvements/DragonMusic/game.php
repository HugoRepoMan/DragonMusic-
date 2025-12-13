<?php
session_start();
// SEGURIDAD: Si no hay sesión, mandar al login
if (!isset($_SESSION['id_usuario'])) {
    header("Location: login.php");
    exit();
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dragon Music - Festival Edition</title>
    <link rel="stylesheet" href="css/style.css">
    <link rel="shortcut icon" href="media/face_hard.png" type="image/x-icon">
</head>
<body>

<video id="bg-video" autoplay muted loop style="position: fixed; right: 0; bottom: 0; min-width: 100%; min-height: 100%; z-index: -1;">
    <source src="" type="video/mp4">
</video>
    <audio id="bg-music"></audio>

    <div id="start-screen">
        <h1 style="color: #ff0055; margin-bottom: 5px;">DRAGON MUSIC</h1>
        <p style="margin-top:0; color:#aaa;">Festival Edition</p>

        <label>Selecciona Canción:</label>
        <select id="song-select">
            <option>Cargando canciones...</option>
        </select>
        
        <div class="doom-panel">
            <p style="margin: 0 0 5px 0; color: #aaa; font-size: 0.8em;">SELECCIONA DIFICULTAD:</p>
            <div class="doom-face-container">
                <img id="diff-img" src="media/face_medium.png" alt="Dificultad">
            </div>
            <div class="doom-controls">
                <button id="btn-prev" class="doom-btn">◀</button>
                <div style="flex-grow: 1;">
                    <h4 id="diff-title" style="margin: 0; color: yellow;">NORMAL</h4>
                    <p id="diff-desc" style="margin: 0; font-size: 0.7em; color: white;">Equilibrado</p>
                </div>
                <button id="btn-next" class="doom-btn">▶</button>
            </div>
        </div>

        <label>Jugador:</label>
        <input type="text" id="player-name" 
               value="<?php echo $_SESSION['nombre_usuario']; ?>" 
               readonly 
               style="background: #222; color: #888; cursor: not-allowed;">

        <button id="start-btn" class="btn-style">INICIAR CONCIERTO</button>
        <p style="font-size: 0.8em; color: #888;">Teclas: A - S - D - F</p>
        
        <a href="logout.php" style="color: #ff0055; text-decoration: none; font-size: 0.8em;">[ Cerrar Sesión ]</a>
    </div>

    <div id="game-interface">
        <div style="text-align: center; margin-top: 10px; z-index: 10;">
            <h2 style="margin: 5px;">Puntos: <span id="score">0</span> <span id="combo-text" style="color: gold; display:none; font-size: 0.7em;">★ X2 ★</span></h2>
            <div class="power-bar-container"><div class="power-bar" id="power-bar"></div></div>
        </div>

        <div id="game-container">
            <div id="feedback"></div>
            <div class="lane" id="lane-a"><div class="hit-zone"></div><div class="key-hint">A</div></div>
            <div class="lane" id="lane-s"><div class="hit-zone"></div><div class="key-hint">S</div></div>
            <div class="lane" id="lane-d"><div class="hit-zone"></div><div class="key-hint">D</div></div>
            <div class="lane" id="lane-f"><div class="hit-zone"></div><div class="key-hint">F</div></div>
        </div>

        <h3 style="text-align: center; color: white; margin-top: 15px; text-shadow: 0 0 10px #00d2ff; font-family: sans-serif; position: relative; z-index: 50;">
            Presiona <span style="color: yellow;">[ P ]</span> para Pausar
        </h3>
    </div>

    <div id="pause-menu">
        <div class="pause-content">
            <h1 style="color: #00d2ff; margin-top: 0;">PAUSA</h1>
            
            <div style="margin: 20px 0; text-align: left;">
                <label for="volume-slider" style="color: #aaa;">Volumen Maestro:</label><br>
                <input type="range" id="volume-slider" min="0" max="1" step="0.1" value="1" style="width: 100%; cursor: pointer; margin-top: 10px;">
            </div>

            <button id="btn-resume" class="btn-style" style="background: #00d2ff; color: #000;">REANUDAR</button>
            
            <button id="btn-restart-pause" class="btn-style" style="background: #00ff00; color: #000; margin-top: 10px;">↻ REINICIAR</button>
            
            <button id="btn-exit-pause" class="btn-style" style="background: red; margin-top: 10px;">SALIR</button>
        </div>
    </div>

    <div id="results-screen">
        <div class="results-content">
            <h1 style="color: gold; text-shadow: 0 0 10px gold;">¡CONCIERTO FINALIZADO!</h1>
            
            <div class="stats-box">
                <p>Puntaje Total: <span id="final-score" style="color: #00d2ff; font-size: 1.5em;">0</span></p>
                <div style="display: flex; justify-content: space-around;">
                    <p style="color: #00ff00;">Aciertos: <span id="final-hits">0</span></p>
                    <p style="color: #ff0000;">Errores: <span id="final-misses">0</span></p>
                </div>
                <p style="font-size: 0.9em; color: #aaa;">Rango: <span id="final-rank">Amateur</span></p>
            </div>

            <div class="leaderboard-box">
                <h3 style="margin-top:0; color:gold;">🏆 TABLA DE LEYENDAS (Top 5)</h3>
                <ul id="high-scores-list" style="list-style: none; padding: 0;">
                    <li>Cargando puntuaciones...</li>
                </ul>
            </div>

            <button id="btn-restart" class="btn-style" style="background: #00ff00; color: black; margin-bottom: 10px;">↻ VOLVER A JUGAR</button>
            <button id="btn-back-menu" class="btn-style">MENÚ PRINCIPAL</button>
        </div>
    </div>

    <script src="js/jquery.min.js"></script>
    <script src="js/game.js"></script>
</body>
</html>