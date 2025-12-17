<?php
include 'includes/db.php';
header('Content-Type: application/json');

$sql = "CALL sp_top_scores()";
$result = $conn->query($sql);

$scores = [];
while($row = $result->fetch_assoc()) {
    $scores[] = $row;
}
echo json_encode($scores);
?>