const agentText = document.getElementById("agentText");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const conceptSelect = document.getElementById("conceptSelect");
const btnLearn = document.getElementById("btnLearn");
const btnQuiz = document.getElementById("btnQuiz");
const btnTeachBack = document.getElementById("btnTeachBack");

let concepts = [];
let currentMode = "learn"; // learn | quiz | teach_back
let currentConcept = null;

// --- Speech synthesis helper ---
function speak(text, rate = 1, pitch = 1) {
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = rate;
  utter.pitch = pitch;
  speechSynthesis.speak(utter);
}

// --- Load JSON content ---
fetch("shared-data/day4_tutor_content.json")
  .then(res => res.json())
  .then(data => {
    concepts = data;
    fillConcepts();
    currentConcept = concepts[0];
    const greeting =
      "👋 Hi! I’m your Active Recall Tutor. You can learn, take a quiz, or teach concepts back to me. Choose a mode and concept to begin.";
    agentText.innerText = greeting;
    speak(greeting, 1, 1.1);
  })
  .catch(err => {
    console.error(err);
    agentText.innerText = "Error loading learning content.";
  });

// --- Fill dropdown ---
function fillConcepts() {
  conceptSelect.innerHTML = "";
  concepts.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = c.title;
    conceptSelect.appendChild(opt);
  });
}

// --- Change concept handler ---
conceptSelect.onchange = () => {
  const id = conceptSelect.value;
  currentConcept = concepts.find(c => c.id === id);
  if (!currentConcept) return;
  const msg = `You selected: ${currentConcept.title}. Choose a mode to start.`;
  agentText.innerText = msg;
  speak(msg);
};

// --- Mode selection ---
function setMode(mode) {
  currentMode = mode;
  [btnLearn, btnQuiz, btnTeachBack].forEach(btn => btn.classList.remove("active"));
  if (mode === "learn") btnLearn.classList.add("active");
  if (mode === "quiz") btnQuiz.classList.add("active");
  if (mode === "teach_back") btnTeachBack.classList.add("active");

  let msg = "";
  if (mode === "learn")
    msg = `🧠 Learn Mode – I’ll explain ${currentConcept.title}.`;
  else if (mode === "quiz")
    msg = `❓ Quiz Mode – I’ll ask you a question about ${currentConcept.title}.`;
  else msg = `🗣️ Teach Back Mode – Explain ${currentConcept.title} in your own words.`;

  agentText.innerText = msg;
  speak(msg, 1, 1.1);
}

btnLearn.onclick = () => setMode("learn");
btnQuiz.onclick = () => setMode("quiz");
btnTeachBack.onclick = () => setMode("teach_back");

// --- Reply handler ---
sendBtn.onclick = () => {
  if (!currentConcept) {
    agentText.innerText = "Please wait, loading concepts...";
    return;
  }

  const text = userInput.value.trim();

  if (!text && currentMode !== "learn") {
    agentText.innerText = "Please type something so I can respond.";
    speak(agentText.innerText);
    return;
  }

  // --- LEARN MODE ---
  if (currentMode === "learn") {
    const explain = `Let's learn about ${currentConcept.title}. ${currentConcept.summary}`;
    agentText.innerText = explain;
    speak(explain, 1, 1); // Matthew-style voice
  }

  // --- QUIZ MODE ---
  else if (currentMode === "quiz") {
    // Ask question first if not asked yet
    if (!sendBtn.dataset.asked) {
      const question = currentConcept.sample_question;
      agentText.innerText = `Alright! Let's test you. 🤔\n${question}`;
      speak(agentText.innerText, 1, 1.2); // Alicia-style voice
      sendBtn.dataset.asked = "true";
      return; // Wait for user to answer
    }

    // Evaluate answer
    sendBtn.dataset.asked = "";
    const userAnswer = text.toLowerCase();
    let feedback = "";

    if (currentConcept.id === "variables") {
      if (userAnswer.includes("store") || userAnswer.includes("value")) {
        feedback = "✅ Nice! You mentioned storing values — that’s the key idea of variables.";
      } else {
        feedback = "Variables are like boxes that store values you can reuse later.";
      }
    } else if (currentConcept.id === "loops") {
      if (userAnswer.includes("repeat") || userAnswer.includes("condition")) {
        feedback = "✅ Great! Loops repeat actions until a condition is met.";
      } else {
        feedback = "Loops help repeat tasks without writing the same code again.";
      }
    } else {
      feedback = "Good effort! Try focusing on the main purpose next time.";
    }

    const msg = `You said: "${text}".\n\n${feedback}\n\nTry Teach Back mode now! 🗣️`;
    agentText.innerText = msg;
    speak(feedback, 1, 1.2); // Alicia-style
  }

  // --- TEACH BACK MODE ---
  else if (currentMode === "teach_back") {
    const userExplanation = text.toLowerCase();
    let scoreHint = "";

    if (userExplanation.length < 30)
      scoreHint = "Your explanation is a bit short. Try adding more detail 🌱";
    else if (userExplanation.length < 80)
      scoreHint = "Nice! That’s a clear and focused explanation 🎯";
    else scoreHint = "Excellent depth! You explained that really well 🚀";

    let keywordHint = "";
    if (currentConcept.id === "variables" && !userExplanation.includes("store"))
      keywordHint = "You could mention that variables **store values** with a name.";
    if (currentConcept.id === "loops" && !userExplanation.includes("repeat"))
      keywordHint = "You can say that loops **repeat actions** until a condition is met.";

    const msg = `Thanks for teaching that back! 💬\n\n${scoreHint}\n${keywordHint}`;
    agentText.innerText = msg;
    speak(scoreHint, 1, 0.9); // Ken-style voice
  }

  userInput.value = "";
};
