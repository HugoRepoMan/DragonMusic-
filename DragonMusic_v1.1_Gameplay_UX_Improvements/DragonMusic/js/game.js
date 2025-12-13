$(document).ready(function() {
    //Variables Globales
    let puntaje = 0;
    let multiplicador = 1;
    let juegoActivo = false;
    let intervaloGenerador;
    let contadorAciertos = 0;
    let contadorErrores = 0;
    
    // Variables de Dificultad 
    let indiceDificultad = 0; 
    let dificultadActual = "facil"; 
    
    // Variables de pausa
    let juegoPausado = false;

    // --- NUEVO: Variable playlist vacía (se llenará desde MySQL) ---
    let playlist = {}; 

    // --- NUEVO: CARGAR CANCIONES DESDE LA BASE DE DATOS AL INICIAR ---
    $.getJSON("api_playlist.php", function(datosServidor) {
        playlist = datosServidor; // Llenamos la variable con datos reales
        console.log("Canciones cargadas:", playlist);
        
        // Generamos el menú solo cuando ya tenemos datos
        generarSelectCanciones();
        actualizarPanelDoom();
    }).fail(function() {
        console.error("Error crítico: No se pudo conectar a api_playlist.php");
        alert("Error de conexión con la Base de Datos. Revisa la consola.");
    });


    // Configuracion de pausa y volumen 
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
            
            // Reanudar notas (truco: limpiamos y regeneramos con el mismo ritmo)
            $(".note").remove(); 
            let estilo = $("#song-select").val();
            // Aseguramos que playlist[estilo] exista
            if(playlist[estilo]) {
                iniciarNotas(playlist[estilo].velocidad, playlist[estilo].frecuencia);
            }
        }
    }

        $("#btn-restart-pause").click(function() {

        $("#pause-menu").fadeOut(); 

        $("#btn-restart").click();

    });

    // --- NUEVO: FINALIZAR JUEGO CONECTADO A MYSQL ---
    function finalizarJuego() {
        juegoActivo = false;
        clearInterval(intervaloGenerador);
        $(".note").remove(); 
        
        // Detener música y video
        $("#bg-music")[0].pause();
        $("#bg-video")[0].pause();

        $("#final-score").text(puntaje);
        $("#final-hits").text(contadorAciertos);
        $("#final-misses").text(contadorErrores);
        
        let rango = "Novato";
        if (puntaje > 5000) rango = "Promesa del Rock";
        if (puntaje > 15000) rango = "Leyenda";
        if (puntaje > 30000) rango = "DIOS DE LA GUITARRA";
        $("#final-rank").text(rango);

        // 1. GUARDAR EN BASE DE DATOS (AJAX POST)
        let estiloCancion = $("#song-select").val();
        
        $.post("api_guardar.php", {
            puntaje: puntaje,
            aciertos: contadorAciertos,
            errores: contadorErrores,
            cancion: playlist[estiloCancion].nombre // Enviamos nombre para buscar ID
        }, function(respuesta) {
            console.log("Guardado en BD: " + respuesta);
            
            // 2. DESPUÉS DE GUARDAR, CARGAR LA TABLA (AJAX GET)
            cargarTablaPosiciones();
        });

        $("#game-interface").fadeOut();
        $("#results-screen").fadeIn();
    }

    // --- NUEVO: FUNCIÓN PARA LEER EL TOP 5 ---
    function cargarTablaPosiciones() {
        $.getJSON("api_scores.php", function(datos) {
            $("#high-scores-list").empty();          
            
            // Recorrer los datos que vienen de MySQL
            for(let i = 0; i < datos.length; i++) {
                let p = datos[i];
                let estilo = (i === 0) ? 'style="color:gold; font-weight:bold;"' : '';
                
                $("#high-scores-list").append(
                    `<li ${estilo}>
                        <span>#${i+1} ${p.nombre_usuario}</span>
                        <span>${p.puntos} pts</span>
                        <br><small style="font-size:0.7em; color:#aaa">${p.nombre_mostrar}</small>
                    </li>`
                );
            }
        }).fail(function() {
            $("#high-scores-list").html("<li style='color:red'>Error cargando ranking</li>");
        });
    }

    // Evento: Pausa con tecla P
    $(document).keydown(function(e) {
        if (e.key.toLowerCase() === 'p') {
            alternarPausa();
        }
    });

    // Evento: Boton Reanudar
    $("#btn-resume").click(function() {
        alternarPausa();
    });

    // Evento: Boton Salir del menú de pausa
    $("#btn-exit-pause").click(function() {
        salirAlMenu();
    });

    // Función auxiliar para salir
    function salirAlMenu() {
        juegoActivo = false;
        juegoPausado = false;
        clearInterval(intervaloGenerador);
        
        let audio = document.getElementById("bg-music");
        let video = document.getElementById("bg-video");
        audio.pause();
        audio.currentTime = 0;
        video.pause();
        
        $(".note").remove();
        $("#feedback").text("");
        $("#power-bar").css("width", "0%");
        if(typeof desactivarPoder === "function") desactivarPoder();
        
        $("#pause-menu").fadeOut(); 
        $("#results-screen").fadeOut();
        $("#game-interface").fadeOut(function() {
            $("#start-screen").fadeIn();
        });
    }

    // Evento: Control de Volumen
    $("#volume-slider").on("input", function() {
        let vol = $(this).val();
        document.getElementById("bg-music").volume = vol;
        document.getElementById("bg-video").volume = vol;
    });

    let alturaJuego = $("#game-container").height();
    let zonaIdeal = alturaJuego - 70;
    const teclas = { 'a': 'lane-a', 's': 'lane-s', 'd': 'lane-d', 'f': 'lane-f' };
    
    $(window).resize(function() {
        alturaJuego = $("#game-container").height();
        zonaIdeal = alturaJuego - 70;
    });

    // Datos del Panel de Dificultad 
    const dificultades = [
        { id: "facil", titulo: "¿PUEDO JUGAR, PAPI?", desc: "Solo 1 nota a la vez", img: "media/face_easy.png" },
        { id: "medio", titulo: "HURT ME PLENTY", desc: "Acordes ocasionales", img: "media/face_medium.png" },
        { id: "dificil", titulo: "ULTRA VIOLENCE", desc: "Dedos rápidos requeridos", img: "media/face_hard.png" },
        { id: "experto", titulo: "¡NIGHTMARE!", desc: "El caos total", img: "media/face_expert.png" }
    ];
         
    // Actualizar Panel Doom
    function actualizarPanelDoom() {
        let data = dificultades[indiceDificultad];          
        $("#diff-img").attr("src", data.img);
        $("#diff-title").text(data.titulo);
        $("#diff-desc").text(data.desc);             
        if(indiceDificultad === 3) $("#diff-title").css("color", "red");
        else $("#diff-title").css("color", "yellow");
        dificultadActual = data.id;
    }

    function generarSelectCanciones() {
        $("#song-select").empty(); 
        $("#song-select").append(`<option value="" disabled selected> Seleccionar Cancion </option>`);
        for (let clave in playlist) {
            let cancion = playlist[clave];
            let texto = `${cancion.nombre} [${cancion.info}]`;
            $("#song-select").append(`<option value="${clave}">${texto}</option>`);
        }
    }

