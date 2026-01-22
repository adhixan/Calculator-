const display = document.getElementById("display");
const micBtn = document.getElementById("micBtn");
const canvas = document.getElementById("waveform");
const canvasCtx = canvas.getContext("2d");

let recognition;
let audioContext;
let analyser;
let source;
let animationId;
let isVisualizerRunning = false;

/* 🔊 SPEAK */
function speak(text) {
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = "en-IN";
    speechSynthesis.speak(msg);
  }
}

/* ➕ BUTTON INPUT */
function press(val) {
  if (display.innerText === "0" || display.innerText === "Error") {
    display.innerText = val;
  } else {
    display.innerText += val;
  }
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

/* 🧮 CALCULATE EXPRESSION */
function calculateExpression(exp) {
  // 1. Sanitize visual symbols to JS math
  exp = exp
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/π/g, "Math.PI")
    // Fix: Allow degrees in voice for trig functions
    // Converts "Math.sin(90)" -> "Math.sin((90)*Math.PI/180)"
    .replace(/(Math\.(sin|cos|tan))\(([^)]+)\)/g, '$1(($3)*Math.PI/180)');

  // 2. Evaluate
  try {
    // Security Note: 'eval' is used here for calculator flexibility.
    const result = eval(exp); 
    if (result === undefined || isNaN(result) || !isFinite(result)) throw "Invalid";
    // Limit decimals to 8 places to avoid messy floats like 3.0000000004
    return parseFloat(result.toFixed(8));
  } catch (err) {
    throw "Invalid";
  }
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
  
  // Wrap existing expression if it's complex
  // e.g., if screen has "5+2", square becomes "(5+2)**2"
  // simplified check: if strictly numbers, no parens needed (optional but cleaner)
  
  switch (type) {
    case "sqrt":
      exp = `Math.sqrt(${exp})`;
      break;
    case "square":
      exp = `(${exp})**2`;
      break;
    case "sin":
      // Math.sin expects radians, but humans expect degrees on calculators
      // We explicitly convert D -> R here for display logic
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

/* 🔢 CONVERT SPOKEN WORDS TO DIGITS (Fixed Logic) */
function convertWordNumbers(text) {
  const small = {
    'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4,
    'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9,
    'ten': 10, 'eleven': 11, 'twelve': 12, 'thirteen': 13,
    'fourteen': 14, 'fifteen': 15, 'sixteen': 16,
    'seventeen': 17, 'eighteen': 18, 'nineteen': 19
  };
  
  const magnitude = {
    'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50,
    'sixty': 60, 'seventy': 70, 'eighty': 80, 'ninety': 90
  };
  
  const multipliers = {
    'hundred': 100, 'thousand': 1000, 'million': 1000000
  };

  text = text.replace(/-/g, ' '); // "twenty-five" -> "twenty five"
  let words = text.split(' ');
  let result = [];
  let currentNumber = 0;
  let hasNumber = false;

  // Parser loop
  for (let word of words) {
    let val = undefined;
    
    // Check if it's a known number word
    if (small[word] !== undefined) val = small[word];
    else if (magnitude[word] !== undefined) val = magnitude[word];
    
    if (val !== undefined) {
      // Accumulate simple numbers (e.g. "twenty" + "five" -> 25)
      currentNumber += val;
      hasNumber = true;
    } else if (multipliers[word] !== undefined) {
      // Handle multipliers (e.g. "two" * "hundred" -> 200)
      if (hasNumber) {
        currentNumber *= multipliers[word];
      } else {
        // e.g. "hundred" alone implies "one hundred"
        currentNumber = multipliers[word]; 
        hasNumber = true;
      }
    } else {
      // Not a number word? Push the accumulated number and the word
      if (hasNumber) {
        result.push(currentNumber);
        currentNumber = 0;
        hasNumber = false;
      }
      result.push(word);
    }
  }
  // Push trailing number
  if (hasNumber) result.push(currentNumber);

  return result.join(' ');
}

/* 🔁 NORMALIZE SPEECH */
function normalizeSpeech(text) {
  // 1. Remove fillers
  text = text.toLowerCase()
    .replace(/what is|calculate|find|the|value of|equals|=/g, "")
    .trim();

  // 2. Convert text numbers to digits (Fixed function)
  text = convertWordNumbers(text);

  // 3. Map Operators & Typos
  const replacements = [
    [/plus|add|added to/g, "+"],
    [/minus|subtract|take away/g, "-"],
    [/multiply|multiplied by|into|times| x /g, "*"], // "x" usually means multiply
    [/divide|divided by|over/g, "/"],
    [/mod|modulus|remainder/g, "%"],
    
    // Advanced Math
    [/square root( of)?|root( of)?|sqrt/g, "Math.sqrt"],
    [/square(d)?|to the power of 2/g, "**2"],
    [/cube(d)?|to the power of 3/g, "**3"],
    [/(raised )?to the power of|power/g, "**"],
    
    // Trig & Constants
    [/sine|sign/g, "Math.sin"], 
    [/cosine|cos/g, "Math.cos"],
    [/tangent|tan/g, "Math.tan"],
    [/pi|pai|pie/g, "Math.PI"],
    [/percent( of)?/g, "/100"],
    
    // Fix function syntax: "Math.sqrt 9" -> "Math.sqrt(9)"
    [/(Math\.[a-z]+)\s*(\d+(\.\d+)?)/g, "$1($2)"],
    // Cleanup
    [/\s+/g, " "]
  ];

  replacements.forEach(([regex, replacement]) => {
    text = text.replace(regex, replacement);
  });

  // 4. Final Sanitize
  const validMathChars = /[^0-9+\-*/().%MathPI\s]/g;
  text = text.replace(validMathChars, "");

  return text;
}

/* 🎤 VOICE HANDLER */
function handleVoice(text) {
  console.log("Heard:", text);
  try {
    let exp = normalizeSpeech(text);
    console.log("Math Logic:", exp); // Debug log
    
    const result = calculateExpression(exp);
    display.innerText = result;
    speak("Result is " + result);
  } catch (e) {
    console.error(e);
    display.innerText = "Error";
    speak("Sorry, I didn't understand the calculation.");
  }
}

/* 🎙️ START VOICE */
function startVoice() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert("Voice not supported. Please use Chrome/Edge.");
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = "en-IN";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    micBtn.classList.add("listening");
    startVisualizer(); 
  };

  recognition.onend = () => {
    micBtn.classList.remove("listening");
    stopVisualizer(); 
  };

  recognition.onresult = e => {
    const text = e.results[0][0].transcript;
    handleVoice(text);
  };

  recognition.start();
}

