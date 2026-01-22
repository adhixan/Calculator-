/* 🎤 VOICE HANDLER (UPDATED) */
function handleVoice(text) {
  console.log("Heard:", text);
  try {
    let exp = normalizeSpeech(text);
    console.log("Math Logic:", exp); 
    
    // Check if user said "Clear"
    if (text.toLowerCase().includes("clear")) {
        clearDisplay();
        return;
    }

    const result = calculateExpression(exp);
    display.innerText = result;
    speak("Result is " + result);
  } catch (e) {
    console.error(e);
    display.innerText = "Error";
    speak("I heard " + text + ", but I couldn't calculate it.");
  }
}

/* 🎙️ START VOICE (FIXED) */
function startVoice() {
  // 1. Check Browser Support
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("Voice control is not supported in this browser. Please use Google Chrome.");
    return;
  }

  // 2. Prevent multiple instances
  if (recognition && recognition.running) {
      recognition.stop();
      return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = "en-IN"; // English (India)
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  // 🟢 ON START
  recognition.onstart = () => {
    console.log("Voice recognition started...");
    micBtn.classList.add("listening");
    
    // NOTE: If voice fails immediately, COMMENT OUT the next line.
    // Simultaneous Mic + Speech API often crashes on Windows/Android.
    startVisualizer(); 
  };

  // 🔴 ON END
  recognition.onend = () => {
    console.log("Voice recognition ended.");
    micBtn.classList.remove("listening");
    stopVisualizer();
  };

  // ⚠️ ON ERROR (Crucial for debugging)
  recognition.onerror = (event) => {
    console.error("Speech Error:", event.error);
    micBtn.classList.remove("listening");
    stopVisualizer();
    
    if (event.error === 'not-allowed') {
        alert("Microphone access denied. Please allow permission.");
    } else if (event.error === 'network') {
        alert("Network error. Voice recognition requires internet.");
    }
  };

  // 🗣️ ON RESULT
  recognition.onresult = (e) => {
    const text = e.results[0][0].transcript;
    handleVoice(text);
  };

  recognition.start();
  recognition.running = true; // Manual flag to track state
}

/* 🔌 IMPORTANT: BIND THE BUTTON */
// Make sure this line exists at the end of your script!
micBtn.addEventListener("click", startVoice);