// --- LÓGICA DE PREVIEW (VIDEO + AUDIO) ---
    const TIEMPO_PREVIEW = 15; // Segundos que dura el bucle del menú

    $("#song-select").change(function() {
        let videoTag = $("#bg-video");
        let audioTag = $("#bg-music");
        let estilo = $(this).val();
        
        audioTag[0].volume = 0.5;
        if(playlist[estilo]) {
            let track = playlist[estilo];
            let videoTag = $("#bg-video");
            let audioTag = $("#bg-music");

            // 1. Cargamos AMBOS medios (Video y Audio)
            videoTag.attr("src", track.video);
            audioTag.attr("src", track.audio);
            
            // 2. Forzamos la recarga para evitar errores de caché/Drive
            videoTag[0].load();
            audioTag[0].load();
            
            // 3. Reproducir (Preview)
            // Intentamos reproducir. Los navegadores modernos bloquean el autoplay
            // si el usuario no ha interactuado primero, pero al hacer click en el select, ya interactuó.
            let playPromise = videoTag[0].play();
            if (playPromise !== undefined) {
                playPromise.then(_ => {
                    audioTag[0].play(); // Si el video arranca, arrancamos el audio
                }).catch(error => {
                    console.log("Autoplay bloqueado por el navegador (normal al inicio)");
                });
            }
        }
    });

    // --- EL BUCLE MÁGICO (LOOP) ---
    // Usamos el audio como maestro de tiempo para la sincronización
    $("#bg-music").on("timeupdate", function() {
        // Solo hacemos loop si NO estamos jugando (estamos en menú o resultados)
        if (!juegoActivo && !juegoPausado) {
            if (this.currentTime >= TIEMPO_PREVIEW) {
                this.currentTime = 0;       // Reiniciar Audio
                $("#bg-video")[0].currentTime = 0; // Reiniciar Video
                this.play();
                $("#bg-video")[0].play();
            }
        }
    });

