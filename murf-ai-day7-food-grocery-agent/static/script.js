const chatBox = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const beepStart = document.getElementById("beep-start");
const beepStop = document.getElementById("beep-stop");
const cartSummaryDiv = document.getElementById("cartSummary");

let catalog = [];
let cart = [];
let recognition;
let isListening = false;
const synth = window.speechSynthesis;

// Simple conversation state
let state = "normal"; // normal | asking_name | asking_address | awaiting_confirm
let pendingOrder = null;
let customerName = "";
let customerAddress = "";

// Recipes mapping
const recipes = {
  "peanut butter sandwich": ["bread-wheat", "peanut-butter"],
  "sandwich": ["bread-wheat", "peanut-butter"],
  "pasta": ["pasta-500g", "pasta-sauce"]
};

async function init() {
  attachEvents();
  setupVoiceRecognition();
  await loadCatalog();
  greetUser();
  updateCartSummary();
}

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

async function loadCatalog() {
  try {
    const res = await fetch("/catalog");
    catalog = await res.json();
  } catch (e) {
    console.error("Failed to load catalog", e);
  }
}

function greetUser() {
  const msg =
    "Hi, I’m your QuickKart voice assistant. " +
    "I can help you order groceries and simple meal ingredients. " +
    "You can say things like 'add 2 milk and 1 bread', or 'I need ingredients for a peanut butter sandwich'.";
  appendMessage(msg, "agent");
}

function appendMessage(text, sender = "agent") {
  const div = document.createElement("div");
  div.classList.add("bubble", sender);
  div.textContent = text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;

  if (sender === "agent") {
    speak(text);
  }
}

function handleUserInput() {
  const text = userInput.value.trim();
  if (!text) return;
  appendMessage(text, "user");
  userInput.value = "";
  routeInput(text);
}

function routeInput(rawText) {
  const text = rawText.toLowerCase();

  // If we are in a sub-state (name / address / confirm)
  if (state === "asking_name") {
    customerName = rawText.trim();
    state = "asking_address";
    appendMessage(`Thanks ${customerName}. Please tell me your delivery address.`, "agent");
    return;
  }

  if (state === "asking_address") {
    customerAddress = rawText.trim();
    state = "awaiting_confirm";
    const summary = getCartSummaryText();
    appendMessage(
      `Great! Here is your order summary:\n${summary}\n\nShall I place this order now?`,
      "agent"
    );
    return;
  }

  if (state === "awaiting_confirm") {
    if (/\b(yes|yeah|yep|confirm|place it)\b/i.test(rawText)) {
      placeOrder();
    } else if (/\b(no|wait|change)\b/i.test(rawText)) {
      appendMessage("Okay, I won’t place it yet. You can update your cart or add more items.", "agent");
      state = "normal";
    } else {
      appendMessage("Please say yes to place the order, or no to cancel.", "agent");
    }
    return;
  }

  // Normal flow
  if (/what.?s in my cart|show cart|cart/i.test(text)) {
    describeCart();
    return;
  }

  if (/remove|delete/i.test(text)) {
    handleRemove(text);
    return;
  }

  if (/place my order|checkout|that's all|thats all|i'm done|im done/i.test(text)) {
    startCheckout();
    return;
  }

  if (/ingredients for|need ingredients for/i.test(text) || /for .*pasta|for .*sandwich/i.test(text)) {
    handleRecipeRequest(text);
    return;
  }

  // Fallback: try to add items
  handleAddItems(text);
}

function getCatalogItemById(id) {
  return catalog.find((item) => item.id === id);
}

function getCatalogItemByNameFragment(fragment) {
  const lower = fragment.toLowerCase();
  return catalog.find((item) => item.name.toLowerCase().includes(lower));
}

function handleRecipeRequest(text) {
  let matchedKey = null;

  for (const key of Object.keys(recipes)) {
    if (text.includes(key)) {
      matchedKey = key;
      break;
    }
  }

  if (!matchedKey && text.includes("sandwich")) {
    matchedKey = "sandwich";
  }
  if (!matchedKey && text.includes("pasta")) {
    matchedKey = "pasta";
  }

  if (!matchedKey) {
    appendMessage("I’m not sure which recipe you mean. Try saying 'ingredients for a peanut butter sandwich' or 'ingredients for pasta'.", "agent");
    return;
  }

  const ids = recipes[matchedKey];
  const addedNames = [];

  ids.forEach((id) => {
    const item = getCatalogItemById(id);
    if (item) {
      addToCart(item.id, 1);
      addedNames.push(item.name);
    }
  });

  if (addedNames.length > 0) {
    appendMessage(`I’ve added ${addedNames.join(" and ")} for your ${matchedKey}.`, "agent");
    updateCartSummary();
  } else {
    appendMessage("I couldn’t find the ingredients in the catalog.", "agent");
  }
}

