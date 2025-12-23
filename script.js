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
  if (display.innerText === "0") display.innerText = val;
  else display.innerText += val;
}

function clearDisplay() {
  display.innerText = "0";
  speak("Cleared");
}

/* 🔁 Normalize expression */
function normalizeExpression(exp) {
  return exp
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/−/g, "-")
    .replace(/%/g, "/100");
}

/* 🧮 Calculate */
function calculate() {
  try {
    let exp = normalizeExpression(display.innerText);
    let result = Function("return " + exp)();
    display.innerText = result;
    speak("Result is " + result);
  } catch {
    display.innerText = "Error";
    speak("Invalid calculation");
  }
}

/* 🔢 Scientific Buttons */
function applyFunc(type) {
  let value = parseFloat(display.innerText);
  let result;

  if (isNaN(value)) {
    display.innerText = "Error";
    return;
  }

  switch (type) {
    case "sqrt":
      result = Math.sqrt(value);
      break;
    case "square":
      result = value * value;
      break;
    case "sin":
      result = Math.sin(value * Math.PI / 180);
      break;
    case "cos":
      result = Math.cos(value * Math.PI / 180);
      break;
    case "tan":
      result = Math.tan(value * Math.PI / 180);
      break;
    case "fact":
      result = factorial(value);
      break;
    default:
      return;
  }

  display.innerText = result;
  speak("Result is " + result);
}

/* ❗ Factorial */
function factorial(n) {
  if (n < 0 || !Number.isInteger(n)) return "Error";
  let f = 1;
  for (let i = 1; i <= n; i++) f *= i;
  return f;
}

/* 🎤 Voice Recognition */
function startVoice() {
  if (!("webkitSpeechRecognition" in window)) {
    alert("Voice input works only in Google Chrome");
    return;
  }

  recognition = new webkitSpeechRecognition();
  recognition.lang = "en-IN";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => micBtn.classList.add("listening");
  recognition.onend = () => micBtn.classList.remove("listening");

  recognition.onresult = (e) => {
    let text = e.results[0][0].transcript.toLowerCase();
    parseVoice(text);
  };

  recognition.start();
}

/* 🧠 Smart Voice Parser */
function parseVoice(text) {
  text = text
    .replace(/percentage/g, "%")
    .replace(/plus/g, "+")
    .replace(/minus/g, "-")
    .replace(/(times|multiply|multiplied|into)/g, "*")
    .replace(/(divide|divided|by|over)/g, "/")
    .replace(/square root of/g, "Math.sqrt")
    .replace(/square of/g, "**2")
    .replace(/sin/g, "Math.sin")
    .replace(/cos/g, "Math.cos")
    .replace(/tan/g, "Math.tan")
    .replace(/factorial of (\d+)/g, (_, n) => factorial(Number(n)));

  try {
    let result = Function("return " + text)();
    display.innerText = result;
    speak("Result is " + result);
  } catch {
    display.innerText = "Error";
    speak("Sorry, I did not understand");
  }
}
