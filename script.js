const display = document.getElementById("display");
const micBtn = document.getElementById("micBtn");

let recognition;

/* 🔊 Speak */
function speak(text) {
  speechSynthesis.cancel();
  const msg = new SpeechSynthesisUtterance(text);
  msg.lang = "en-IN";
  speechSynthesis.speak(msg);
}

/* ➕ Input */
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
    const result = Function("return " + display.innerText)();
    display.innerText = result;
    speak("Result is " + result);
  } catch {
    display.innerText = "Error";
    speak("Invalid calculation");
  }
}

/* 🔢 Scientific Functions */
function applyFunc(type) {
  let v = parseFloat(display.innerText);
  let r;

  switch (type) {
    case "sqrt": r = Math.sqrt(v); break;
    case "square": r = v * v; break;
    case "sin": r = Math.sin(v * Math.PI / 180); break;
    case "cos": r = Math.cos(v * Math.PI / 180); break;
    case "tan": r = Math.tan(v * Math.PI / 180); break;
    case "fact": r = factorial(v); break;
  }

  display.innerText = r;
  speak("Result is " + r);
}

/* ❗ Factorial */
function factorial(n) {
  if (n < 0) return "Error";
  let f = 1;
  for (let i = 1; i <= n; i++) f *= i;
  return f;
}

/* 🎤 Voice Recognition (FIXED) */
function startVoice() {
  if (!("webkitSpeechRecognition" in window)) {
    alert("Chrome required for voice input");
    return;
  }

  recognition = new webkitSpeechRecognition();
  recognition.lang = "en-IN";
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onstart = () => micBtn.classList.add("listening");

  recognition.onend = () => micBtn.classList.remove("listening");

  recognition.onresult = (e) => {
    let text = e.results[e.results.length - 1][0].transcript;
    parseVoice(text.toLowerCase());
  };

  recognition.start();
}

/* 🧠 SMART VOICE NORMALIZER */
function parseVoice(text) {
  const map = {
    "plus": "+",
    "minus": "-",
    "add": "+",
    "into": "*",
    "multiply": "*",
    "multiplied": "*",
    "times": "*",
    "divide": "/",
    "divided": "/",
    "by": "/",
    "square root": "Math.sqrt",
    "square": "**2",
    "sin": "Math.sin",
    "cos": "Math.cos",
    "tan": "Math.tan",
    "factorial": "factorial"
  };

  Object.keys(map).forEach(k => {
    text = text.replaceAll(k, map[k]);
  });

  text = text.replace(/[^0-9+\-*/().! ]/g, "");

  try {
    const result = Function("return " + text)();
    display.innerText = result;
    speak("Result is " + result);
    recognition.stop();
  } catch {
    // ignore interim errors
  }
}