/* 🌊 VISUALIZER (Fixed Leaks) */
function startVisualizer() {
  if (isVisualizerRunning) return;
  
  if (!navigator.mediaDevices) return;

  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
      // Reuse context if exists and running
      if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      // Resume if suspended (browser policy)
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      analyser = audioContext.createAnalyser();
      source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;
      
      canvas.classList.add("active");
      isVisualizerRunning = true;
      drawWaveform();
    })
    .catch(e => console.error("Mic denied:", e));
}

function drawWaveform() {
  if (!isVisualizerRunning) return;
  
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  function render() {
    if (!isVisualizerRunning) return;
    
    animationId = requestAnimationFrame(render);
    analyser.getByteFrequencyData(dataArray);

    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    
    const barWidth = (canvas.width / bufferLength) * 2.5;
    let barHeight;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      barHeight = dataArray[i] / 2; 
      // Dynamic colors
      const r = barHeight + 25 * (i / bufferLength);
      const g = 250 * (i / bufferLength);
      const b = 50;

      canvasCtx.fillStyle = `rgb(${r},${g},${b})`;
      canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
      x += barWidth + 1;
    }
  }
  render();
}

function stopVisualizer() {
  isVisualizerRunning = false;
  canvas.classList.remove("active");
  if (animationId) cancelAnimationFrame(animationId);
  canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Important: Stop the tracks to release the mic
  if (source && source.mediaStream) {
    source.mediaStream.getTracks().forEach(track => track.stop());
  }
}
