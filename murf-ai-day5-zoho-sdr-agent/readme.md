# 🎧 Murf AI Voice Agents Challenge – Day 5  
## 🏢 Zoho SDR Voice Agent (FAQ + Lead Capture)

This project is part of the **#MurfAIVoiceAgentsChallenge (Day 5)**.  
It demonstrates a **Sales Development Representative (SDR)** voice agent for **Zoho**, capable of answering company FAQs, collecting lead details, and summarizing them at the end of the chat.

---

## 🎯 Objective

Build a **Simple FAQ + Lead Capture Agent** that acts as a virtual Zoho SDR.  
It greets users, answers common questions, collects essential lead details, and generates an end-of-call summary.

---

## 🧠 Features

✅ Warm greeting and natural voice interaction  
✅ Answers questions about **Zoho’s products, pricing, and features** using `company_faq.json`  
✅ Smoothly collects lead info:
- Name  
- Company  
- Email  
- Role  
- Use Case  
- Team Size  
- Timeline  

✅ Detects when the user says “That’s all”, “Thanks”, or “I’m done”  
✅ Provides a spoken + text **summary of the lead**  
✅ Stores all data in a local `leads.json` file via Flask backend  

---

## 🗂️ Folder Structure

```
murf-ai-day5-zoho-sdr-agent/
│
├── index.html             # Frontend UI
├── script.js              # Chat + Voice logic
├── server.py              # Flask backend to store leads
├── company_faq.json       # Zoho FAQ and company data
└── leads.json             # Auto-generated lead storage file
```

---

## ⚙️ Setup Instructions

### 1️⃣ Install Dependencies

```bash
pip install flask flask-cors
```

### 2️⃣ Run the Backend

```bash
python server.py
```

This starts a Flask server on  
👉 **http://127.0.0.1:5000**

### 3️⃣ Run the Frontend

Open a new terminal and run:

```bash
python -m http.server 8000
```

Then open:  
👉 **http://localhost:8000/murf-ai-day5-zoho-sdr-agent/**

---

## 💬 Example Prompts

```
👤 User: What is Zoho?
🤖 Agent: Zoho is an Indian SaaS company offering 50+ apps for CRM, HR, Finance, and more.

👤 User: Do you have a free plan?
🤖 Agent: Yes, Zoho CRM and many other apps have free tiers and trials.

👤 User: I’m interested in using it for my team.
🤖 Agent: Great! May I have your name and company details?

...
👤 User: That’s all.
🤖 Agent: Here’s your summary... (reads back your info)
```

---

## 🧾 Data Stored in `leads.json`

Each session appends a new entry:

```json
[
  {
    "name": "Alex",
    "company": "Techverse",
    "email": "alex@techverse.com",
    "role": "Manager",
    "use_case": "CRM Automation",
    "team_size": "10",
    "timeline": "soon",
    "summary": "Lead details summary...",
    "conversation": [...],
    "created_at": "2025-11-26 11:15:00"
  }
]
```

---

## 🪄 Tech Stack

- **HTML, CSS, JavaScript (Frontend UI)**  
- **Flask (Backend API)**  
- **JSON (Data Storage)**  
- **SpeechSynthesis API** for browser voice  

---

## 🚀 How It Works

1. The user greets or asks a company-related question.  
2. The agent answers using `company_faq.json`.  
3. The conversation naturally transitions to collecting lead data.  
4. On “Thanks” or “That’s all,” the agent summarizes and stores the lead.  

---

## ✨ Challenge Goal Achieved

✅ Acts as an SDR for a real Indian company (Zoho)  
✅ Answers FAQ-based questions from local data  
✅ Collects and stores structured lead info  
✅ Generates a personalized verbal + text summary  

---

## 🏷️ Credits

Built for **Murf AI Voice Agents Challenge – Day 5**  
💡 Using the fastest TTS API – **Murf Falcon**  

**#MurfAIVoiceAgentsChallenge**  
**#10DaysofAIVoiceAgents**  
**#VoiceAI #AIinSales #Zoho #AIAgent #FlaskApp**
