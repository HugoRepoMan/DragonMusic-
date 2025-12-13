<?php
session_start();
include 'includes/db.php';

if ($_SERVER["REQUEST_METHOD"] == "POST" && isset($_SESSION['id_usuario'])) {

    $cancionNombre = $_POST['cancion'];
    $q = "SELECT id_cancion FROM Canciones WHERE nombre_mostrar = '$cancionNombre'";
    $res = $conn->query($q);
    $row = $res->fetch_assoc();
    $id_cancion = $row['id_cancion'];

    $stmt = $conn->prepare("INSERT INTO Puntuaciones (id_usuario, id_cancion, puntos, aciertos, errores) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("iiiii", $_SESSION['id_usuario'], $id_cancion, $_POST['puntaje'], $_POST['aciertos'], $_POST['errores']);
    
    if ($stmt->execute()) { echo "ok"; } else { echo "error"; }
}
?>