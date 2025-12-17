Dragon Music es un videojuego web de ritmo desarrollado en PHP, JavaScript y MySQL, donde los usuarios pueden iniciar sesión, jugar canciones rítmicas y registrar sus puntajes en una base de datos, con control de usuarios y auditoría de accesos.

El proyecto está diseñado siguiendo principios de **modularidad**.

Funcionalidades principales

- Registro e inicio de sesión de usuarios
- Juego de ritmo interactivo en el navegador
- Registro de puntajes por canción
- Gestión de roles (usuario / administrador)
- Auditoría de accesos al sistema
- Persistencia de datos en MySQL
- Código modular (PHP, CSS y JS separados)

Tecnologías que se han utilizado
  
- **Frontend:** HTML5, CSS3, JavaScript, jQuery  
- **Backend:** PHP  
- **Base de datos:** MySQL  
- **Gestión de BD:** phpMyAdmin  
- **Servidor local:** XAMPP

Media para el guardado de las cancines
  https://drive.google.com/drive/folders/15zjYxA7P8l5oSvc-_WHfNMCtM0m5cZK0

Ejecución del proyecto desde XAMPP
  A continuación se detallan los pasos para ejecutar correctamente el proyecto **Dragon Music** utilizando **XAMPP** en un entorno local.

Instalar XAMPP
  Si no lo tienes instalado:
  
  1. Descarga XAMPP desde:  
     https://www.apachefriends.org
  2. Instálalo siguiendo las opciones por defecto.
```text
   C:\xampp\htdocs\
```
  3. Entra a la carpeta
  4. Copia la carpeta del proyecto dentro de htdocs, debería quedar de esta manera.
```text
   C:\xampp\htdocs\DragonMusic
```
xammp como ejecutador
1. Abre el programa XAMMP e inicia apache y Mysql.
   Sigue con los pasos de la creación de la base de datos.


 Crea la base de datos en phpMyAdmin
1. Abre el navegador y accede a
   http://localhost/phpmyadmin ---> Dependiendo de tu puerto en este caso, 80.
2. Haz clic en Nueva para la creación de la base de datos.
   Crea una base de datos con el nombre 'dragonmusicdb'
3. Importa el archivo Database.sql del proyecto dentro de la carpeta 'db' dónde se encuentran tablas, procedimientos y datos.

Ejecutar el proyecto
  En el navegador aparte del phpmyadmin abre:
  http://localhost/DragonMusic/login.php
  Desde ahí podrás:
    - Crear una cuenta
    - Iniciar sesión
    - Acceder al juego

Notas finales
El proyecto fue desarrollado con fines **educativos**.
Se recomienda ejecutar el sistema únicamente en **entorno local**.

Autores

Proyecto desarrollado por

- **HugoRepoMan**
- **ShadyNico**

Como parte de una práctica educativo de base de datos, programación y desarrollo web.

---

© Dragon Music – Proyect

