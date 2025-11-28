const chatBox = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const restartBtn = document.getElementById("restartBtn");
const statusText = document.getElementById("statusText");
const micBtn = document.getElementById("micBtn");

const worldTitle = document.getElementById("worldTitle");
const worldTone = document.getElementById("worldTone");
const turnCount = document.getElementById("turnCount");
const sceneId = document.getElementById("sceneId");

let turns = 0;

// Add chat bubble
function addMessage(text, sender = "gm") {
  const div = document.createElement("div");
  div.classList.add("bubble", sender);
  div.textContent = text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;

  if (sender === "gm") speakText(text);
}

// Speak with voice
function speakText(text) {
  const synth = window.speechSynthesis;
  if (!synth) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-US";
  utter.pitch = 1.0;
  utter.rate = 1.0;
  synth.speak(utter);
}

// Send message to backend
async function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  addMessage(message, "player");
  userInput.value = "";

  const res = await fetch("/story", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });

  const data = await res.json();
  addMessage(data.reply, "gm");
  turns++;
  turnCount.textContent = turns;
}

// Restart
restartBtn.addEventListener("click", () => {
  chatBox.innerHTML = "";
  addMessage("🔄 The tale begins anew. You are back at Emberfall Village.", "gm");
  turns = 0;
  turnCount.textContent = 0;
});

// Voice mic (optional)
micBtn.addEventListener("click", () => {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = "en-US";
  recognition.start();
  micBtn.classList.add("active");
  statusText.textContent = "🎙️ Listening...";
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    userInput.value = transcript;
    sendMessage();
  };
  recognition.onend = () => {
    micBtn.classList.remove("active");
    statusText.textContent = "Listening is off";
  };
});

// Load intro
async function loadIntro() {
  const res = await fetch("/story");
  const data = await res.json();
  addMessage(data.reply, "gm");
  worldTitle.textContent = data.world || "Fantasy Adventure";
  worldTone.textContent = `Universe: ${data.world || "undefined"} • Tone: ${data.tone || "undefined"}`;
}

sendBtn.addEventListener("click", sendMessage);
userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});

loadIntro();
