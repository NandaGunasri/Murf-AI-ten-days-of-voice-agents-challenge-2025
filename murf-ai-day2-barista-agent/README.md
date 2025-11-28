# ☕ murf-ai-day2-barista-agent  
Submission for **Day 2 – Coffee Shop Barista Agent | Murf AI Voice Agents Challenge 2025**

### 💡 About
This is my **Day 2** submission for the **Murf AI Voice Agents Challenge**.  
I built a friendly **Coffee Shop Barista Voice Agent** that takes coffee orders, speaks like a real barista, and shows a JSON order summary.

---

### 🎯 Features
- Greets the user: *“Welcome to Guna’s Coffee Corner ☕!”*  
- Asks for:
  - drink type  
  - size  
  - milk preference  
  - extras  
  - name  
- Saves answers in an order object:
  ```json
  {
    "drinkType": "string",
    "size": "string",
    "milk": "string",
    "extras": ["string"],
    "name": "string"
  }
