const btn = document.getElementById("sendBtn");
const agentText = document.getElementById("agentText");
const userInput = document.getElementById("userInput");

let stage = 0;
let mood = "", energy = "", goals = "";

function speak(text) {
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 1;
  utter.pitch = 1;
  speechSynthesis.speak(utter);
}

function isValidText(text) {
  return text.length > 1 && /[a-zA-Z]/.test(text);
}

btn.onclick = () => {
  const text = userInput.value.trim();
  if (!isValidText(text)) {
    agentText.innerText = "⚠️ Please give a valid response (not empty or numbers only).";
    speak(agentText.innerText);
    return;
  }
  userInput.value = "";

  if (stage === 0) {
    mood = text.toLowerCase();
    agentText.innerText = "Got it 💚 How’s your energy level today (low, medium, high)?";
    speak(agentText.innerText);
    stage++;
  } else if (stage === 1) {
    energy = text.toLowerCase();
    agentText.innerText = "Nice! 🌿 What are 1–3 things you’d like to focus on or do today?";
    speak(agentText.innerText);
    stage++;
  } else if (stage === 2) {
    goals = text;
    let response = "";

    // Mood-based emotional tone
    if (mood.includes("sad") || mood.includes("bad") || mood.includes("tired") || mood.includes("down")) {
      response = "Hey, don’t worry 💚 You’re doing your best, and that’s enough. " +
        "Try a small reset — maybe stretch a bit, take 3 deep breaths, or listen to music 🎧. " +
        "Remember: even slow progress is progress 🌱";
    } else if (mood.includes("happy") || mood.includes("good") || mood.includes("great")) {
      response = "That’s awesome 😄! Keep that happiness flowing and do something kind for yourself today 💫.";
    } else {
      response = "Thanks for sharing 💬. Every emotion is valid — it’s part of being human 🌿.";
    }

    // Energy-based encouragement
    if (energy.includes("low")) {
      response += " Take it slow today — small steps are still wins 💪.";
    } else if (energy.includes("high")) {
      response += " You’ve got great energy today! Use it to do something that makes you proud 🚀.";
    }

    response += `\n\n🗓️ You plan to: ${goals}.`;
    response += "\n\n✨ Thanks for today’s check-in. Remember — tomorrow is a new start 💚";

    // Speak and show text
    agentText.innerText = response;
    speak(response);

    // Save to backend Flask server
    fetch("http://127.0.0.1:5000/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mood,
        energy,
        goals,
        summary: response,
        date: new Date().toLocaleString()
      })
    })
      .then(res => res.json())
      .then(data => console.log("✅ Saved:", data))
      .catch(err => console.error("❌ Error:", err));

    // Hide input & button, then show logs
    setTimeout(() => {
      userInput.style.transition = "opacity 1s";
      btn.style.transition = "opacity 1s";
      userInput.style.opacity = "0";
      btn.style.opacity = "0";
      setTimeout(() => {
        userInput.style.display = "none";
        btn.style.display = "none";
        // after UI finishes, show logs
        showLogs();
      }, 1000);
    }, 3000);

    stage++;
  }
};


// 🔹 NEW: show today's log + button for previous logs
async function showLogs() {
  try {
    const res = await fetch("http://127.0.0.1:5000/logs");
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      console.log("No past check-ins found.");
      return;
    }

    const today = new Date().toLocaleDateString();
    const todayLogs = data.filter(
      log => new Date(log.date).toLocaleDateString() === today
    );
    const pastLogs = data.filter(
      log => new Date(log.date).toLocaleDateString() !== today
    );

    const logDiv = document.createElement("div");
    logDiv.style.marginTop = "20px";
    logDiv.style.background = "#ffffff";
    logDiv.style.padding = "12px";
    logDiv.style.borderRadius = "10px";
    logDiv.style.boxShadow = "0 2px 5px rgba(0,0,0,0.08)";

    logDiv.innerHTML = "<h3>🧘 Today's Check-in</h3>";

    if (todayLogs.length > 0) {
      todayLogs.forEach(entry => {
        logDiv.innerHTML += `<p><strong>${entry.date}</strong><br>
          😌 Mood: ${entry.mood}<br>
          ⚡ Energy: ${entry.energy}<br>
          🎯 Goals: ${entry.goals}</p>`;
      });
    } else {
      logDiv.innerHTML += "<p>No check-in recorded today 🌤️</p>";
    }

    if (pastLogs.length > 0) {
      const btn = document.createElement("button");
      btn.innerText = "📜 View Previous Check-ins";
      btn.style.marginTop = "10px";
      btn.style.padding = "8px 15px";
      btn.style.background = "#8b5cf6";
      btn.style.color = "white";
      btn.style.border = "none";
      btn.style.borderRadius = "8px";
      btn.style.cursor = "pointer";

      const pastDiv = document.createElement("div");
      pastDiv.style.display = "none";

      btn.onclick = () => {
        if (pastDiv.style.display === "none") {
          pastDiv.style.display = "block";
          btn.innerText = "⬆️ Hide Previous Check-ins";
        } else {
          pastDiv.style.display = "none";
          btn.innerText = "📜 View Previous Check-ins";
        }
      };

      let html = "<h3 style='margin-top:15px;'>🗓️ Previous Entries</h3>";
      pastLogs.forEach(entry => {
        html += `<p><strong>${entry.date}</strong><br>
          😌 Mood: ${entry.mood}<br>
          ⚡ Energy: ${entry.energy}<br>
          🎯 Goals: ${entry.goals}</p><hr>`;
      });
      pastDiv.innerHTML = html;

      logDiv.appendChild(btn);
      logDiv.appendChild(pastDiv);
    }

    document.querySelector(".box").appendChild(logDiv);
  } catch (e) {
    console.error("Error loading logs", e);
  }
}
// 🔊 Speak the first greeting when the page loads
window.onload = () => {
  const greeting = "Hello! How are you feeling today?";
  agentText.innerText = greeting;
  speak(greeting);
};
