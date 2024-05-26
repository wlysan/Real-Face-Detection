<?php
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "movimento";


// Conexão com o banco de dados
$conn = new mysqli($servername, $username, $password, $dbname);

// Verifica a conexão
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['action']) && $_POST['action'] == 'movement_detected') {
    $timestamp = $_POST['timestamp'];

    $sql = "INSERT INTO movimentos (timestamp) VALUES ('$timestamp')";

    if ($conn->query($sql) === TRUE) {
        echo "Movimento registrado com sucesso";
    } else {
        echo "Erro: " . $sql . "<br>" . $conn->error;
    }
}

$conn->close();
?>
