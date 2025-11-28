# Day 6 – Fraud Alert Voice Agent (Murf AI Voice Agents Challenge)

## 🔍 Overview

This project is a **Fraud Alert Voice Agent** for a fictional bank (**Aurora Bank**) built for **Day 6** of the _Murf AI Voice Agents Challenge_.

The agent:

- Loads a **fake fraud case** from a simple JSON "database"
- Calls the user (in the browser) as a **fraud protection assistant**
- Performs a **basic, safe verification step**
- Reads out a **suspicious transaction**
- Asks the user if they made the transaction (yes / no)
- Updates the case status in the database as:
  - `confirmed_safe`
  - `confirmed_fraud`
  - `verification_failed`

All data is **fake** and strictly for demo/sandbox use.

---

## 🧠 Features

- 🗣️ **Voice Output** using `SpeechSynthesis` (browser TTS)
- 🎤 **Voice Input** using `webkitSpeechRecognition` (browser STT)
- 📂 JSON-based “database” of fraud cases
- ✅ Simple verification via a **security question**
- 🔁 Clear call flow:
  1. Introduction as bank fraud department
  2. Ask for user name
  3. Load matching fraud case
  4. Ask security question
  5. Read suspicious transaction
  6. Ask if transaction is legitimate
  7. Update database with final status + outcome note

---

## 🧩 Tech Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Python, Flask, Flask-CORS
- **“Database”:** JSON file (`fraud_cases.json`)
- **Voice:**
  - `SpeechSynthesisUtterance` for TTS
  - `webkitSpeechRecognition` for STT (Chrome)

---

## 🗂️ Project Structure

```text
murf-ai-day6-fraud-alert-agent/
│
├── fraud_cases.json      # Fake fraud cases
├── server.py             # Flask backend to load & update cases
├── index.html            # Minimal browser UI
├── script.js             # Voice + fraud call flow
└── README.md
