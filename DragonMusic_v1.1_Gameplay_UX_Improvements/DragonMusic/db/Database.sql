-- ==========================================================
-- 1. DDL: DEFINICIÓN DE ESTRUCTURA Y NORMALIZACIÓN
-- ==========================================================

-- Crear la Base de Datos
DROP DATABASE IF EXISTS DragonMusicDB;
CREATE DATABASE DragonMusicDB CHARACTER SET utf8 COLLATE utf8_general_ci;
USE DragonMusicDB;

-- TABLA DE ROLES (Cumple 2FN: Eliminamos redundancia de nombres de rol)
CREATE TABLE Roles (
    id_rol INT AUTO_INCREMENT PRIMARY KEY,
    nombre_rol VARCHAR(50) NOT NULL UNIQUE -- Ej: 'Admin', 'Jugador'
);

-- TABLA DE CANCIONES (Cumple 3FN: Separamos datos de canciones para no repetirlos en puntajes)
CREATE TABLE Canciones (
    id_cancion INT AUTO_INCREMENT PRIMARY KEY,
    clave_interna VARCHAR(50) UNIQUE, -- Ej: 'rock'
    nombre_mostrar VARCHAR(100) NOT NULL,
    info_dificultad VARCHAR(50),
    ruta_audio VARCHAR(255),
    ruta_video VARCHAR(255),
    velocidad INT,
    frecuencia INT
);

-- TABLA DE USUARIOS (1FN: Datos atómicos)
CREATE TABLE Usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre_usuario VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    id_rol INT NOT NULL,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    -- Integridad Referencial (Foreign Key)
    CONSTRAINT fk_usuario_rol FOREIGN KEY (id_rol) REFERENCES Roles(id_rol)
);

-- TABLA DE PUNTUACIONES (Tabla de Hechos para el Modelo Estrella)
CREATE TABLE Puntuaciones (
    id_score INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_cancion INT NOT NULL,
    puntos INT NOT NULL,
    aciertos INT NOT NULL,
    errores INT NOT NULL,
    fecha_juego DATETIME DEFAULT CURRENT_TIMESTAMP,
    -- Relaciones
    CONSTRAINT fk_score_usuario FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario),
    CONSTRAINT fk_score_cancion FOREIGN KEY (id_cancion) REFERENCES Canciones(id_cancion)
);

