const agentText = document.getElementById("agentText");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const faqSuggestions = document.getElementById("faqSuggestions");

let faqs = [];
let stage = "intro"; 
let recognition;
let isListening = false;
const synth = window.speechSynthesis;

let lead = {
  name: "",
  company: "",
  email: "",
  role: "",
  use_case: "",
  team_size: "",
  timeline: "",
  discovery_notes: ""
};

// ---- FAQ DATA ----
faqs = [
  {
    question: "What is Zoho CRM?",
    answer:
      "Zoho CRM is a cloud-based customer relationship management platform that helps you manage leads, deals, contacts, and automate your sales pipeline."
  },
  {
    question: "Do you have a free trial?",
    answer:
      "Yes, Zoho CRM offers a free trial so you can explore features before committing to a paid plan."
  },
  {
    question: "What about pricing?",
    answer:
      "Zoho CRM has multiple pricing tiers—from a free plan to advanced editions. Pricing depends on the edition and number of users."
  },
  {
    question: "Does Zoho CRM integrate with email?",
    answer:
      "Yes, Zoho CRM integrates with popular email providers and lets you track email opens, clicks, and replies inside the CRM."
  },
  {
    question: "Do you support voice agents like Murf?",
    answer:
      "Yes, you can integrate voice agents built with Murf AI using APIs, webhooks, or via your existing contact center tools."
  }
];

// ---- INIT ----
function init() {
  renderFaqChips();
  startConversation();
  attachEvents();
  setupVoiceRecognition();
}

function startConversation() {
  const opening =
    " Hi, I’m your Zoho SDR assistant.\n\n" +
    "I can answer questions about Zoho CRM and also help your details reach our sales team.\n\n" +
    "To start, could you briefly share what brought you here today?";
  stage = "discovery";
  setAgentText(opening);
  speak(opening);
}

function attachEvents() {
  sendBtn.addEventListener("click", () => handleUserInput());
  userInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleUserInput();
  });

  // 🎤 Mic Button
  const micBtn = document.createElement("button");
  micBtn.id = "micBtn";
  micBtn.textContent = "🎤";
  micBtn.style.border = "none";
  micBtn.style.borderRadius = "50%";
  micBtn.style.padding = "10px";
  micBtn.style.marginLeft = "6px";
  micBtn.style.background = "linear-gradient(135deg, #0ea5e9, #22c55e)";
  micBtn.style.cursor = "pointer";
  micBtn.title = "Click to Speak";
  document.querySelector(".input-row").appendChild(micBtn);

  micBtn.addEventListener("click", toggleMic);
}

function setAgentText(text) {
  agentText.innerText = text;
  speak(text);
}

function disableInput(disabled) {
  userInput.disabled = disabled;
  sendBtn.disabled = disabled;
}

// ---- FAQ LOGIC ----
function renderFaqChips() {
  faqSuggestions.innerHTML = "";
  faqs.slice(0, 5).forEach((faq) => {
    const chip = document.createElement("button");
    chip.className = "faq-chip";
    chip.innerText = faq.question;
    chip.addEventListener("click", () => {
      userInput.value = faq.question;
      handleUserInput();
    });
    faqSuggestions.appendChild(chip);
  });
}

function findFaqMatch(message) {
  const msg = message.toLowerCase();
  let bestMatch = null;
  let bestScore = 0;
  faqs.forEach((faq) => {
    const q = faq.question.toLowerCase();
    let score = 0;
    q.split(" ").forEach((word) => {
      if (word.length > 2 && msg.includes(word)) score++;
    });
    if (score > bestScore) {
      bestScore = score;
      bestMatch = faq;
    }
  });
  return bestScore >= 1 ? bestMatch : null;
}

// ---- MAIN HANDLER ----
function handleUserInput() {
  const text = userInput.value.trim();
  if (!text) return;

  userInput.value = "";
  disableInput(true);

  const isQuestion = text.includes("?") || /\b(price|pricing|trial|crm|integration)\b/i.test(text);
  const faqMatch = findFaqMatch(text);

  if (isQuestion && faqMatch) {
    const faqResponse = faqMatch.answer + "\n\n" + getNextStagePromptWithoutAdvancing();
    setAgentText(faqResponse);
    disableInput(false);
    return;
  }

  handleStageInput(text);
  disableInput(false);
}

