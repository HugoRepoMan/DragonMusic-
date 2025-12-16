-- ==========================================================
-- DRAGON MUSIC - BASE DE DATOS (VERSIÓN DEMOSTRACIÓN TÉCNICA)
-- ==========================================================

DROP DATABASE IF EXISTS DragonMusicDB;
CREATE DATABASE DragonMusicDB CHARACTER SET utf8 COLLATE utf8_general_ci;
USE DragonMusicDB;

SET GLOBAL event_scheduler = ON;

-- ==========================================================
-- 1. TABLAS (DDL)
-- ==========================================================

CREATE TABLE Roles (
    id_rol INT AUTO_INCREMENT PRIMARY KEY,
    nombre_rol VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE Canciones (
    id_cancion INT AUTO_INCREMENT PRIMARY KEY,
    clave_interna VARCHAR(50) UNIQUE, 
    nombre_mostrar VARCHAR(100) NOT NULL,
    info_dificultad VARCHAR(50),
    ruta_audio VARCHAR(255),
    ruta_video VARCHAR(255),
    velocidad INT, 
    frecuencia INT 
);

CREATE TABLE Usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre_usuario VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    id_rol INT NOT NULL,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_usuario_rol FOREIGN KEY (id_rol) REFERENCES Roles(id_rol)
);

CREATE TABLE Puntuaciones (
    id_score INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_cancion INT NOT NULL,
    puntos INT NOT NULL,
    aciertos INT NOT NULL,
    errores INT NOT NULL,
    fecha_juego DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_score_usuario FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario),
    CONSTRAINT fk_score_cancion FOREIGN KEY (id_cancion) REFERENCES Canciones(id_cancion)
);

CREATE TABLE Auditoria (
    id_log INT AUTO_INCREMENT,
    usuario_responsable VARCHAR(100), 
    accion VARCHAR(50) NOT NULL,
    detalle TEXT,
    fecha_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_log, fecha_hora)
)
PARTITION BY RANGE (YEAR(fecha_hora)) (
    PARTITION p2023 VALUES LESS THAN (2024),
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p2025 VALUES LESS THAN (2026),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);

-- Indices y Vistas
CREATE INDEX idx_nombre_user ON Usuarios(nombre_usuario);
CREATE INDEX idx_puntos_desc ON Puntuaciones(puntos DESC);

CREATE VIEW vw_ranking_global AS
SELECT u.nombre_usuario, c.nombre_mostrar AS cancion, p.puntos, p.fecha_juego
FROM Puntuaciones p
JOIN Usuarios u ON p.id_usuario = u.id_usuario
JOIN Canciones c ON p.id_cancion = c.id_cancion;

-- ==========================================================
-- 2. PROCEDIMIENTOS ALMACENADOS (Deben crearse ANTES de usarlos)
-- ==========================================================

DELIMITER //

-- SP LOGIN
CREATE PROCEDURE sp_login_usuario(IN p_usuario VARCHAR(100))
BEGIN
    DECLARE v_id INT;
    SELECT id_usuario INTO v_id FROM Usuarios WHERE nombre_usuario = p_usuario;
    IF v_id IS NOT NULL THEN
        SELECT * FROM Usuarios WHERE id_usuario = v_id;
    ELSE
        INSERT INTO Auditoria (usuario_responsable, accion, detalle) 
        VALUES (p_usuario, 'LOGIN_FAIL', 'Intento fallido: Usuario no existe');
    END IF;
END //

-- SP REGISTRO (Este es el que usaremos para Slash y Kabu)
CREATE PROCEDURE sp_registrar_usuario(IN p_usuario VARCHAR(100), IN p_password VARCHAR(255))
BEGIN
    DECLARE v_existe INT;
    START TRANSACTION; 
    SELECT COUNT(*) INTO v_existe FROM Usuarios WHERE nombre_usuario = p_usuario;
    IF v_existe > 0 THEN
        INSERT INTO Auditoria (usuario_responsable, accion, detalle) 
        VALUES ('SISTEMA', 'REGISTER_FAIL', CONCAT('Intento duplicado: ', p_usuario));
        ROLLBACK; 
        SELECT 'ERROR' AS estado, 'El usuario ya existe.' AS mensaje;
    ELSE
        -- Por defecto crea rol 2 (Jugador)
        INSERT INTO Usuarios (nombre_usuario, password_hash, id_rol) 
        VALUES (p_usuario, p_password, 2);
        
        INSERT INTO Auditoria (usuario_responsable, accion, detalle) 
        VALUES (p_usuario, 'REGISTER_NEW', 'Usuario registrado exitosamente');
        COMMIT; 
        SELECT 'OK' AS estado, 'Cuenta creada exitosamente.' AS mensaje;
    END IF;
END //

