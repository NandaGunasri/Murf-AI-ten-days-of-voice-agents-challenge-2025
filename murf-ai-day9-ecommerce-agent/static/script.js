const chatBox = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

async function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  appendMessage(message, "user");
  userInput.value = "";

  let reply = "";

  try {
    if (message.toLowerCase().includes("last order")) {
      const res = await fetch("/orders");
      const orders = await res.json();

      if (!orders.length) {
        reply = "You haven’t placed any orders yet.";
      } else {
        const last = orders[orders.length - 1];
        const items = last.items.map(i => `${i.product_name} (₹${i.price})`).join(", ");
        reply = `🧾 Your last order (${last.id}) includes ${items}. Total: ₹${last.total}.`;
      }
    } else if (message.toLowerCase().includes("buy")) {
      const res = await fetch("/catalog");
      const catalog = await res.json();

      let product = catalog.find(p =>
        message.toLowerCase().includes(p.name.toLowerCase()) ||
        message.toLowerCase().includes(p.category.toLowerCase())
      );

      if (!product) reply = "Sorry, I couldn’t find that item.";
      else {
        const orderRes = await fetch("/order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: [{ product_id: product.id, quantity: 1 }] })
        });
        const order = await orderRes.json();
        reply = `✅ Order placed! You bought ${product.name} for ₹${product.price}. Total: ₹${order.total}.`;
      }
    } else {
      const res = await fetch("/catalog");
      const data = await res.json();
      const list = data.map(p => `${p.name} – ₹${p.price}`).join("\n");
      reply = `Here are some products:\n${list}`;
    }
  } catch (err) {
    reply = "⚠️ Something went wrong.";
  }

  appendMessage(reply, "bot");
  speak(reply);
}

function appendMessage(text, sender) {
  const msg = document.createElement("div");
  msg.className = sender === "user" ? "bubble player" : "bubble gm";
  msg.textContent = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function speak(text) {
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 1;
  utter.pitch = 1;
  speechSynthesis.speak(utter);
}

sendBtn.addEventListener("click", sendMessage);
userInput.addEventListener("keypress", e => {
  if (e.key === "Enter") sendMessage();
});
