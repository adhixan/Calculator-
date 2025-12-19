const display = document.getElementById("display");
const canvas = document.getElementById("waveform");
const ctx = canvas.getContext("2d");
const micBtn = document.getElementById("micBtn");

function speak(text) {
  const msg = new SpeechSynthesisUtterance(text);
  msg.lang = "en-IN";
  window.speechSynthesis.speak(msg);
}

function press(value) {
  if (display.innerText === "0") {
    display.innerText = value;
  } else {
    display.innerText += value;
  }
}

function clearDisplay() {
  display.innerText = "0";
  speak("Cleared");
}

function calculate() {
  try {
    let expression = display.innerText.replace(/×/g, "*").replace(/÷/g, "/");
    let result = Function("return " + expression)();
    display.innerText = result;
    speak("Result is " + result);
  } catch {
    display.innerText = "Error";
    speak("Error");
  }
}

// --- Voice Graph Logic ---
let animationId;
function drawWave() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#818cf8";
  ctx.lineWidth = 2;
  ctx.beginPath();
  
  for (let i = 0; i < canvas.width; i++) {
    const y = 20 + Math.sin(i * 0.05 + Date.now() * 0.01) * Math.random() * 15;
    ctx.lineTo(i, y);
  }
  ctx.stroke();
  animationId = requestAnimationFrame(drawWave);
}

function startVoice() {
  const Recognition = window.webkitSpeechRecognition || window.SpeechRecognition;
  if (!Recognition) {
    alert("Voice input not supported in this browser.");
    return;
  }

  const recognition = new Recognition();
  recognition.lang = "en-IN";

  recognition.onstart = () => {
    micBtn.classList.add("listening");
    canvas.classList.add("active");
    drawWave();
    speak("Listening");
  };

  recognition.onresult = (event) => {
    let text = event.results[0][0].transcript.toLowerCase();
    text = text.replace(/plus/g, "+")
               .replace(/minus/g, "-")
               .replace(/times|multiply/g, "*")
               .replace(/divide/g, "/");
    
    display.innerText = text;
    calculate(); // Automatically calculate after voice input
  };

  recognition.onend = () => {
    micBtn.classList.remove("listening");
    canvas.classList.remove("active");
    cancelAnimationFrame(animationId);
  };

  recognition.start();
}
