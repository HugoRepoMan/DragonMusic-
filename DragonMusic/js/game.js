$(document).ready(function() {
    // --- 1. VARIABLES GLOBALES ---
    let puntaje = 0;
    let multiplicador = 1;
    let juegoActivo = false;
    let intervaloGenerador;
    let contadorAciertos = 0;
    let contadorErrores = 0;
    
    // Variables de Control
    let ultimoTiempoPausa = 0;
    let juegoPausado = false;
    let playlist = {}; 
    
    // Configuración de Teclas y Mapeo
    let configTeclas = { lane1: 'a', lane2: 's', lane3: 'd', lane4: 'f' };
    const mapaCarriles = { 'lane1': 'lane-a', 'lane2': 'lane-s', 'lane3': 'lane-d', 'lane4': 'lane-f' };
    // Definimos esto arriba para evitar errores de lectura
    const teclasMap = { 'a': 'lane-a', 's': 'lane-s', 'd': 'lane-d', 'f': 'lane-f' };

    // Dificultad
    let indiceDificultad = 0; 
    let dificultadActual = "facil"; 
    const dificultades = [
        { id: "facil", titulo: "¿PUEDO JUGAR, PAPI?", desc: "1 nota a la vez", img: "media/face_easy.png" },
        { id: "medio", titulo: "HURT ME PLENTY", desc: "Acordes ocasionales", img: "media/face_medium.png" },
        { id: "dificil", titulo: "ULTRA VIOLENCE", desc: "Rápido", img: "media/face_hard.png" },
        { id: "experto", titulo: "¡NIGHTMARE!", desc: "Caos total", img: "media/face_expert.png" }
    ];

    // --- 2. CARGA DE DATOS (API) ---
    console.log("Iniciando carga de playlist...");
    $.getJSON("api_playlist.php", function(data) {
        playlist = data;
        console.log("Playlist cargada:", playlist);
        generarSelectCanciones();
        actualizarPanelDoom();
    }).fail(function() {
        console.error("ERROR CRÍTICO: No se pudo cargar api_playlist.php");
        alert("Error: No se pudo conectar con la base de datos.");
    });

    // --- 3. FUNCIONES DEL SISTEMA ---
    
    function alternarPausa() {
        if (!juegoActivo) return; 
        juegoPausado = !juegoPausado; 
        let audio = document.getElementById("bg-music");
        let video = document.getElementById("bg-video");
        
        if (juegoPausado) {
            clearInterval(intervaloGenerador); 
            audio.pause();
            video.pause();
            $(".note").stop(true); 
            $("#pause-menu").fadeIn(200); 
        } else {
            audio.play();
            video.play();
            $("#pause-menu").fadeOut(200); 
            
            // Reanudar generación
            $(".note").remove(); 
            let estilo = $("#song-select").val();
            if(playlist[estilo]) iniciarNotas(playlist[estilo].velocidad, playlist[estilo].frecuencia);
        }
    }

function salirAlMenu() {
        juegoActivo = false;
        juegoPausado = false;
        clearInterval(intervaloGenerador); // 1. Detener generación
        
        // 2. DETENER ANIMACIONES Y BORRAR (El truco anti-zombies)
        $(".note").stop(true).remove(); 
        
        let audio = document.getElementById("bg-music");
        let video = document.getElementById("bg-video");
        audio.pause();
        audio.currentTime = 0;
        video.pause();
        
        $("#feedback").text("");
        $("#power-bar").css("width", "0%");
        if(typeof desactivarPoder === "function") desactivarPoder();
        
        $("#pause-menu").fadeOut(); 
        $("#results-screen").fadeOut();
        $("#game-interface").fadeOut(() => $("#start-screen").fadeIn());
    }

    // Botón Reiniciar (Dentro de Resultados o Pausa)
    $("#btn-restart").click(function() {
        $("#results-screen").fadeOut();
        $("#game-interface").fadeIn();
        
        // Reiniciar variables
        puntaje = 0; 
        contadorAciertos = 0; 
        contadorErrores = 0;
        $("#score").text("0"); 
        $("#feedback").text("");
        
        // LIMPIEZA PROFUNDA
        clearInterval(intervaloGenerador);
        $(".note").stop(true).remove(); // <--- IMPORTANTE: stop(true)
        
        let track = playlist[$("#song-select").val()];
        let audio = document.getElementById("bg-music");
        let video = document.getElementById("bg-video");
        
        audio.currentTime = 0; 
        video.currentTime = 0; 
        // video.load(); // A veces load() causa parpadeo, mejor solo play
        
        // Promesa segura de play
        video.play().catch(e=>console.log(e));
        audio.play().catch(e=>console.log(e));
        
        juegoActivo = true; 
        juegoPausado = false;
        iniciarNotas(track.velocidad, track.frecuencia);
    });

    function finalizarJuego() {
        juegoActivo = false;
        clearInterval(intervaloGenerador);
        $(".note").remove(); 
        $("#bg-music")[0].pause();
        $("#bg-video")[0].pause();

        // Mostrar Stats
        $("#final-score").text(puntaje);
        $("#final-hits").text(contadorAciertos);
        $("#final-misses").text(contadorErrores);
        
        let rango = "Novato";
        if (puntaje > 5000) rango = "Promesa";
        if (puntaje > 15000) rango = "Leyenda";
        if (puntaje > 30000) rango = "DIOS";
        $("#final-rank").text(rango);

        // Guardar BD
        let estiloCancion = $("#song-select").val();
        $.post("api_guardar.php", {
            puntaje: puntaje,
            aciertos: contadorAciertos,
            errores: contadorErrores,
            cancion: playlist[estiloCancion].nombre
        }, () => cargarTablaPosiciones());

        $("#game-interface").fadeOut();
        $("#results-screen").fadeIn();
    }

    function activarCarril(nombreCarril) {
        if (!juegoActivo || juegoPausado) return;
        let laneId = mapaCarriles[nombreCarril];
        let hitZone = $("#" + laneId + " .hit-zone");
        
        hitZone.addClass("active-hit");
        setTimeout(() => hitZone.removeClass("active-hit"), 100);
        verificarGolpe(laneId);
    }

    // --- 4. EVENTOS DE INTERFAZ ---

    // Botones Pausa
    $("#btn-resume").click(() => alternarPausa());
    $("#btn-exit-pause").click(() => salirAlMenu());
    $("#btn-restart-pause").click(() => { $("#pause-menu").fadeOut(); $("#btn-restart").click(); });

    // Slider Volumen Pausa (Sincronizado)
    $("#pause-volume-slider").on("input", function() {
        let vol = $(this).val();
        let audio = document.getElementById("bg-music");
        let video = document.getElementById("bg-video");
        if(audio) audio.volume = vol;
        if(video) video.volume = vol;
        $("#volume-slider").val(vol);
        $("#settings-volume").val(vol);
    });

// --- BOTÓN INICIAR (VERSIÓN A PRUEBA DE FALLOS) ---
    $("#start-btn").on("click", function(e) {
        e.preventDefault(); // Evita comportamientos raros del formulario
        console.log("¡Click detectado en el botón!");
        
        // 1. Verificar si hay canción seleccionada
        let estilo = $("#song-select").val();
        
        if (!estilo) {
            alert("⚠️ Selecciona una canción primero.");
            return;
        }

        // 2. Intentar iniciar aunque falten datos (Modo recuperación)
        try {
            let track = playlist[estilo];
            
            $("#start-screen").hide(); // Usamos hide() directo por si fadeOut falla
            $("#game-interface").show();
            $("#score").text(0);
            
            // Iniciar Audio/Video
            let audio = document.getElementById("bg-music");
            let video = document.getElementById("bg-video");
            
            if(track) {
                // Si la playlist cargó bien
                juegoActivo = true; 
                iniciarNotas(track.velocidad, track.frecuencia);
                
                // Intentar reproducir (con manejo de errores)
                video.play().catch(err => console.log("Video error:", err));
                audio.play().catch(err => console.log("Audio error:", err));
            } else {
                // Si la playlist falló, forzamos un inicio genérico para probar
                alert("⚠️ Error de datos, iniciando modo prueba.");
                juegoActivo = true;
                iniciarNotas(2000, 120); // Velocidad y BPM por defecto
            }
            
        } catch (error) {
            console.error("Error al iniciar:", error);
            alert("Hubo un error interno: " + error.message);
        }
    });

    // Reiniciar y Volver
    $("#btn-back-menu").click(() => salirAlMenu());
    $("#btn-restart").click(function() {
        $("#results-screen").fadeOut();
        $("#game-interface").fadeIn();
        puntaje = 0; contadorAciertos = 0; contadorErrores = 0;
        $("#score").text("0"); $("#feedback").text("");
        
        let track = playlist[$("#song-select").val()];
        let audio = document.getElementById("bg-music");
        let video = document.getElementById("bg-video");
        
        audio.currentTime = 0; video.currentTime = 0; video.load();
        audio.play(); video.play();
        
        juegoActivo = true; juegoPausado = false;
        iniciarNotas(track.velocidad, track.frecuencia);
    });

    // Control Global Teclado (Anti-rebote + Configuración)
    $(document).keydown(function(event) {
        if (event.originalEvent.repeat) return; 
        if ($(event.target).is('input, textarea')) return;

        let key = event.key.toLowerCase();
        
        // Pausa con Cooldown (500ms)
        if (key === 'p') {
            let ahora = Date.now();
            if (ahora - ultimoTiempoPausa < 500) return; 
            ultimoTiempoPausa = ahora;
            alternarPausa();
            return;
        }

        if (juegoPausado || $("#settings-modal").is(":visible")) return;

        if (key === configTeclas.lane1) activarCarril('lane1');
        else if (key === configTeclas.lane2) activarCarril('lane2');
        else if (key === configTeclas.lane3) activarCarril('lane3');
        else if (key === configTeclas.lane4) activarCarril('lane4');
    });

    // Preview Canción
    const TIEMPO_PREVIEW = 15;
    $("#song-select").change(function() {
        let estilo = $(this).val();
        if(playlist[estilo]) {
            let track = playlist[estilo];
            let v = $("#bg-video"), a = $("#bg-music");
            
            a[0].volume = 0.5;
            v.attr("src", track.video); a.attr("src", track.audio);
            v[0].load(); a[0].load();
            
            v[0].play().then(() => a[0].play()).catch(e => console.log("Autoplay Bloqueado"));
        }
    });

    $("#bg-music").on("timeupdate", function() {
        if (!juegoActivo && !juegoPausado && this.currentTime >= TIEMPO_PREVIEW) {
            this.currentTime = 0; $("#bg-video")[0].currentTime = 0;
            this.play(); $("#bg-video")[0].play();
        }
    });
    $("#bg-music").on("ended", () => { if(juegoActivo) finalizarJuego(); });

    // --- 5. LÓGICA CORE DEL JUEGO ---

function iniciarNotas(velocidadCaida, frecuenciaBPM) {
    // 1. Validación de BPM
    let bpm = parseInt(frecuenciaBPM) || 120;
    let intervaloMs = 60000 / bpm;
    console.log(`BPM: ${bpm} | Intervalo: ${intervaloMs.toFixed(0)}ms`);

    // 2. Limpiar intervalo anterior por seguridad
    if (intervaloGenerador) clearInterval(intervaloGenerador);

    // 3. Iniciar el bucle de generación
    intervaloGenerador = setInterval(function() {
        if(!juegoActivo) return;

        let cantidad = obtenerCantidadNotas();
        let keys = ['a', 's', 'd', 'f'].sort(() => 0.5 - Math.random()); 
        
        // Generar las notas seleccionadas
        keys.slice(0, cantidad).forEach(function(k) {
            let laneId = teclasMap[k]; // Usamos la variable global segura
            let nota = $('<div class="note"></div>').data("hit", false);
            $("#" + laneId).append(nota);
            
            // 4. Animación de caída (Sintaxis Robustecida)
            nota.animate({ 
                top: (alturaJuego + 60) + "px" // +60 asegura que salga del div visualmente
            }, {
                duration: velocidadCaida,
                easing: "linear",
                complete: function() {    
                    // Esta función se ejecuta cuando la nota llega al final
                    // Verificamos si NO fue golpeada Y si el juego sigue activo
                    if (!$(this).data("hit") && juegoActivo && !juegoPausado) {
                        mostrarFeedback("¡FALLO!", "miss");
                        // Restar puntos (0 puntos, texto vacío porque ya lo mandamos en feedback, tipo 'miss')
                        golpearNota($(this), 0, "", "miss");
                    }
                    // Eliminar nota del HTML (Limpieza de memoria)
                    $(this).remove();
                }
            });
        });
    }, intervaloMs);
}

    function verificarGolpe(laneId) {
        let notas = $("#" + laneId + " .note");
        if (notas.length === 0) return;

        let target = notas.first();
        let dist = Math.abs(target.position().top - zonaIdeal);

        if (dist < 25) golpearNota(target, 100, "¡PERFECTO!", "perfect");
        else if (dist < 60) golpearNota(target, 50, "BIEN", "good");
        else if (dist < 120) golpearNota(target, 10, "MALO", "miss");
        else restarPuntos();
    }

    function golpearNota(nota, pts, txt, clase) {
        nota.data("hit", true).stop().remove();
        if(clase === "miss") {
            contadorErrores++; desactivarPoder();
            puntaje = Math.max(0, puntaje - 20);
        } else {
            contadorAciertos++; puntaje += (pts * multiplicador); cargarPoder();
        }
        mostrarFeedback(txt, clase);
        $("#score").text(puntaje);
    }

    function restarPuntos() {
        contadorErrores++; puntaje = Math.max(0, puntaje - 50);
        $("#score").text(puntaje);
        $("#game-container").css("border-color", "red");
        setTimeout(() => $("#game-container").css("border-color", "#555"), 200);
        desactivarPoder();
    }

    // --- 6. CONFIGURACIÓN Y VISUALES ---
    
    // Panel de Dificultad
    $("#btn-prev").click(() => { if (indiceDificultad > 0) { indiceDificultad--; actualizarPanelDoom(); }});
    $("#btn-next").click(() => { if (indiceDificultad < 3) { indiceDificultad++; actualizarPanelDoom(); }});

    function actualizarPanelDoom() {
        let d = dificultades[indiceDificultad];
        $("#diff-img").attr("src", d.img);
        $("#diff-title").text(d.titulo).css("color", indiceDificultad === 3 ? "red" : "yellow");
        $("#diff-desc").text(d.desc);
        dificultadActual = d.id;
    }

    // Modal Settings
    function actualizarTextoPantalla() {
        let t = `${configTeclas.lane1} - ${configTeclas.lane2} - ${configTeclas.lane3} - ${configTeclas.lane4}`;
        $("#display-teclas").text(t.toUpperCase());
    }

    $("#btn-settings").click(() => {
        $("#settings-modal").fadeIn();
        let audio = document.getElementById("bg-music");
        if(audio) $("#settings-volume").val(audio.volume);
        $("#conf-key-a").val(configTeclas.lane1);
        $("#conf-key-s").val(configTeclas.lane2);
        $("#conf-key-d").val(configTeclas.lane3);
        $("#conf-key-f").val(configTeclas.lane4);
    });

    $("#btn-close-settings").click(() => {
        $("#settings-modal").fadeOut();
        configTeclas.lane1 = $("#conf-key-a").val().toLowerCase();
        configTeclas.lane2 = $("#conf-key-s").val().toLowerCase();
        configTeclas.lane3 = $("#conf-key-d").val().toLowerCase();
        configTeclas.lane4 = $("#conf-key-f").val().toLowerCase();
        
        actualizarTextoPantalla();
        
        // Actualizar visuales dentro del juego
        $("#label-lane-1").text(configTeclas.lane1.toUpperCase());
        $("#label-lane-2").text(configTeclas.lane2.toUpperCase());
        $("#label-lane-3").text(configTeclas.lane3.toUpperCase());
        $("#label-lane-4").text(configTeclas.lane4.toUpperCase());
        
        alert("¡Configuración Guardada!");
    });

    // Validación input teclas
    $(".key-input").keydown(function(e) {
        e.preventDefault();
        let k = e.key.toLowerCase();
        if (k === 'p') { alert("Tecla 'P' reservada."); return; }
        $(this).val(k);
    });

    // Sincronización volumen modal
    $("#settings-volume").on("input", function() {
        let v = $(this).val();
        let a = document.getElementById("bg-music"), vid = document.getElementById("bg-video");
        if(a) a.volume = v; if(vid) vid.volume = v;
        $("#volume-slider").val(v);
    });

    // --- 7. GAMEPAD ---
    let gamepadIndex = null, botonesPrevios = [];
    window.addEventListener("gamepadconnected", e => {
        gamepadIndex = e.gamepad.index;
        $("#gamepad-status").text("🎮 Conectado").css("color", "#0f0");
        bucleGamepad();
    });
    window.addEventListener("gamepaddisconnected", () => {
        gamepadIndex = null;
        $("#gamepad-status").text("⚠️ Desconectado").css("color", "yellow");
    });

    function bucleGamepad() {
        if (gamepadIndex === null) return;
        const gp = navigator.getGamepads()[gamepadIndex];
        if (!gp) return;

        const maps = [
            { btn: 2, c: 'lane1' }, { btn: 0, c: 'lane2' },
            { btn: 3, c: 'lane3' }, { btn: 1, c: 'lane4' },
            { btn: 14, c: 'lane1' }, { btn: 15, c: 'lane2' }
        ];

        maps.forEach(m => {
            let pressed = gp.buttons[m.btn].pressed;
            if (pressed && !botonesPrevios[m.btn]) activarCarril(m.c);
            botonesPrevios[m.btn] = pressed;
        });
        requestAnimationFrame(bucleGamepad);
    }

    // --- 8. UTILIDADES ---
    function generarSelectCanciones() {
        $("#song-select").empty().append(`<option value="" disabled selected>Seleccionar Cancion</option>`);
        for (let k in playlist) {
            $("#song-select").append(`<option value="${k}">${playlist[k].nombre} [${playlist[k].info}]</option>`);
        }
    }
    
    function cargarTablaPosiciones() {
        $.getJSON("api_scores.php", data => {
            $("#high-scores-list").empty();
            data.forEach((p, i) => {
                let st = (i === 0) ? 'style="color:gold; font-weight:bold;"' : '';
                $("#high-scores-list").append(`<li ${st}>#${i+1} ${p.nombre_usuario} - ${p.puntos}</li>`);
            });
        });
    }

    function mostrarFeedback(txt, cls) {
        $("#feedback").text(txt).removeClass().addClass(cls).css({opacity: 1, top: "30%"})
            .stop().animate({ top: "20%", opacity: 0 }, 500);
    }

    function obtenerCantidadNotas() {
        let r = Math.random() * 100;
        if (dificultadActual === "facil") return (r < 50) ? 0 : 1;
        if (dificultadActual === "medio") return (r < 25) ? 0 : (r < 90 ? 1 : 2);
        if (dificultadActual === "dificil") return (r < 10) ? 0 : (r < 70 ? 1 : (r < 95 ? 2 : 3));
        return (r < 40) ? 1 : (r < 80 ? 2 : (r < 95 ? 3 : 4));
    }

    function cargarPoder() {
        if (multiplicador === 1) {
            let b = $("#power-bar"), w = parseFloat(b[0].style.width) || 0;
            if(w + 10 >= 100) activarPoder(); else b.css("width", (w + 10) + "%");
        }
    }
    function activarPoder() { multiplicador = 2; $("#power-bar").css("width", "100%"); $("#game-container").addClass("power-mode"); $("#combo-text").show(); setTimeout(desactivarPoder, 6000); }
    function desactivarPoder() { multiplicador = 1; $("#power-bar").css("width", "0%"); $("#game-container").removeClass("power-mode"); $("#combo-text").hide(); }

    // Helpers Resize/Scroll
    let alturaJuego = $("#game-container").height();
    let zonaIdeal = alturaJuego - 70;
    $(window).resize(() => { alturaJuego = $("#game-container").height(); zonaIdeal = alturaJuego - 70; });
    window.addEventListener("wheel", e => e.preventDefault(), {passive: false});
    window.addEventListener("keydown", e => { if([32,37,38,39,40].includes(e.keyCode)) e.preventDefault(); }, false);
});