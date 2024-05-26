$(document).ready(function() {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');
    const faceMessage = $('#faceMessage');
    const movementMessage = $('#movementMessage');
    const realPersonMessage = $('#realPersonMessage');
    let lastFace = null;
    let lastMovementCheckTime = 0;
    let consecutiveRealDetections = 0;
    let realEyeDetected = false;

    // Definir ponto central da tela
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const centralAreaSize = 120; // Tamanho da área central

    // Desenha um retângulo central na tela para visualização
    function drawCentralArea() {
        context.strokeStyle = '#00ff00';
        context.lineWidth = 2;
        context.strokeRect(centerX - centralAreaSize, centerY - centralAreaSize, centralAreaSize * 2, centralAreaSize * 2);
    }

    // Solicita acesso à câmera
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(function(stream) {
            video.srcObject = stream;
        })
        .catch(function(err) {
            console.error("Erro ao acessar a câmera: " + err);
        });

    $('#startButton').on('click', function() {
        startFaceDetection();
    });

    async function startFaceDetection() {
        console.log("Iniciando detecção de rostos...");
        try {
            const blazefaceModel = await blazeface.load();
            if (blazefaceModel) {
                console.log("Modelo Blazeface carregado com sucesso");
                detectFaces(blazefaceModel);
            } else {
                console.error("Falha ao carregar o modelo Blazeface");
            }
        } catch (error) {
            console.error("Erro ao carregar o modelo Blazeface: " + error);
        }
    }

    async function detectFaces(model) {
        const predictions = await model.estimateFaces(video, false);

        context.clearRect(0, 0, canvas.width, canvas.height);
        drawCentralArea(); // Desenha a área central

        if (predictions.length === 0) {
            faceMessage.text("Nenhum rosto detectado");
            lastFace = null;
            realPersonMessage.text("");
        } else {
            predictions.forEach(prediction => {
                const start = prediction.topLeft;
                const end = prediction.bottomRight;
                const size = [end[0] - start[0], end[1] - start[1]];

                context.strokeStyle = '#ff0000';
                context.lineWidth = 2;
                context.strokeRect(start[0], start[1], size[0], size[1]);
                console.log("Rosto detectado em: " + start[0] + ", " + start[1]);
                faceMessage.text("Rosto detectado");

                lastFace = {
                    x: start[0],
                    y: start[1],
                    width: size[0],
                    height: size[1],
                    landmarks: prediction.landmarks
                };
            });

            const currentTime = Date.now();
            if (lastFace && currentTime - lastMovementCheckTime >= 1000) {
                lastMovementCheckTime = currentTime;
                checkForMovement(lastFace);
                checkForReal(lastFace);  // Adicionando a verificação de olhos
            }
        }

        requestAnimationFrame(() => detectFaces(model));
    }

    function checkForMovement(face) {
        const initialPosition = { x: face.x, y: face.y, landmarks: face.landmarks };

        setTimeout(() => {
            if (!lastFace) {
                movementMessage.text("");
                realPersonMessage.text("");
                consecutiveRealDetections = 0;
                return;
            }

            const newPosition = { x: lastFace.x, y: lastFace.y, landmarks: lastFace.landmarks };

            if (newPosition.x !== initialPosition.x || newPosition.y !== initialPosition.y || detectLandmarkMovement(initialPosition.landmarks, newPosition.landmarks)) {
                console.log("Movimento detectado");
                movementMessage.text("Movimento detectado");
                
                $.ajax({
                    url: 'php/processar.php',
                    type: 'POST',
                    data: { action: 'movement_detected', timestamp: new Date().toISOString() },
                    success: function(response) {
                        console.log("Movimento registrado: " + response);
                    },
                    error: function(err) {
                        console.error("Erro ao registrar o movimento: " + err);
                    }
                });
                
                consecutiveRealDetections++;
                console.log("Detecções consecutivas de pessoa real: " + consecutiveRealDetections);
                if (consecutiveRealDetections >= 3 && realEyeDetected) {
                    realPersonMessage.text("Pessoa real detectada");
                } else {
                    realPersonMessage.text("Foto detectada");
                }
            } else {
                movementMessage.text("");
                realPersonMessage.text("Foto detectada");
                consecutiveRealDetections = 0;
            }
        }, 1000); // Aguarda 1 segundo antes de verificar novamente
    }

    function detectLandmarkMovement(initialLandmarks, newLandmarks) {
        if (initialLandmarks.length !== newLandmarks.length) return false;

        for (let i = 0; i < initialLandmarks.length; i++) {
            const initial = initialLandmarks[i];
            const current = newLandmarks[i];

            const movement = Math.sqrt(Math.pow(current[0] - initial[0], 2) + Math.pow(current[1] - initial[1], 2));
            if (movement > 1) {
                return true;
            }
        }

        return false;
    }

    function checkForReal(face) {
        const landmarks = face.landmarks;

        // Verifique se há pelo menos 6 pontos de referência
        if (!landmarks || landmarks.length < 6) {
            realEyeDetected = false;
            console.log("Real não detectada - pontos de referência insuficientes");
            return;
        }

        const leftEye = landmarks[0];
        const rightEye = landmarks[1];

        console.log("EYE:", leftEye, rightEye); // Verificar os pontos dos olhos

        if (isEyeValid(leftEye) && isEyeValid(rightEye)) {
            const leftEyeAspectRatio = calculateEyeAspectRatio(leftEye);
            const rightEyeAspectRatio = calculateEyeAspectRatio(rightEye);

            console.log("leftEyeAspectRatio, rightEyeAspectRatio: ", leftEyeAspectRatio, " , ", rightEyeAspectRatio);

            if (!isNaN(leftEyeAspectRatio) && !isNaN(rightEyeAspectRatio) && (leftEyeAspectRatio > 0.7 && leftEyeAspectRatio < 0.8 ) && (rightEyeAspectRatio > 0.45 && rightEyeAspectRatio < 0.55)) {  // Critério menos rigoroso para olhos
                realEyeDetected = true;
                console.log("Real detectada");
            } else {
                realEyeDetected = false;
            }
        } else {
            realEyeDetected = false;
            console.log("Real não detectada - pontos de referência inválidos para olhos");
        }
    }

    function isEyeValid(eye) {
        const [x, y] = eye;
        // Verifica se os pontos dos olhos estão dentro de uma área central predefinida
        return x > (centerX - centralAreaSize) && x < (centerX + centralAreaSize) && y > (centerY - centralAreaSize) && y < (centerY + centralAreaSize);
    }

    function calculateEyeAspectRatio(eye) {
        // Verifique se o olho tem pelo menos 2 pontos e se os valores são números
        if (eye.length < 2 || isNaN(eye[0]) || isNaN(eye[1])) {
            console.log("horizontal NaN");
            return NaN; // Retorna NaN para indicar que a razão de aspecto não pode ser calculada
        }

        // Considerando que eye é um array [x, y]
        const [x, y] = eye;
        const vertical = Math.abs(y);
        const horizontal = Math.abs(x);

        // Verifique se horizontal é 0 para evitar divisão por zero
        if (horizontal === 0) {
            console.log("horizontal 0");
            return NaN;
        }

        return vertical / horizontal;
    }
});
