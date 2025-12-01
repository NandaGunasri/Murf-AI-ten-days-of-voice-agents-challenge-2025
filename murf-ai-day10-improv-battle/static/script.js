const chatBox = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const micBtn = document.getElementById("micBtn");
const restartBtn = document.getElementById("restartBtn");
const statusText = document.getElementById("statusText");

const joinOverlay = document.getElementById("joinOverlay");
const nameInput = document.getElementById("nameInput");
const joinBtn = document.getElementById("joinBtn");

const playerNameLabel = document.getElementById("playerNameLabel");
const roundLabel = document.getElementById("roundLabel");
const phaseLabel = document.getElementById("phaseLabel");

const beepStart = document.getElementById("beep-start");
const beepStop = document.getElementById("beep-stop");

let recognition = null;
let isListening = false;
const synth = window.speechSynthesis;

function appendMessage(text, sender = "host") {
  const div = document.createElement("div");
  div.classList.add("bubble", sender === "host" ? "host" : "player");
  div.textContent = text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;

  if (sender === "host") {
    speak(text);
  }
}

function speak(text) {
  if (!synth) return;
  if (synth.speaking) synth.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-US";
  utter.rate = 1;
  utter.pitch = 1.02;
  synth.speak(utter);
}

function updateSessionLabels(state) {
  if (!state) return;
  playerNameLabel.textContent = state.player_name || "–";
  roundLabel.textContent = `${state.current_round} / ${state.max_rounds}`;
  phaseLabel.textContent = state.phase || "idle";
}

async function startGame(playerName) {
  try {
    const res = await fetch("/api/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ player_name: playerName }),
    });
    const data = await res.json();
    chatBox.innerHTML = "";
    appendMessage(data.host_reply, "host");
    updateSessionLabels(data.state);
    statusText.textContent = "Improv battle in progress…";
  } catch (err) {
    console.error("Start error", err);
    appendMessage("Something went wrong starting the show. Try refreshing.", "host");
  }
}

async function sendPlayerLine(text) {
  try {
    const res = await fetch("/api/player-turn", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    appendMessage(data.host_reply, "host");
    updateSessionLabels(data.state);

    if (data.state && data.state.phase === "done") {
      statusText.textContent = "Show finished – start a new game to play again.";
    }
  } catch (err) {
    console.error("Turn error", err);
    appendMessage("The studio lights flickered… please try again.", "host");
  }
}

function handleSend() {
  const text = userInput.value.trim();
  if (!text) return;
  appendMessage(text, "player");
  userInput.value = "";
  sendPlayerLine(text);
}

function setupEvents() {
  sendBtn.addEventListener("click", handleSend);
  userInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleSend();
  });

  restartBtn.addEventListener("click", () => {
    joinOverlay.classList.remove("hidden");
    statusText.textContent = "Not connected";
    chatBox.innerHTML = "";
  });

  joinBtn.addEventListener("click", () => {
    const name = nameInput.value.trim() || "Mystery Player";
    joinOverlay.classList.add("hidden");
    statusText.textContent = "Connecting to host…";
    startGame(name);
  });

  setupSpeechRecognition();
  micBtn.addEventListener("click", toggleMic);
}

function setupSpeechRecognition() {
  if (!("webkitSpeechRecognition" in window)) {
    console.warn("Speech recognition not supported in this browser.");
    micBtn.disabled = true;
    micBtn.title = "Speech recognition not supported in this browser";
    return;
  }

  recognition = new webkitSpeechRecognition();
  recognition.lang = "en-US";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onresult = (e) => {
    const transcript = e.results[0][0].transcript;
    userInput.value = transcript;
    handleSend();
  };

  recognition.onend = () => {
    if (micBtn) micBtn.classList.remove("active");
    if (beepStop) beepStop.play();
    isListening = false;
    statusText.textContent = "Listening is off";
  };
}

function toggleMic() {
  if (!recognition) return;

  if (isListening) {
    recognition.stop();
    micBtn.classList.remove("active");
    if (beepStop) beepStop.play();
    isListening = false;
    statusText.textContent = "Listening is off";
  } else {
    recognition.start();
    micBtn.classList.add("active");
    if (beepStart) beepStart.play();
    isListening = true;
    statusText.textContent = "Listening… speak your line!";
  }
}

// Initialize
setupEvents();
appendMessage(
  "Welcome to Improv Battle! Enter your name to join the show and start the chaos.",
  "host"
);
