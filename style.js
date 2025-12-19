const display = document.getElementById("display");

function speak(text) {
  const msg = new SpeechSynthesisUtterance(text);
  msg.lang = "en-IN";
  speechSynthesis.speak(msg);
}

function press(value) {
  if (display.innerText === "0") {
    display.innerText = value;
  } else {
    display.innerText += value;
  }
  speak(value);
}

function clearDisplay() {
  display.innerText = "0";
  speak("Cleared");
}

function calculate() {
  try {
    let expression = display.innerText
      .replace(/×/g, "*")
      .replace(/÷/g, "/");

    let result = Function("return " + expression)();
    display.innerText = result;
    speak("Result is " + result);
  } catch {
    display.innerText = "Error";
    speak("Error");
  }
}

function startVoice() {
  if (!("webkitSpeechRecognition" in window)) {
    alert("Voice input not supported");
    return;
  }

  const recognition = new webkitSpeechRecognition();
  recognition.lang = "en-IN";
  recognition.start();
  speak("Listening");

  recognition.onresult = function (event) {
    let text = event.results[0][0].transcript.toLowerCase();

    text = text
      .replace(/plus/g, "+")
      .replace(/minus/g, "-")
      .replace(/times|multiply/g, "*")
      .replace(/divide/g, "/");

    display.innerText = text;
    speak(text);
  };
}
