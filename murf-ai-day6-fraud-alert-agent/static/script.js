// ---------------- ELEMENTS ----------------
const chatBox = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const beepStart = document.getElementById("beep-start");
const beepStop = document.getElementById("beep-stop");

let stage = "intro";
let recognition;
let isListening = false;
let currentCase = null;
let currentUserName = "";

// ---------------- INIT ----------------
window.onload = () => {
  console.log("✅ Voice Agent loaded. Click anywhere to unlock audio.");
  attachEvents();
  setupVoiceRecognition();
  startConversation();
};

// ---------------- CHAT MESSAGE SYSTEM ----------------
function appendMessage(text, sender = "agent", withDelay = true) {
  const div = document.createElement("div");
  div.classList.add("bubble", sender);
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;

  if (sender === "agent" && withDelay) {
    typeMessage(div, text, () => speak(text));
  } else {
    div.textContent = text;
  }
}

function typeMessage(element, text, callback) {
  let i = 0;
  const typingSpeed = 30;
  const interval = setInterval(() => {
    element.textContent = text.slice(0, i);
    chatBox.scrollTop = chatBox.scrollHeight;
    i++;
    if (i > text.length) {
      clearInterval(interval);
      if (callback) callback();
    }
  }, typingSpeed);
}

// ---------------- START ----------------
function startConversation() {
  const opening =
    "Hello, this is Aurora Bank's fraud protection team. " +
    "This is an automated assistant calling about a suspicious transaction on your card. " +
    "To begin, please tell me your first name.";
  stage = "ask_name";
  appendMessage(opening, "agent");
}

// ---------------- EVENTS ----------------
function attachEvents() {
  sendBtn.addEventListener("click", handleUserInput);
  userInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleUserInput();
  });

  const micBtn = document.createElement("button");
  micBtn.id = "micBtn";
  micBtn.textContent = "🎤";
  document.querySelector(".input-row").appendChild(micBtn);
  micBtn.addEventListener("click", toggleMic);
}

// ---------------- INPUT HANDLER ----------------
function handleUserInput() {
  const text = userInput.value.trim();
  if (!text) return;
  appendMessage(text, "user");
  userInput.value = "";
  handleStageInput(text);
}

function handleStageInput(text) {
  switch (stage) {
    case "ask_name":
      currentUserName = text;
      fetchFraudCase(currentUserName);
      break;
    case "verify":
      handleVerification(text);
      break;
    case "confirm_txn":
      handleTransactionConfirmation(text);
      break;
    default:
      appendMessage(
        "Sorry, something went wrong. Please call the number on your card.",
        "agent"
      );
      stage = "end";
  }
}

// ---------------- FETCH & UPDATE ----------------
async function fetchFraudCase(userName) {
  try {
    const res = await fetch(`/fraud-case?userName=${encodeURIComponent(userName)}`);
    if (!res.ok) {
      appendMessage("I couldn’t find a fraud alert under that name.", "agent");
      await updateCaseStatus(userName, "verification_failed", "User not found.");
      stage = "end";
      return;
    }
    const data = await res.json();
    currentCase = data;
    const verifyPrompt = `Thank you, ${data.userName}. Please answer this question: ${data.securityQuestion}`;
    stage = "verify";
    appendMessage(verifyPrompt, "agent");
  } catch {
    appendMessage("Unable to access your fraud case. Please try again later.", "agent");
    stage = "end";
  }
}

async function updateCaseStatus(userName, status, note) {
  try {
    await fetch("/fraud-case", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userName, status, outcomeNote: note }),
    });
  } catch (e) {
    console.error("DB update failed", e);
  }
}

// ---------------- VERIFICATION ----------------
function handleVerification(answer) {
  const normalized = answer.trim().toLowerCase();
  const expected = currentCase.securityAnswer.trim().toLowerCase();

  if (normalized === expected) {
    const txn = currentCase;
    const msg =
      `Thank you, ${txn.userName}. You’re verified.\n\n` +
      `We detected a transaction of ${txn.transactionAmount} ${txn.currency} at ${txn.merchantName} ` +
      `from ${txn.transactionLocation}. It was charged to your card ending in ${txn.cardEnding} on ${txn.transactionTime}. ` +
      `Did you make this transaction? Please say yes or no.`;
    stage = "confirm_txn";
    appendMessage(msg, "agent");
  } else {
    appendMessage(
      "Sorry, that answer doesn’t match our records. The call will end now.",
      "agent"
    );
    updateCaseStatus(currentCase.userName, "verification_failed", "User failed security question.");
    stage = "end";
  }
}

// ---------------- TRANSACTION CONFIRMATION ----------------
function handleTransactionConfirmation(text) {
  const t = text.toLowerCase();
  const isYes = /\b(yes|yeah|yep|correct|i did)\b/.test(t);
  const isNo = /\b(no|nope|not me|wasn\'t me)\b/.test(t);

  if (!isYes && !isNo) {
    appendMessage("Please answer clearly with yes or no.", "agent");
    return;
  }

  if (isYes) {
    appendMessage("Thank you. We’ll mark this transaction as legitimate.", "agent");
    updateCaseStatus(
      currentCase.userName,
      "confirmed_safe",
      "User confirmed transaction as legitimate."
    );
  } else {
    appendMessage("Thank you. We’ll mark this as fraudulent and block your card.", "agent");
    updateCaseStatus(
      currentCase.userName,
      "confirmed_fraud",
      "User denied transaction. Marked fraudulent."
    );
  }

  stage = "end";
}

// ---------------- VOICE RECOGNITION ----------------
function setupVoiceRecognition() {
  if (!("webkitSpeechRecognition" in window)) {
    console.warn("Speech recognition not supported in this browser.");
    return;
  }

  recognition = new webkitSpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.continuous = false;

  recognition.onresult = (e) => {
    userInput.value = e.results[0][0].transcript;
    handleUserInput();
  };

  recognition.onend = () => {
    const micBtn = document.getElementById("micBtn");
    micBtn.classList.remove("active");
    beepStop.play();
    isListening = false;
  };
}

function toggleMic() {
  const micBtn = document.getElementById("micBtn");
  if (!recognition) return;

  if (isListening) {
    recognition.stop();
    micBtn.classList.remove("active");
    beepStop.play();
    isListening = false;
  } else {
    beepStart.play();
    recognition.start();
    micBtn.classList.add("active");
    isListening = true;
  }
}

// ---------------- VOICE SPEECH ----------------
function speak(text) {
  if (!window.voiceReady) {
    console.warn("Voice not ready yet — click once on the page first.");
    return;
  }

  const synth = window.speechSynthesis;
  if (!synth) {
    console.error("Speech synthesis not supported.");
    return;
  }

  if (synth.speaking) synth.cancel();

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-US";
  utter.rate = 1;
  utter.pitch = 1;
  utter.onstart = () => console.log("🗣️ Speaking...");
  utter.onend = () => console.log("✅ Done speaking.");
  utter.onerror = (e) => console.error("Speech error:", e);

  setTimeout(() => synth.speak(utter), 300);
}