-- TABLA DE AUDITORÍA (Requerimiento Específico)
CREATE TABLE Auditoria (
    id_log INT AUTO_INCREMENT PRIMARY KEY,
    usuario_responsable VARCHAR(100), -- Guardamos nombre por si se borra el usuario
    accion VARCHAR(50) NOT NULL,      -- LOGIN, INSERT, DELETE
    detalle TEXT,
    fecha_hora DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================================
-- 2. DML: DATOS INICIALES (SEMILLA)
-- ==========================================================

INSERT INTO Roles (nombre_rol) VALUES ('Admin'), ('Jugador');

-- Canciones (Rutas a Google Drive o Locales)
INSERT INTO Canciones (clave_interna, nombre_mostrar, info_dificultad, ruta_audio, ruta_video, velocidad, frecuencia) VALUES 
(
    'tecno', 
    'Miku - Anamanaguchi', 
    'Normal', 
    'songs/Miku.mp3', 
    'https://drive.google.com/file/d/1QKtRg6QPRbDTaf_J7gdAkGO9HdxItuKT/view?usp=sharing', 
    1800, 
    700
),
(
    'andina', 
    'Miku - Anamanaguchi', 
    'Facil', 
    'songs/Jayac.mp3', 
    'https://drive.google.com/file/d/137I2uHq0NDp8y2fAO86S1H8X8N6H9F3q/view?usp=sharing', 
    2200, 
    850
),
(
    'rock', 
    'AC/DC - Thunderstruck', 
    'Difícil', 
    'songs/Thunderstruck.mp3', 
    'https://drive.google.com/file/d/1f6XFeBx-pY-TBLqOnwOSdbjTEdQMTy6c/view?usp=sharing', 
    1400, 
    500
),
(
    'epic', 
    'DragonForce - Fury', 
    'LEGENDARIO', 
    'songs/DragonFury.mp3', 
    'https://drive.google.com/file/d/1rMV3a68dAb6XNoqfZDZxkVDvSyn3uFSn/view?usp=sharing', 
    1000, 
    300
);

-- Usuarios de Prueba (Admin pass: 12345, Jugador pass: guitar)
INSERT INTO Usuarios (nombre_usuario, password_hash, id_rol) VALUES 
('AdminMaster', '12345', 1),
('Slash', 'guitar', 2);

-- ==========================================================
-- 3. OPTIMIZACIÓN: ÍNDICES
-- ==========================================================

-- Índice para acelerar el Login (Búsqueda por nombre)
CREATE INDEX idx_nombre_user ON Usuarios(nombre_usuario);

-- Índice para acelerar la Tabla de Posiciones (Ordenar por puntos)
CREATE INDEX idx_puntos_desc ON Puntuaciones(puntos DESC);

-- ==========================================================
-- 4. PROCEDIMIENTOS ALMACENADOS (Stored Procedures)
-- ==========================================================

DELIMITER //

-- SP para Registrar Login y Auditarlo
CREATE PROCEDURE sp_login_usuario(IN p_usuario VARCHAR(100))
BEGIN
    DECLARE v_id INT;
    
    SELECT id_usuario INTO v_id FROM Usuarios WHERE nombre_usuario = p_usuario;
    
    IF v_id IS NOT NULL THEN
        -- Insertar en Auditoría
        INSERT INTO Auditoria (usuario_responsable, accion, detalle) 
        VALUES (p_usuario, 'LOGIN', 'Ingreso exitoso al sistema');
        
        -- Devolver datos
        SELECT * FROM Usuarios WHERE id_usuario = v_id;
    ELSE
        INSERT INTO Auditoria (usuario_responsable, accion, detalle) 
        VALUES (p_usuario, 'LOGIN_FAIL', 'Intento fallido: Usuario no existe');
    END IF;
END //

-- SP para Top 5 (Reporte)
CREATE PROCEDURE sp_top_scores()
BEGIN
    SELECT u.nombre_usuario, c.nombre_mostrar, p.puntos 
    FROM Puntuaciones p
    JOIN Usuarios u ON p.id_usuario = u.id_usuario
    JOIN Canciones c ON p.id_cancion = c.id_cancion
    ORDER BY p.puntos DESC 
    LIMIT 5;
END //

DELIMITER ;

-- ==========================================================
-- 5. TRIGGERS (DISPARADORES DE AUDITORÍA)
-- ==========================================================

DELIMITER //

-- Trigger: Auditar nuevo puntaje automáticamente
CREATE TRIGGER trg_auditar_juego
AFTER INSERT ON Puntuaciones
FOR EACH ROW
BEGIN
    DECLARE v_usuario VARCHAR(100);
    SELECT nombre_usuario INTO v_usuario FROM Usuarios WHERE id_usuario = NEW.id_usuario;

    INSERT INTO Auditoria (usuario_responsable, accion, detalle)
    VALUES (v_usuario, 'GAME_SAVED', CONCAT('Puntos: ', NEW.puntos, ' | Aciertos: ', NEW.aciertos));
END //

-- Trigger: Auditar eliminación de puntaje (Seguridad)
CREATE TRIGGER trg_auditar_borrado
BEFORE DELETE ON Puntuaciones
FOR EACH ROW
BEGIN
    INSERT INTO Auditoria (usuario_responsable, accion, detalle)
    VALUES (CURRENT_USER(), 'DELETE_SCORE', CONCAT('Se borró puntaje ID: ', OLD.id_score));
END //

DELIMITER ;

-- ==========================================================
-- 6. DCL: SEGURIDAD Y USUARIOS DE BASE DE DATOS
-- ==========================================================
-- Crea usuarios específicos para no usar siempre 'root'

-- Usuario para la Aplicación Web (Solo puede usar SPs y leer tablas)
CREATE USER 'app_dragon'@'localhost' IDENTIFIED BY 'musica123';
GRANT SELECT, INSERT ON DragonMusicDB.* TO 'app_dragon'@'localhost';
GRANT EXECUTE ON PROCEDURE DragonMusicDB.sp_login_usuario TO 'app_dragon'@'localhost';
GRANT EXECUTE ON PROCEDURE DragonMusicDB.sp_top_scores TO 'app_dragon'@'localhost';

-- Usuario DBA (Control total)
CREATE USER 'dba_admin'@'localhost' IDENTIFIED BY 'admin123';
GRANT ALL PRIVILEGES ON *.* TO 'dba_admin'@'localhost' WITH GRANT OPTION;

FLUSH PRIVILEGES;