const display = document.getElementById("display");

/* 🔊 Speech */
function speak(text) {
  const msg = new SpeechSynthesisUtterance(text);
  msg.lang = "en-IN";
  speechSynthesis.speak(msg);
}

/* Button press */
function press(value) {
  display.value += value;
  speak(value.replace('*', 'multiply').replace('/', 'divide'));
}

/* Clear */
function clearDisplay() {
  display.value = "";
  speak("Cleared");
}

/* Calculate */
function calculate() {
  try {
    const result = eval(display.value);
    display.value = result;
    speak("Result is " + result);
  } catch {
    display.value = "Error";
    speak("Error");
  }
}

/* 🎤 Voice Input */
function startVoice() {
  if (!('webkitSpeechRecognition' in window)) {
    alert("Voice input not supported");
    return;
  }

  const recognition = new webkitSpeechRecognition();
  recognition.lang = "en-IN";
  recognition.start();
  speak("Listening");

  recognition.onresult = function (event) {
    let voiceText = event.results[0][0].transcript.toLowerCase();

    voiceText = voiceText
      .replace(/plus/g, "+")
      .replace(/minus/g, "-")
      .replace(/multiply by|times/g, "*")
      .replace(/divide by/g, "/")
      .replace(/into/g, "*");

    display.value = voiceText;
    speak("You said " + voiceText);
  };
}
