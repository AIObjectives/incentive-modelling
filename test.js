function output() {
  console.log("START RECORDING");
  window._doneRecording = false;
  const timer = document.querySelector(
    '[data-component-key-value="clocktimelabel"] div'
  );
  let seconds = 0;
  let minutes = 5;
  const pad = (x) => (x < 10 ? `0${x}` : `${x}`);
  if (window._interval123) clearInterval(window._interval123);
  window._interval123 = setInterval(() => {
    seconds--;
    if (seconds < 0) {
      seconds = 59;
      minutes--;
    }
    timer.innerText = `${pad(minutes)}:${pad(seconds)}`;
  }, 1000);
  navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
    // WAVELET
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    const mediaStreamSource = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    mediaStreamSource.connect(analyser);

    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const canvas = document.getElementById("waveformCanvas");
    const canvasContext = canvas.getContext("2d");
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    function drawWaveform() {
      analyser.getByteTimeDomainData(dataArray);

      canvasContext.fillStyle = "#f3f3f3";
      canvasContext.fillRect(0, 0, canvasWidth, canvasHeight);

      canvasContext.lineWidth = 2;
      canvasContext.strokeStyle = "#4caf50";
      canvasContext.beginPath();

      const sliceWidth = (canvasWidth * 1.0) / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvasHeight) / 2;

        if (i === 0) {
          canvasContext.moveTo(x, y);
        } else {
          canvasContext.lineTo(x, y);
        }

        x += sliceWidth;
      }

      canvasContext.lineTo(canvas.width, canvas.height / 2);
      canvasContext.stroke();

      requestAnimationFrame(drawWaveform);
    }
    drawWaveform();

    // FUNCTION TO CALL WHISPER
    const transcribe = async (audio) => {
      console.log("START TRANSCRIPTION", audio);

      const formData = new FormData();
      formData.append("model", "whisper-1");
      formData.append("file", audio);
      const url = "https://api.openai.com/v1/audio/transcriptions";
      const options = {
        method: "POST",
        headers: {
          // 'Content-Type':  'multipart/form-data',
          Authorization: "Bearer {{aoi-openai-api_key}}",
        },
        body: formData,
      };
      const response = await fetch(
        `https://savvy-api-proxy-secure.heysavvy.workers.dev/?url=${encodeURIComponent(
          url
        )}`,
        options
      );
      const data = await response.json();
      console.log("TRANSCRIBED DATA", { data });
    };

    // RECORDING BLOB...
    const mediaRecorder = new MediaRecorder(stream);
    const chunks = [];
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };
    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(chunks, { type: "audio/wav" });
      const audioFile = new File([audioBlob], "audio.webm", {
        type: "audio/webm;",
      });
      transcribe(audioFile);
    };
    mediaRecorder.start();
    const interval716 = setInterval(() => {
      if (window._doneRecording) mediaRecorder.stop();
    }, 100);
    setTimeout(() => {
      clearInterval(interval716);
      mediaRecorder.stop();
    }, 5 * 60 * 1000);
  });
}
