document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('audioFile');
    const canvas = document.getElementById('visualizer');
    const canvasCtx = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    fileInput.addEventListener('change', handleFile, false);

    function handleFile(event) {
        const file = event.target.files[0];
        if (file) {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const reader = new FileReader();

            reader.onload = function(event) {
                audioContext.decodeAudioData(event.target.result, function(buffer) {
                    const source = audioContext.createBufferSource();
                    source.buffer = buffer;

                    const analyser = audioContext.createAnalyser();
                    analyser.fftSize = 2048;

                    source.connect(analyser);
                    analyser.connect(audioContext.destination);

                    source.start(0);
                    visualize(analyser);
                }, function(error) {
                    console.error('Error decoding audio data:', error);
                });
            };

            reader.readAsArrayBuffer(file);
        } else {
            console.error('No file selected');
        }
    }

    function visualize(analyser) {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        let lastSwitch = Date.now();
        let currentVisualization = 0;

        const visualizations = [drawWaveform, drawKaleidoscope, drawAbstract];

        function draw() {
            requestAnimationFrame(draw);

            analyser.getByteTimeDomainData(dataArray);

            canvasCtx.fillStyle = 'rgb(17, 17, 17)';
            canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

            if (Date.now() - lastSwitch > 5000) {
                currentVisualization = (currentVisualization + 1) % visualizations.length;
                lastSwitch = Date.now();
            }

            visualizations[currentVisualization](dataArray);
        }

        function drawWaveform(dataArray) {
            canvasCtx.lineWidth = 2;
            canvasCtx.strokeStyle = 'rgb(0, 255, 0)';

            canvasCtx.beginPath();

            const sliceWidth = canvas.width * 1.0 / bufferLength;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0;
                const y = v * canvas.height / 2;

                if (i === 0) {
                    canvasCtx.moveTo(x, y);
                } else {
                    canvasCtx.lineTo(x, y);
                }

                x += sliceWidth;
            }

            canvasCtx.lineTo(canvas.width, canvas.height / 2);
            canvasCtx.stroke();
        }

        function drawKaleidoscope(dataArray) {
            const radius = Math.min(canvas.width, canvas.height) / 4;
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;

            for (let i = 0; i < bufferLength; i++) {
                const angle = (i / bufferLength) * Math.PI * 2;
                const v = dataArray[i] / 128.0;
                const length = v * radius;

                const x = centerX + length * Math.cos(angle);
                const y = centerY + length * Math.sin(angle);

                canvasCtx.strokeStyle = `hsl(${(i / bufferLength) * 360}, 100%, 50%)`;
                canvasCtx.beginPath();
                canvasCtx.moveTo(centerX, centerY);
                canvasCtx.lineTo(x, y);
                canvasCtx.stroke();
            }
        }

        function drawAbstract(dataArray) {
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;

            for (let i = 0; i < bufferLength; i++) {
                const angle = (i / bufferLength) * Math.PI * 2;
                const v = dataArray[i] / 128.0;
                const length = v * 50;

                const x = centerX + length * Math.cos(angle);
                const y = centerY + length * Math.sin(angle);

                canvasCtx.fillStyle = `hsl(${(i / bufferLength) * 360}, 100%, 50%)`;
                canvasCtx.beginPath();
                canvasCtx.arc(x, y, 5, 0, Math.PI * 2);
                canvasCtx.fill();
            }
        }

        draw();
    }
});
