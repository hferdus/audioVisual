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

        function draw() {
            requestAnimationFrame(draw);

            analyser.getByteTimeDomainData(dataArray);

            // Clear the canvas
            canvasCtx.fillStyle = 'rgb(17, 17, 17)';
            canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

            drawWaveform(dataArray);
        }

        function drawWaveform(dataArray) {
            const sliceWidth = canvas.width * 1.0 / bufferLength;

            // Randomize the color
            const r = Math.floor(Math.random() * 256);
            const g = Math.floor(Math.random() * 256);
            const b = Math.floor(Math.random() * 256);
            canvasCtx.strokeStyle = `rgb(${r},${g},${b})`;

            canvasCtx.lineWidth = 2;
            canvasCtx.beginPath();

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

            // Overlapping lines
            for (let j = 0; j < 2; j++) {
                const offsetX = Math.random() * 20 - 10;
                const offsetY = Math.random() * 20 - 10;

                canvasCtx.strokeStyle = `rgba(${r},${g},${b}, 0.5)`;
                canvasCtx.beginPath();

                x = 0;
                for (let i = 0; i < bufferLength; i++) {
                    const v = dataArray[i] / 128.0;
                    const y = v * canvas.height / 2 + offsetY;

                    if (i === 0) {
                        canvasCtx.moveTo(x + offsetX, y);
                    } else {
                        canvasCtx.lineTo(x + offsetX, y);
                    }

                    x += sliceWidth;
                }

                canvasCtx.lineTo(canvas.width, canvas.height / 2 + offsetY);
                canvasCtx.stroke();
            }
        }

        draw();
    }
});
