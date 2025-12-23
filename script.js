const display = document.getElementById("display");
const micBtn = document.getElementById("micBtn");

let recognition;

/* 🔊 SPEAK */
function speak(text) {
  speechSynthesis.cancel();
  const msg = new SpeechSynthesisUtterance(text);
  msg.lang = "en-IN";
  speechSynthesis.speak(msg);
}

/* ➕ BUTTON INPUT */
function press(val) {
  if (display.innerText === "0") display.innerText = val;
  else display.innerText += val;
}

/* 🧹 CLEAR */
function clearDisplay() {
  display.innerText = "0";
  speak("Cleared");
}

/* ❗ FACTORIAL */
function factorial(n) {
  n = Math.floor(n);
  if (n < 0) return NaN;
  let f = 1;
  for (let i = 1; i <= n; i++) f *= i;
  return f;
}

/* 🧼 SANITIZE */
function sanitize(exp) {
  return exp
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/π/g, "Math.PI");
}

/* 🧮 CALCULATE (USED BY BUTTON + VOICE) */
function calculateExpression(exp) {
  exp = sanitize(exp);
  const result = eval(exp);

  if (result === undefined || isNaN(result)) throw "Invalid";
  return result;
}

/* 🧮 = BUTTON */
function calculate() {
  try {
    const result = calculateExpression(display.innerText);
    display.innerText = result;
    speak("Result is " + result);
  } catch {
    display.innerText = "Error";
    speak("Invalid calculation");
  }
}

/* 🔢 SCIENTIFIC BUTTONS */
function applyFunc(type) {
  let exp = display.innerText;

  switch (type) {
    case "sqrt":
      exp = `Math.sqrt(${exp})`;
      break;
    case "square":
      exp = `(${exp})**2`;
      break;
    case "sin":
      exp = `Math.sin((${exp})*Math.PI/180)`;
      break;
    case "cos":
      exp = `Math.cos((${exp})*Math.PI/180)`;
      break;
    case "tan":
      exp = `Math.tan((${exp})*Math.PI/180)`;
      break;
    case "fact":
      exp = `factorial(${exp})`;
      break;
    case "percent":
      exp = `(${exp})/100`;
      break;
  }

  display.innerText = exp;
}

/* 🎤 VOICE INPUT */
function startVoice() {
  if (!("webkitSpeechRecognition" in window)) {
    alert("Use Google Chrome");
    return;
  }

  recognition = new webkitSpeechRecognition();
  recognition.lang = "en-IN";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => micBtn.classList.add("listening");
  recognition.onend = () => micBtn.classList.remove("listening");

  recognition.onresult = e => {
    const text = e.results[0][0].transcript.toLowerCase();
    handleVoice(text);
  };

  recognition.start();
}

/* 🧠 UNIVERSAL VOICE HANDLER */
function handleVoice(text) {
  try {
    let exp = normalizeSpeech(text);
    const result = calculateExpression(exp);
    display.innerText = result;
    speak("Result is " + result);
  } catch {
    display.innerText = "Error";
    speak("Sorry, I didn't understand");
  }
}

/* 🔁 NORMALIZE ALL SPEECH */
function normalizeSpeech(text) {
  /* Number words → digits */
  const numbers = {
    zero: 0, one: 1, two: 2, three: 3, four: 4,
    five: 5, six: 6, seven: 7, eight: 8, nine: 9,
    ten: 10, eleven: 11, twelve: 12, thirteen: 13,
    fourteen: 14, fifteen: 15, sixteen: 16,
    seventeen: 17, eighteen: 18, nineteen: 19,
    twenty: 20
  };

  Object.keys(numbers).forEach(w => {
    text = text.replaceAll(w, numbers[w]);
  });

  /* Operator & function mapping */
  return text
    .replace(/what is|calculate|find|equals|=/g, "")
    .replace(/plus|add/g, "+")
    .replace(/minus|subtract/g, "-")
    .replace(/multiply|multiplied|times|into/g, "*")
    .replace(/divide|divided|by/g, "/")
    .replace(/square root of (\d+(\.\d+)?)/g, "Math.sqrt($1)")
    .replace(/square of (\d+(\.\d+)?)/g, "($1)**2")
    .replace(/sin (\d+(\.\d+)?)/g, "Math.sin($1*Math.PI/180)")
    .replace(/cos (\d+(\.\d+)?)/g, "Math.cos($1*Math.PI/180)")
    .replace(/tan (\d+(\.\d+)?)/g, "Math.tan($1*Math.PI/180)")
    .replace(/factorial of (\d+)/g, "factorial($1)")
    .replace(/percent of (\d+(\.\d+)?)/g, "($1)/100")
    .replace(/pi/g, "Math.PI")
    .replace(/[^0-9+\-*/().MathPI]/g, "");
}
