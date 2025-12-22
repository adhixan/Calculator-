const display = document.getElementById("display");
const canvas = document.getElementById("waveform");
const ctx = canvas.getContext("2d");
const micBtn = document.getElementById("micBtn");

let recognition;
let listening = false;

/* 🔊 Speech output */
function speak(text) {
  if (!window.speechSynthesis) return;
  const msg = new SpeechSynthesisUtterance(text);
  msg.lang = "en-IN";
  window.speechSynthesis.speak(msg);
}

/* 🧮 Calculator logic */
function press(value) {
  display.innerText = display.innerText === "0" ? value : display.innerText + value;
}

function clearDisplay() {
  display.innerText = "0";
  speak("Cleared");
}

function calculate() {
  try {
    let exp = display.innerText.replace(/×/g, "*").replace(/÷/g, "/");
    let result = Function("return " + exp)();
    display.innerText = result;
    speak("Result is " + result);
  } catch {
    display.innerText = "Error";
    speak("Error");
  }
}

/* 🌊 Wave animation */
let animationId;
function drawWave() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  ctx.strokeStyle = "#818cf8";
  ctx.lineWidth = 2;

  for (let i = 0; i < canvas.width; i++) {
    let y = 20 + Math.sin(i * 0.05 + Date.now() * 0.01) * 12;
    ctx.lineTo(i, y);
  }
  ctx.stroke();
  animationId = requestAnimationFrame(drawWave);
}

/* 🎤 Voice Input */
function startVoice() {
  if (!('webkitSpeechRecognition' in window)) {
    alert("Voice input works only in Google Chrome");
    return;
  }

  if (!recognition) {
    recognition = new webkitSpeechRecognition();
    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      listening = true;
      micBtn.classList.add("listening");
      canvas.classList.add("active");
      drawWave();
      speak("Listening");
    };

    recognition.onresult = (e) => {
      let text = e.results[0][0].transcript.toLowerCase();

      text = text
        .replace(/plus/g, "+")
        .replace(/minus/g, "-")
        .replace(/times|multiply/g, "*")
        .replace(/divide|by/g, "/");

      display.innerText = text;
      calculate();
    };

    recognition.onend = () => {
      listening = false;
      micBtn.classList.remove("listening");
      canvas.classList.remove("active");
      cancelAnimationFrame(animationId);
    };
  }

  if (!listening) recognition.start();
}