// ---- STAGE FLOW ----
function handleStageInput(text) {
  switch (stage) {
    case "discovery":
      lead.discovery_notes = text;
      stage = "name";
      setAgentText("Thanks for sharing that. 😊\n\nTo help our team follow up, may I know your *name*?");
      break;

    case "name":
      lead.name = text;
      stage = "company";
      setAgentText(`Nice to meet you, ${lead.name}!\n\nWhich *company* or organization are you representing?`);
      break;

    case "company":
      lead.company = text;
      stage = "role";
      setAgentText("Got it.\n\nWhat is your *role* or designation in the company?");
      break;

    case "role":
      lead.role = text;
      stage = "email";
      setAgentText("Thanks.\n\nCould you share your *work email ID* so our sales team can reach out?");
      break;

    case "email":
     
      lead.email = text;
      stage = "use_case";
      setAgentText("Perfect.\n\nHow are you planning to *use Zoho CRM and Murf AI voice agents*?");
      break;

    case "use_case":
      lead.use_case = text;
      stage = "team_size";
      setAgentText("That sounds interesting.\n\nApproximately how many people are there in your *sales or support team*?");
      break;

    case "team_size":
      lead.team_size = text;
      stage = "timeline";
      setAgentText("Great.\n\nWhat does your *evaluation or purchase timeline* look like?");
      break;

    case "timeline":
      lead.timeline = text;
      stage = "done";
      handleCompletion();
      break;

    case "done":
      const faqMatch = findFaqMatch(text);
      if (faqMatch) {
        setAgentText(faqMatch.answer + "\n\nWe already captured your details. A Zoho expert will reach out soon.");
      } else {
        setAgentText("I’ve already sent your details to the sales team. 🎉\n\nYou can still ask me anything!");
      }
      break;

    default:
      setAgentText("Let’s start over. 👋\n\nCould you briefly share what brought you here today?");
      stage = "discovery";
      break;
  }

  console.log("Current Lead Object:", lead);
}

function getNextStagePromptWithoutAdvancing() {
  switch (stage) {
    case "discovery": return "Could you tell me what brought you here today?";
    case "name": return "May I know your *name*?";
    case "company": return "Which *company* are you from?";
    case "role": return "What’s your *role*?";
    default: return "Let's continue where we left off.";
  }
}

function isValidEmail(email) {
  const re = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
  return re.test(email);
}

// ---- HANDLE COMPLETION ----
async function handleCompletion() {
  const finalText = "Thanks for sharing all the details! 🎉\n\nWe’ve captured your info and will connect you with a Zoho CRM expert soon.";
  setAgentText(finalText);

  try {
    const res = await fetch("http://127.0.0.1:5000/submit-lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lead),
    });
    const data = await res.json();
    console.log("✅ Server Response:", data);
  } catch (err) {
    console.error("❌ Failed to submit lead:", err);
  }
}

// ---- VOICE SETUP ----
function setupVoiceRecognition() {
  if (!("webkitSpeechRecognition" in window)) {
    console.warn("Speech recognition not supported.");
    return;
  }

  recognition = new webkitSpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.continuous = false;

  recognition.onresult = (e) => {
    const transcript = e.results[0][0].transcript;
    userInput.value = transcript;
    handleUserInput();
  };

  recognition.onend = () => {
    const micBtn = document.getElementById("micBtn");
    micBtn.textContent = "🎤";
    micBtn.style.background = "linear-gradient(135deg, #0ea5e9, #22c55e)";
    isListening = false;
  };
}

function toggleMic() {
  const micBtn = document.getElementById("micBtn");
  if (isListening) {
    recognition.stop();
    micBtn.textContent = "🎤";
    micBtn.style.background = "linear-gradient(135deg, #0ea5e9, #22c55e)";
    isListening = false;
  } else {
    recognition.start();
    micBtn.textContent = "🛑";
    micBtn.style.background = "linear-gradient(135deg, #ef4444, #dc2626)";
    isListening = true;
  }
}

function speak(text) {
  if (synth.speaking) synth.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-US";
  utter.rate = 1.02;
  utter.pitch = 1;
  utter.volume = 1;
  synth.speak(utter);
}

// ---- START APP ----
init();