function handleAddItems(text) {
  let quantity = 1;
  const qtyMatch = text.match(/(\d+)/);
  if (qtyMatch) {
    quantity = parseInt(qtyMatch[1], 10);
  }

  let matchedAny = false;

  catalog.forEach((item) => {
    const itemName = item.name.toLowerCase();
    if (text.includes(itemName.split(" ")[0]) && text.includes(itemName.split(" ")[1] || itemName)) {
      addToCart(item.id, quantity);
      appendMessage(`Added ${quantity} x ${item.name} to your cart.`, "agent");
      matchedAny = true;
    } else if (text.includes(itemName)) {
      addToCart(item.id, quantity);
      appendMessage(`Added ${quantity} x ${item.name} to your cart.`, "agent");
      matchedAny = true;
    }
  });

  // simple fallback for common words
  if (!matchedAny) {
    if (text.includes("milk")) {
      addToCart("milk-1l", quantity);
      appendMessage(`Added ${quantity} x Fresh Milk 1L to your cart.`, "agent");
      matchedAny = true;
    }
    if (text.includes("bread")) {
      addToCart("bread-wheat", quantity);
      appendMessage(`Added ${quantity} x Whole Wheat Bread to your cart.`, "agent");
      matchedAny = true;
    }
    if (text.includes("eggs")) {
      addToCart("eggs-6", quantity);
      appendMessage(`Added ${quantity} x Eggs Pack (6) to your cart.`, "agent");
      matchedAny = true;
    }
    if (text.includes("chips")) {
      addToCart("chips-masala", quantity);
      appendMessage(`Added ${quantity} x Masala Potato Chips to your cart.`, "agent");
      matchedAny = true;
    }
  }

  if (!matchedAny) {
    appendMessage("I couldn’t match that to any item in the catalog. Try being a bit more specific, like 'add 2 milk' or 'add 1 margherita pizza'.", "agent");
  }

  updateCartSummary();
}

function handleRemove(text) {
  if (cart.length === 0) {
    appendMessage("Your cart is already empty.", "agent");
    return;
  }

  let removed = false;
  catalog.forEach((item) => {
    if (text.includes(item.name.toLowerCase().split(" ")[0]) && text.includes("remove")) {
      removeFromCart(item.id);
      appendMessage(`Removed ${item.name} from your cart.`, "agent");
      removed = true;
    }
  });

  if (!removed) {
    appendMessage("I couldn’t figure out which item to remove. Try saying 'remove the bread' or 'remove milk'.", "agent");
  }

  updateCartSummary();
}

function addToCart(itemId, quantity) {
  const existing = cart.find((entry) => entry.id === itemId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ id: itemId, quantity });
  }
}

function removeFromCart(itemId) {
  cart = cart.filter((entry) => entry.id !== itemId);
}

function describeCart() {
  if (cart.length === 0) {
    appendMessage("Your cart is currently empty.", "agent");
    return;
  }
  const summary = getCartSummaryText();
  appendMessage(`Here is your cart:\n${summary}`, "agent");
}

function getCartSummaryText() {
  if (cart.length === 0) return "Cart is empty.";

  let lines = [];
  let total = 0;

  cart.forEach((entry) => {
    const product = getCatalogItemById(entry.id);
    if (!product) return;
    const lineTotal = product.price * entry.quantity;
    total += lineTotal;
    lines.push(`- ${entry.quantity} x ${product.name} (₹${product.price} each) = ₹${lineTotal}`);
  });

  lines.push(`\nTotal: ₹${total}`);
  return lines.join("\n");
}

function updateCartSummary() {
  if (cart.length === 0) {
    cartSummaryDiv.innerHTML = "<p>Your cart is empty.</p>";
    return;
  }

  let html = "";
  let total = 0;

  cart.forEach((entry) => {
    const product = getCatalogItemById(entry.id);
    if (!product) return;
    const lineTotal = product.price * entry.quantity;
    total += lineTotal;
    html += `<p>${entry.quantity} x ${product.name} – ₹${lineTotal}</p>`;
  });

  html += `<p class="total">Total: ₹${total}</p>`;
  cartSummaryDiv.innerHTML = html;
}

function startCheckout() {
  if (cart.length === 0) {
    appendMessage("Your cart is empty. Add a few items before placing an order.", "agent");
    return;
  }
  state = "asking_name";
  appendMessage("Sure, let’s place your order. To begin, may I know your name?", "agent");
}

async function placeOrder() {
  const itemsForServer = cart.map((entry) => ({
    id: entry.id,
    quantity: entry.quantity
  }));

  const payload = {
    customerName: customerName || "Guest",
    address: customerAddress || "Not provided",
    items: itemsForServer
  };

  try {
    const res = await fetch("/place-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (res.ok) {
      appendMessage(
        `Your order has been placed successfully! 🧾\nOrder ID: ${data.orderId}\nTotal: ₹${data.total}\n\nThank you for ordering with QuickKart.`,
        "agent"
      );
      cart = [];
      updateCartSummary();
      state = "normal";
    } else {
      appendMessage("Something went wrong while placing your order. Please try again.", "agent");
    }
  } catch (e) {
    console.error("Order placement error", e);
    appendMessage("There was a problem connecting to the server. Please try again.", "agent");
  }
}

// 🎤 Voice recognition
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
    if (micBtn) micBtn.classList.remove("active");
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
    recognition.start();
    micBtn.classList.add("active");
    beepStart.play();
    isListening = true;
  }
}

// 🗣️ Voice output
function speak(text) {
  if (!synth) return;
  if (synth.speaking) synth.cancel();

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-US";
  utter.rate = 1;
  utter.pitch = 1;
  synth.speak(utter);
}

init();