// Función de Dificultad Optimizada (Con probabilidad de silencios)
    function obtenerCantidadNotas() {
        let rand = Math.random() * 100;

        // NIVEL FÁCIL
        // Objetivo: Que el jugador aprenda el ritmo. Muchos espacios vacíos.
        if (dificultadActual === "facil") {
            if (rand < 50) return 0; // 50% de probabilidad de SILENCIO (descanso)
            return 1;                // 50% de probabilidad de 1 nota
        }

        // NIVEL MEDIO
        // Objetivo: Ritmo constante, pero sin agobiar. Acordes muy raros.
        if (dificultadActual === "medio") {
            if (rand < 25) return 0; // 25% de probabilidad de SILENCIO
            if (rand < 90) return 1; // 65% de probabilidad de 1 nota
            return 2;                // 10% de probabilidad de ACORDE (2 notas)
        } 

        // NIVEL DIFÍCIL
        // Objetivo: Reto constante. Pocos descansos.
        if (dificultadActual === "dificil") {
            if (rand < 10) return 0; // Solo 10% de descansos
            if (rand < 70) return 1; // Mayoría notas simples
            if (rand < 95) return 2; // Frecuentes acordes dobles
            return 3;                // Raros acordes triples
        } 

        // NIVEL EXPERTO (Modo "Nightmare")
        // Objetivo: Caos total. Sin descansos.
        if (dificultadActual === "experto") {
            // Sin silencios (return 0)
            if (rand < 40) return 1; 
            if (rand < 80) return 2; 
            if (rand < 95) return 3; 
            return 4; // ¡Locura!
        }

        return 1; // Fallback por seguridad
    }
    // Sistema de caida de notas
    function iniciarNotas(velocidadCaida, frecuenciaBPM) {
        let bpm = parseInt(frecuenciaBPM);
        
        // Validación de seguridad: Si el BPM es 0 o inválido, usamos 120
        if (!bpm || bpm <= 0) {
            console.warn("BPM inválido, usando 120 por defecto");
            bpm = 120;
        }

        let intervaloMs = 60000 / bpm;
        console.log(`Ritmo: ${bpm} BPM | Generando nota cada: ${intervaloMs.toFixed(0)}ms`);

        // 2. Iniciar el intervalo con el tiempo calculado
        intervaloGenerador = setInterval(function() {
            if(!juegoActivo) return;

            let cantidad = obtenerCantidadNotas();
            let keysDisponibles = ['a', 's', 'd', 'f'];
            keysDisponibles.sort(() => 0.5 - Math.random()); 
            let teclasSeleccionadas = keysDisponibles.slice(0, cantidad);
            
            teclasSeleccionadas.forEach(function(keyName) {
                let laneId = teclas[keyName];
                let nota = $('<div class="note"></div>');
                nota.data("hit", false);
                $("#" + laneId).append(nota);
                
                // Aquí usamos 'velocidadCaida' tal cual viene de la BD (ej. 1800ms)
                nota.animate({ top: (alturaJuego + 50) + "px" }, velocidadCaida, "linear", function() {    
                    if ($(this).data("hit") === false && !juegoPausado) {
                        mostrarFeedback("¡FALLO!", "miss");
                        golpearNota($(this), 0, "¡FALLO!", "miss");
                    }
                    $(this).remove();
                });
            });
        }, intervaloMs); // <--- AQUÍ ESTÁ LA CLAVE: Usamos el tiempo calculado
    }

    // Verificacion de acierto 
    function verificarGolpe(laneId) {
        let notas = $("#" + laneId + " .note");
        if (notas.length === 0) return;

        let notaTarget = notas.first();
        let posTop = notaTarget.position().top;
        let distancia = Math.abs(posTop - zonaIdeal);

        if (distancia < 25) {
            golpearNota(notaTarget, 100, "¡PERFECTO!", "perfect");
        } else if (distancia < 60) {
            golpearNota(notaTarget, 50, "BIEN", "good");
        } else if (distancia < 120) {
            golpearNota(notaTarget, 10, "Malo", "miss");
        } else {
            restarPuntos(); 
        }
    }

    function golpearNota(nota, puntos, texto, clase) {
        // Detener animación y borrar nota para que no siga consumiendo recursos
        nota.data("hit", true);
        nota.stop().remove();

        if(clase === "miss") {
            contadorErrores++; 
            desactivarPoder();
            let castigo = 20; 
            
            puntaje -= castigo;
            if (puntaje < 0) {
                puntaje = 0;
            }

        } else {
            contadorAciertos++; 
            puntaje += (puntos * multiplicador);
            cargarPoder();
        }

        mostrarFeedback(texto, clase);
        $("#score").text(puntaje);
    }

    function restarPuntos() {
        contadorErrores++; 
        puntaje -= 50;
        if(puntaje < 0) puntaje = 0;
        $("#score").text(puntaje);
        $("#game-container").css("border-color", "red");
        setTimeout(() => $("#game-container").css("border-color", "#555"), 200);
        desactivarPoder();
    }       
    
    // BOTÓN INICIAR CONCIERTO
    $("#start-btn").click(function() {
        // ... (Tu código de validación de nombre y playlist sigue igual) ...
        let estilo = $("#song-select").val();
        audio.volume = $("#volume-slider").val();
        if(playlist[estilo]) {
            let track = playlist[estilo];
            
            // --- CAMBIO: YA NO CARGAMOS SRC AQUÍ, PORQUE YA ESTÁ CARGADO ---
            
            let audio = document.getElementById("bg-music");
            let video = document.getElementById("bg-video");

            // Reiniciamos al segundo 0 para que la canción empiece limpia
            audio.currentTime = 0;
            video.currentTime = 0;

            // Aseguramos volúmenes (opcional, por si quieres bajarlo en el menú)
            audio.volume = $("#volume-slider").val(); 
            
            // Reproducir REALMENTE
            video.play();
            audio.play();

            $("#start-screen").fadeOut();
            $("#game-interface").fadeIn();
            $("#score").text(0);
            
            juegoActivo = true; 
            iniciarNotas(track.velocidad, track.frecuencia);
        }
    });

    // Detectar cuando la cancion termina 
    $("#bg-music").on("ended", function() {
        if(juegoActivo) {
            finalizarJuego();
        }
    });

    $("#btn-back-menu").click(function() {
        salirAlMenu();
    });

    $("#btn-restart").click(function() {
        $("#results-screen").fadeOut();
        $("#game-interface").fadeIn();
        puntaje = 0;
        contadorAciertos = 0;
        contadorErrores = 0;
        $("#score").text("0");
        $("#feedback").text(""); 
                    
        let estilo = $("#song-select").val();
        let track = playlist[estilo];
        let audio = document.getElementById("bg-music");
        let video = document.getElementById("bg-video");
        
        // Resetear medios
        audio.currentTime = 0; 
        audio.loop = false; 
        video.currentTime = 0;
        video.load(); // Importante
        
        audio.play();
        video.play();
        
        juegoActivo = true;
        juegoPausado = false;
        iniciarNotas(track.velocidad, track.frecuencia);
    });            

    $(document).keydown(function(event) {
        if(!juegoActivo) return;
        let key = event.key.toLowerCase();
        if (teclas[key]) {
            let hitZone = $("#" + teclas[key] + " .hit-zone");
            hitZone.addClass("active-hit");
            setTimeout(() => hitZone.removeClass("active-hit"), 100);
            verificarGolpe(teclas[key]);
        }
    });
                  
    $("#btn-prev").click(function() {
        if (indiceDificultad > 0) {
            indiceDificultad--;
            actualizarPanelDoom();
        }
    });
                  
    $("#btn-next").click(function() {
        if (indiceDificultad < dificultades.length - 1) {
            indiceDificultad++;
            actualizarPanelDoom();
        }
    });

    function mostrarFeedback(texto, clase) {
        let fb = $("#feedback");
        fb.text(texto).removeClass().addClass(clase).css({opacity: 1, top: "30%"});
        fb.stop().animate({ top: "20%", opacity: 0 }, 500);
    }

    function cargarPoder() {
        if (multiplicador === 1) {
            let barra = $("#power-bar");
            let actual = parseFloat(barra[0].style.width) || 0;
            let nuevo = actual + 10;
            if(nuevo >= 100) activarPoder();
            else barra.css("width", nuevo + "%");
        }
    }

    function activarPoder() {
        multiplicador = 2;
        $("#power-bar").css("width", "100%");
        $("#game-container").addClass("power-mode");
        $("#combo-text").show();
        setTimeout(desactivarPoder, 6000);
    }

    function desactivarPoder() {
        multiplicador = 1;
        $("#power-bar").css("width", "0%");
        $("#game-container").removeClass("power-mode");
        $("#combo-text").hide();
    }
    
    // Evitar scroll con flechas
    window.addEventListener("wheel", function(e){e.preventDefault();}, {passive: false});
    window.addEventListener("keydown", function(e) {
        if([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
            e.preventDefault();
        }
    }, false);
});