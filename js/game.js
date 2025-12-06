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

    // Configuracion de pausa y volumen 
    // Funcion para pausar/reanudar
    function alternarPausa() {
        if (!juegoActivo) return; 
        juegoPausado = !juegoPausado; 
        let audio = document.getElementById("bg-music");
        let video = document.getElementById("bg-video");
        if (juegoPausado) {
            clearInterval(intervaloGenerador); 
            audio.pause();
            video.pause();
            //Selector por clase
            $(".note").stop(true); 
            $("#pause-menu").fadeIn(200); 
        } else {
            // Quitar pausa
            audio.play();
            video.play();
            $("#pause-menu").fadeOut(200); 
            //Selector por clase y eliminacion de elementos
            $(".note").remove(); 
                                        //Formularios
            let estilo = $("#song-select").val();
            iniciarNotas(playlist[estilo].velocidad, playlist[estilo].frecuencia);
        }
    }
    // Uso de AJAX para cargar la tabla de posiciones al terminar el juego 
    function finalizarJuego() {
        juegoActivo = false;
        clearInterval(intervaloGenerador);
        //Selector por clase y eliminacion de elementos
        $(".note").remove(); 
        // Manipulacion HTML
        $("#final-score").text(puntaje);
        // Manipulacion HTML
        $("#final-hits").text(contadorAciertos);
        // Manipulacion HTML
        $("#final-misses").text(contadorErrores);
        let rango = "Novato";
        if (puntaje > 5000) rango = "Promesa del Rock";
        if (puntaje > 15000) rango = "Leyenda";
        if (puntaje > 30000) rango = "DIOS DE LA GUITARRA";
        // Manipulacion HTML
        $("#final-rank").text(rango);

        // Cargar AJAX
        $.getJSON("scores.json", function(datos) {
            let jugadorActual = {
                                        //Formularios
                nombre: $("#player-name").val() || "Anónimo",
                puntaje: puntaje
            };
            datos.push(jugadorActual);
            // Ordenar de mayor a menor
            datos.sort((a, b) => b.puntaje - a.puntaje);
            $("#high-scores-list").empty();          
            for(let i = 0; i < Math.min(datos.length, 5); i++) {
                let p = datos[i];
                let estilo = (i === 0) ? 'style="color:gold; font-weight:bold;"' : '';
                // Manipulacion HTML
                $("#high-scores-list").append(
                    `<li ${estilo}>
                        <span>#${i+1} ${p.nombre}</span>
                        <span>${p.puntaje} pts</span>
                    </li>`
                );
            }

        }).fail(function() {
            $("#high-scores-list").html("<li style='color:red'>Error: Usa Live Server para ver la tabla</li>");
        });
        //Transiciones de pantalla
        $("#game-interface").fadeOut();
        $("#results-screen").fadeIn();
    }
    // Evento: Pausa con tecla P
               //Evento .keydown()
    $(document).keydown(function(e) {
        if (e.key.toLowerCase() === 'p') {
            alternarPausa();
        }
    });

    // Evento: Boton Reanudar
                    //Evento .click()
    $("#btn-resume").click(function() {
        alternarPausa();
    });

    // Evento: Boton Salir 
    //Evento .click()
    $("#btn-exit-pause").click(function() {
        juegoActivo = false;
        juegoPausado = false;
        clearInterval(intervaloGenerador);
        let audio = document.getElementById("bg-music");
        let video = document.getElementById("bg-video");
        audio.pause();
        audio.currentTime = 0;
        video.pause();
        //Selector por clase y eliminacion de elementos
        $(".note").remove();
        // Manipulacion HTML
        $("#feedback").text("");
        $("#power-bar").css("width", "0%");
        if(typeof desactivarPoder === "function") desactivarPoder();
        $("#pause-menu").fadeOut(); 
        $("#game-interface").fadeOut(function() {
            //Transiciones de pantalla
            $("#start-screen").fadeIn();
        });
    });

    // Evento: Control de Volumen
                    //Evento .on()
    $("#volume-slider").on("input", function() {
                        //Formularios
        let vol = $(this).val();
        document.getElementById("bg-music").volume = vol;
        document.getElementById("bg-video").volume = vol;
    });     //Selector por ID
            let alturaJuego = $("#game-container").height();
            let zonaIdeal = alturaJuego - 70;
            const teclas = { 'a': 'lane-a', 's': 'lane-s', 'd': 'lane-d', 'f': 'lane-f' };
            $(window).resize(function() {
                              //Selector por ID
                alturaJuego = $("#game-container").height();
                zonaIdeal = alturaJuego - 70;
                console.log("Nueva altura detectada:", alturaJuego);
             });
            // Datos del Panel de Dificultad 
            const dificultades = [
                {
                    id: "facil",
                    titulo: "¿PUEDO JUGAR, PAPI?",
                    desc: "Solo 1 nota a la vez",
                    img: "media/face_easy.png" 
                },
                {
                    id: "medio",
                    titulo: "HURT ME PLENTY",
                    desc: "Acordes ocasionales",
                    img: "media/face_medium.png"
                },
                {
                    id: "dificil",
                    titulo: "ULTRA VIOLENCE",
                    desc: "Dedos rápidos requeridos",
                    img: "media/face_hard.png"
                },
                {
                    id: "experto",
                    titulo: "¡NIGHTMARE!",
                    desc: "El caos total",
                    img: "media/face_expert.png"
                }
            ];

            // Base de Datos de Canciones
            const playlist = {
                "tecno": { 
                    nombre: "Miku - Anamanaguchi",
                    info: "Normal",
                    audio: "songs/Miku.mp3",
                    video: "media/HatsuneMiku.mp4",
                    velocidad: 1800, frecuencia: 700
                },
                "andina": { 
                    nombre: "Jayac - Zamarro y Campinlla",
                    info: "Fácil/Medio",
                    audio: "songs/Jayac.mp3",
                    video: "media/JayacEC.mp4",
                    velocidad: 2200, frecuencia: 850
                },
                "rock": { 
                    nombre: "AC/DC - Thunderstruck",
                    info: "Difícil",
                    audio: "songs/Thunderstruck.mp3",
                    video: "media/ThunderstruckACDC.mp4",
                    velocidad: 1400, frecuencia: 500
                },
                "epic": { 
                    nombre: "DragonForce - Fury of the Storm",
                    info: "LEGENDARIO",
                    audio: "songs/DragonFury.mp3",
                    video: "media/Furydragon.mp4",
                    velocidad: 1000, frecuencia: 300
                }
            };
          
            // Actualizar Panel Doom
            function actualizarPanelDoom() {
                let data = dificultades[indiceDificultad];          
                $("#diff-img").attr("src", data.img);
                // Manipulacion HTML
                $("#diff-title").text(data.titulo);
                // Manipulacion HTML
                $("#diff-desc").text(data.desc);             
                if(indiceDificultad === 3) $("#diff-title").css("color", "red");
                else $("#diff-title").css("color", "yellow");
                dificultadActual = data.id;
            }

            function generarSelectCanciones() {
                $("#song-select").empty(); 
                for (let clave in playlist) {
                    let cancion = playlist[clave];
                    let texto = `${cancion.nombre} [${cancion.info}]`;
                    // Manipulacion HTML
                    $("#song-select").append(`<option value="${clave}">${texto}</option>`);
                }
            }

            // Probabilidad segun dificultad
            function obtenerCantidadNotas() {
                let rand = Math.random() * 100;

                if (dificultadActual === "facil") return 1;
                if (dificultadActual === "medio") {
                    return (rand < 80) ? 1 : 2; 
                } 
                if (dificultadActual === "dificil") {
                    if (rand < 50) return 1; 
                    if (rand < 85) return 2; 
                    return 3;               
                } 
                if (dificultadActual === "experto") {
                    if (rand < 20) return 1; 
                    if (rand < 60) return 2; 
                    if (rand < 90) return 3; 
                    return 4;                
                }

                return 1;
            }

            // Sistema de caida de notas
            function iniciarNotas(velocidadCaida, frecuencia) {
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
                        //Selector compuesto y manipulacion HTML
                        $("#" + laneId).append(nota);
                nota.animate({ top: (alturaJuego + 50) + "px" }, velocidadCaida, "linear", function() {    
                if ($(this).data("hit") === false && !juegoPausado) {
                    mostrarFeedback("¡FALLO!", "miss");
                    golpearNota($(this), 0, "¡FALLO!", "miss");
                }
                // Eliminacion de elementos
                $(this).remove();
            });
                    });
                }, frecuencia);
            }

            // Verificacion de acierto 
            function verificarGolpe(laneId) {
                            //Selector por desendencia
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
        // Sistema de conteo de errores
        function golpearNota(nota, puntos, texto, clase) {
        nota.data("hit", true);
        // Eliminacion de elementos
        nota.stop().remove();

        if(clase === "miss") {
            contadorErrores++; 
            desactivarPoder();
        } else {
            contadorAciertos++; 
            puntaje += (puntos * multiplicador);
            cargarPoder();
        }
        mostrarFeedback(texto, clase);
        //Selector por ID y manipulacion HTML
        $("#score").text(puntaje);
    }

    function restarPuntos() {
        contadorErrores++; 
        puntaje -= 50;
        if(puntaje < 0) puntaje = 0;
        //Selector por ID y manipulacion HTML
        $("#score").text(puntaje);
        //Selector por ID
        $("#game-container").css("border-color", "red");
                         //Selector por ID
        setTimeout(() => $("#game-container").css("border-color", "#555"), 200);
        desactivarPoder();
    }       //Selector por ID / Evento .click()
            $("#start-btn").click(function() {
                                            //Formularios
                let estilo = $("#song-select").val();
                                            //Formularios
                let nombre = $("#player-name").val();
                puntaje = 0;
                contadorAciertos = 0;
                contadorErrores = 0;
    
                document.getElementById("bg-music").loop = false;
                if(nombre.trim() === "") {
                    alert("¡Por favor escribe tu nombre de Rockstar!");
                    return;
                }
                if(playlist[estilo]) {
                    let track = playlist[estilo];
                    $("#bg-video").attr("src", track.video);
                    $("#bg-music").attr("src", track.audio);

                    let videoPromise = document.getElementById("bg-video").play();
                    let audioPromise = document.getElementById("bg-music").play();
                    
                    if (audioPromise !== undefined) {
                        audioPromise.catch(e => console.log("Autoplay bloqueado hasta interacción."));
                    }
                    // Transicion de pantalla
                    $("#start-screen").fadeOut();
                    $("#game-interface").fadeIn();
                    //Selector por ID y manipulacion HTML
                    $("#score").text(0);
                    juegoActivo = true;
                    iniciarNotas(track.velocidad, track.frecuencia);
                } else {
                    alert("Error cargando la canción. Revisa la consola.");
                }
            });
    // Detectar cuando la cancion termina 
                 //Evento .on() y ended
    $("#bg-music").on("ended", function() {
        if(juegoActivo) {
            finalizarJuego();
        }
    });
                       //Evento .click()
    $("#btn-back-menu").click(function() {
        //Transiciones de pantalla
        $("#results-screen").fadeOut();
        $("#start-screen").fadeIn();
        document.getElementById("bg-music").pause();
        document.getElementById("bg-music").currentTime = 0;
        document.getElementById("bg-video").pause();
    });
                     //Evento .click()
    $("#btn-restart").click(function() {
        //Transiciones de pantalla
        $("#results-screen").fadeOut();
        $("#game-interface").fadeIn();
        puntaje = 0;
        contadorAciertos = 0;
        contadorErrores = 0;
        //Selector por ID y manipulacion HTML
        $("#score").text("0");
        // Manipulacion HTML
        $("#feedback").text(""); 
                                    //Formularios
        let estilo = $("#song-select").val();
        let track = playlist[estilo];
        let audio = document.getElementById("bg-music");
        let video = document.getElementById("bg-video");
        audio.currentTime = 0; 
        audio.loop = false; 
        audio.play();
        video.play();
        juegoActivo = true;
        juegoPausado = false;
        iniciarNotas(track.velocidad, track.frecuencia);
    });                    //Evento .click()
            $("#btn-salir").click(function() { 
                juegoActivo = false;
                clearInterval(intervaloGenerador);
                
                document.getElementById("bg-music").pause();
                document.getElementById("bg-video").pause();
                document.getElementById("bg-music").currentTime = 0;
                //Selector por clase y eliminacion de elementos
                $(".note").stop().remove();
                // Manipulacion HTML
                $("#feedback").text("");
                desactivarPoder();
                //Transiciones de pantalla
                $("#game-interface").fadeOut();
                $("#start-screen").fadeIn();
            });
                       //Evento .keydown()
            $(document).keydown(function(event) {
                if(!juegoActivo) return;
                let key = event.key.toLowerCase();
                if (teclas[key]) {
                    let hitZone = $("#" + teclas[key] + " .hit-zone");
                    //Manipulacion de clases
                    hitZone.addClass("active-hit");
                    //Selector por clase y eliminacion de elementos
                    setTimeout(() => hitZone.removeClass("active-hit"), 100);
                    verificarGolpe(teclas[key]);
                }
            });
                          //Evento .click()
            $("#btn-prev").click(function() {
                if (indiceDificultad > 0) {
                    indiceDificultad--;
                    actualizarPanelDoom();
                }
            });
                          //Evento .click()
            $("#btn-next").click(function() {
                if (indiceDificultad < dificultades.length - 1) {
                    indiceDificultad++;
                    actualizarPanelDoom();
                }
            });
            function mostrarFeedback(texto, clase) {
                let fb = $("#feedback");
                // Manipulacion HTML y eliminacion de elementos y manipulacion de clases
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
                //Selector por ID y manipulacion de clases
                $("#game-container").addClass("power-mode");
                $("#combo-text").show();
                setTimeout(desactivarPoder, 6000);
            }

            function desactivarPoder() {
                multiplicador = 1;
                $("#power-bar").css("width", "0%");
                //Selector por ID y eliminacion de elementos
                $("#game-container").removeClass("power-mode");
                $("#combo-text").hide();
            }
            actualizarPanelDoom(); 
            generarSelectCanciones(); 
            window.addEventListener("wheel", function(e){e.preventDefault();}, {passive: false});
            window.addEventListener("keydown", function(e) {
            if([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
                e.preventDefault();
            }
            }, false);
            });