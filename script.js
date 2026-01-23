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
  // Using Function instead of eval for slightly better security practice
  const result = new Function(`return ${exp}`)();

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
  if (!("webkitSpeechRecognition" in window) && !("speechRecognition" in window)) {
    alert("Speech recognition not supported in this browser. Please use Chrome.");
    return;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
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
  // 1. Digit Mapping (Extended)
  const units = {
    zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, 
    six: 6, seven: 7, eight: 8, nine: 9, ten: 10, 
    eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, 
    fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19
  };
  const tens = {
    twenty: 20, thirty: 30, forty: 40, fifty: 50, 
    sixty: 60, seventy: 70, eighty: 80, ninety: 90
  };

  // Replace tens (e.g., "twenty" -> "20")
  Object.keys(tens).forEach(w => {
    text = text.replaceAll(w, tens[w]);
  });
  // Replace units (e.g., "five" -> "5")
  Object.keys(units).forEach(w => {
    text = text.replaceAll(w, units[w]);
  });
  
  // Logic to combine "20 5" into "25"
  text = text.replace(/(\d+)\s+(\d+)/g, (match, p1, p2) => {
    if (p1.endsWith('0') && p2.length === 1) return parseInt(p1) + parseInt(p2);
    return match;
  });

  // 2. Operator & Keyword Mapping
  return text
    .replace(/what is|calculate|find|equals|=/g, "")
    // Addition
    .replace(/plus|add|sum of/g, "+")
    // Subtraction
    .replace(/minus|subtract|less than/g, "-")
    // Multiplication
    .replace(/multiply|multiplied by|times|into|product of/g, "*")
    // Division
    .replace(/divide|divided by|over/g, "/")
    // Exponents
    .replace(/(\d+)\s*(to the power of|power|raised to)\s*(\d+)/g, "Math.pow($1,$3)")
    // Scientific Functions
    .replace(/(square root of|root|sqrt)\s*(\d+(\.\d+)?)/g, "Math.sqrt($2)")
    .replace(/(square of|squared)\s*(\d+(\.\d+)?)/g, "($2)**2")
    .replace(/sin(e)?\s*(of)?\s*(\d+)/g, "Math.sin($3*Math.PI/180)")
    .replace(/cos(ine)?\s*(of)?\s*(\d+)/g, "Math.cos($3*Math.PI/180)")
    .replace(/tan(gent)?\s*(of)?\s*(\d+)/g, "Math.tan($3*Math.PI/180)")
    .replace(/factorial\s*(of)?\s*(\d+)/g, "factorial($2)")
    .replace(/(\d+(\.\d+)?)\s*(percent|percentage)/g, "($1)/100")
    .replace(/pi/g, "Math.PI")
    // Cleanup: Remove remaining text characters but keep Math functions
    .replace(/[^0-9+\-*/().,MathpowPI]/g, "");
}