-- SP GUARDAR PUNTAJE
CREATE PROCEDURE sp_guardar_puntaje_seguro(
    IN p_usuario_nombre VARCHAR(100), IN p_cancion_nombre VARCHAR(100), 
    IN p_puntos INT, IN p_aciertos INT, IN p_errores INT
)
BEGIN
    DECLARE v_id_user INT;
    DECLARE v_id_song INT;
    START TRANSACTION;
    BEGIN
        DECLARE EXIT HANDLER FOR SQLEXCEPTION
        BEGIN
            ROLLBACK;
            INSERT INTO Auditoria (usuario_responsable, accion, detalle) 
            VALUES (p_usuario_nombre, 'ERROR_DB', 'Fallo de transacción al guardar puntaje');
        END;
        SELECT id_usuario INTO v_id_user FROM Usuarios WHERE nombre_usuario = p_usuario_nombre LIMIT 1;
        SELECT id_cancion INTO v_id_song FROM Canciones WHERE nombre_mostrar = p_cancion_nombre LIMIT 1;
        IF p_puntos < 0 OR v_id_user IS NULL OR v_id_song IS NULL THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Datos inconsistentes';
        ELSE
            INSERT INTO Puntuaciones (id_usuario, id_cancion, puntos, aciertos, errores)
            VALUES (v_id_user, v_id_song, p_puntos, p_aciertos, p_errores);
            COMMIT;
        END IF;
    END;
END //

-- SP RANKING
CREATE PROCEDURE sp_top_scores()
BEGIN
    SELECT * FROM vw_ranking_global ORDER BY puntos DESC LIMIT 5;
END //

DELIMITER ;

-- ==========================================================
-- 3. INSERTAR DATOS (AQUÍ ESTÁ LA MAGIA)
-- ==========================================================

INSERT INTO Roles (nombre_rol) VALUES ('Admin'), ('Jugador');

INSERT INTO Canciones (clave_interna, nombre_mostrar, info_dificultad, ruta_audio, ruta_video, velocidad, frecuencia) VALUES 
('tecno', 'Miku - Anamanaguchi', 'Normal', 'songs/Miku.mp3', 'https://drive.google.com/file/d/1QKtRg6QPRbDTaf_J7gdAkGO9HdxItuKT/view?usp=sharing', 1800, 128),
('andina', 'Zamarro y Campanilla - Jayac', 'Facil', 'songs/Jayac.mp3', 'https://drive.google.com/file/d/137I2uHq0NDp8y2fAO86S1H8X8N6H9F3q/view?usp=sharing', 2200, 105),
('rock', 'AC/DC - Thunderstruck', 'Difícil', 'songs/Thunderstruck.mp3', 'https://drive.google.com/file/d/1f6XFeBx-pY-TBLqOnwOSdbjTEdQMTy6c/view?usp=sharing', 1400, 134),
('epic', 'DragonForce - Fury', 'LEGENDARIO', 'songs/DragonFury.mp3', 'https://drive.google.com/file/d/1rMV3a68dAb6XNoqfZDZxkVDvSyn3uFSn/view?usp=sharing', 1000, 200);

-- --------------------------------------------------------------------------------
-- A. CREACIÓN MANUAL DEL ADMINISTRADOR (ROOT)
-- --------------------------------------------------------------------------------
INSERT INTO Usuarios (nombre_usuario, password_hash, id_rol) 
VALUES ('AdminMaster', '$2y$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', 1);

-- --------------------------------------------------------------------------------
-- B. CREACIÓN DE JUGADORES USANDO EL PROCEDIMIENTO ALMACENADO
-- Nota: Pasamos el hash de '12345' como argumento porque el SP espera la clave encriptada.
-- --------------------------------------------------------------------------------

-- Creando a Slash mediante SP
CALL sp_registrar_usuario('Slash', '$2y$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa');

-- Creando a KabuGamer mediante SP
CALL sp_registrar_usuario('KabuGamer', '$2y$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa');


-- ==========================================================
-- 4. FINALIZACIÓN (Triggers, Eventos y Permisos)
-- ==========================================================

DELIMITER //
CREATE TRIGGER trg_auditar_juego AFTER INSERT ON Puntuaciones
FOR EACH ROW
BEGIN
    DECLARE v_usuario VARCHAR(100);
    SELECT nombre_usuario INTO v_usuario FROM Usuarios WHERE id_usuario = NEW.id_usuario;
    INSERT INTO Auditoria (usuario_responsable, accion, detalle)
    VALUES (v_usuario, 'GAME_SAVED', CONCAT('Puntos: ', NEW.puntos));
END //
DELIMITER ;

CREATE EVENT evt_limpieza_auditoria ON SCHEDULE EVERY 1 WEEK
DO DELETE FROM Auditoria WHERE fecha_hora < NOW() - INTERVAL 30 DAY;

-- PERMISOS
CREATE USER IF NOT EXISTS 'app_dragon'@'localhost' IDENTIFIED BY 'musica123';
GRANT SELECT, INSERT ON DragonMusicDB.* TO 'app_dragon'@'localhost';
GRANT EXECUTE ON PROCEDURE DragonMusicDB.sp_login_usuario TO 'app_dragon'@'localhost';
GRANT EXECUTE ON PROCEDURE DragonMusicDB.sp_registrar_usuario TO 'app_dragon'@'localhost';
GRANT EXECUTE ON PROCEDURE DragonMusicDB.sp_top_scores TO 'app_dragon'@'localhost';
GRANT EXECUTE ON PROCEDURE DragonMusicDB.sp_guardar_puntaje_seguro TO 'app_dragon'@'localhost';

CREATE USER IF NOT EXISTS 'dba_admin'@'localhost' IDENTIFIED BY 'admin123';
GRANT ALL PRIVILEGES ON *.* TO 'dba_admin'@'localhost' WITH GRANT OPTION;

FLUSH PRIVILEGES;