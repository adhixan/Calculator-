const display = document.getElementById("display");
const micBtn = document.getElementById("micBtn");
const canvas = document.getElementById("waveform");
const ctx = canvas.getContext("2d");

let recognition;

/* 🔊 Speak */
function speak(text) {
  const msg = new SpeechSynthesisUtterance(text);
  msg.lang = "en-IN";
  speechSynthesis.speak(msg);
}

/* ➕ Press */
function press(val) {
  display.innerText = display.innerText === "0" ? val : display.innerText + val;
}

function clearDisplay() {
  display.innerText = "0";
  speak("Cleared");
}

/* 🧮 Calculate */
function calculate() {
  try {
    let exp = display.innerText
      .replace(/×/g, "*")
      .replace(/÷/g, "/");
    let result = Function("return " + exp)();
    display.innerText = result;
    speak("Result is " + result);
  } catch {
    display.innerText = "Error";
    speak("Invalid calculation");
  }
}

/* 🔢 Scientific Functions */
function applyFunction(type) {
  let val = parseFloat(display.innerText);
  let result;

  if (type === "sqrt") result = Math.sqrt(val);
  if (type === "square") result = val * val;

  display.innerText = result;
  speak("Result is " + result);
}

/* 🎤 Voice Recognition */
function startVoice() {
  if (!("webkitSpeechRecognition" in window)) {
    alert("Use Google Chrome for voice input");
    return;
  }

  recognition = new webkitSpeechRecognition();
  recognition.lang = "en-IN";
  recognition.onstart = () => micBtn.classList.add("listening");
  recognition.onend = () => micBtn.classList.remove("listening");

  recognition.onresult = (e) => {
    let text = e.results[0][0].transcript.toLowerCase();
    handleVoice(text);
  };

  recognition.start();
}

/* 🧠 Smart Voice Parser */
function handleVoice(text) {
  text = text
    .replace(/plus/g, "+")
    .replace(/minus/g, "-")
    .replace(/(times|multiply|multiplied|into)/g, "*")
    .replace(/(divide|divided|by|over)/g, "/")
    .replace(/square root of/g, "Math.sqrt")
    .replace(/square of/g, "**2")
    .replace(/sin/g, "Math.sin")
    .replace(/cos/g, "Math.cos")
    .replace(/tan/g, "Math.tan")
    .replace(/factorial of (\d+)/g, (_, n) => factorial(n));

  try {
    let result = Function("return " + text)();
    display.innerText = result;
    speak("Result is " + result);
  } catch {
    display.innerText = "Error";
    speak("Sorry, I didn't understand");
  }
}

/* ❗ Factorial */
function factorial(n) {
  let f = 1;
  for (let i = 1; i <= n; i++) f *= i;
  return f;
}
