<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Face and Movement Detection</title>
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
    <style>
        #videoContainer {
            position: relative;
            width: 640px;
            height: 480px;
        }
        #video, #canvas {
            position: absolute;
            top: 0;
            left: 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Detecção de Rosto e Movimento</h1>
        <div id="videoContainer">
            <video id="video" width="640" height="480" autoplay></video>
            <canvas id="canvas" width="640" height="480"></canvas>
        </div>
        <button id="startButton" class="btn btn-primary">Iniciar Detecção</button>
        <div id="faceMessage" class="alert alert-info mt-3"></div>
        <div id="movementMessage" class="alert alert-warning mt-3"></div>
        <div id="realPersonMessage" class="alert alert-success mt-3"></div>
    </div>
    <script src="https://code.jquery.com/jquery-3.5.1.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs"></script>
    <script src="https://cdn.jsdelivr.net/npm/@tensorflow-models/blazeface"></script>
    <script src="js/script.js"></script>
</body>
</html>
