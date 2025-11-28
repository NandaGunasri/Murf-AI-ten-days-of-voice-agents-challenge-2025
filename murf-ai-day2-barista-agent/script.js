const chat = document.getElementById("chat");
const input = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const orderJson = document.getElementById("orderJson");
const downloadBtn = document.getElementById("downloadBtn");

// order state as required
const order = {
  drinkType: "",
  size: "",
  milk: "",
  extras: [],
  name: ""
};

const questions = [
  "What drink would you like? (e.g., latte, cappuccino, black coffee)",
  "What size do you prefer? (small / medium / large)",
  "Do you want any milk? (e.g., whole, skim, oat, none)",
  "Any extras? (e.g., sugar, extra shot, whipped cream) You can type comma separated or 'none'.",
  "Can I have your name for the order?"
];

let step = 0;

function speak(text) {
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 1;
  u.pitch = 1;
  speechSynthesis.speak(u);
}

function addMessage(text, from) {
  const div = document.createElement("div");
  div.className = "msg " + from;
  div.textContent = (from === "me" ? "You: " : "Barista: ") + text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function askNextQuestion() {
  if (step < questions.length) {
    const q = questions[step];
    addMessage(q, "bot");
    speak(q);
  } else {
    // all fields filled
    const summary = JSON.stringify(order, null, 2);
    orderJson.textContent = summary;
    const doneMsg = `Thanks ${order.name}! Your ${order.size} ${order.drinkType} will be ready soon.`;
    addMessage(doneMsg, "bot");
    speak(doneMsg);
    enableDownload(summary);
  }
}

function enableDownload(jsonStr) {
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  downloadBtn.href = url;
  downloadBtn.download = "coffee_order.json";
  downloadBtn.disabled = false;
}

sendBtn.onclick = () => {
  const text = input.value.trim();
  if (!text) return;
  addMessage(text, "me");

  switch (step) {
    case 0:
      order.drinkType = text;
      break;
    case 1:
      order.size = text;
      break;
    case 2:
      order.milk = text;
      break;
    case 3:
      if (text.toLowerCase() === "none") {
        order.extras = [];
      } else {
        order.extras = text.split(",").map(s => s.trim()).filter(Boolean);
      }
      break;
    case 4:
      order.name = text;
      break;
  }

  input.value = "";
  step++;
  askNextQuestion();
};

downloadBtn.addEventListener("click", () => {
  // click will download because we set href + download in enableDownload
});

// greeting + first question
const greeting = "Hi there! Welcome to Guna's Coffee Corner. I am your barista. Let's place your order!";
addMessage(greeting, "bot");
speak(greeting);
askNextQuestion();
