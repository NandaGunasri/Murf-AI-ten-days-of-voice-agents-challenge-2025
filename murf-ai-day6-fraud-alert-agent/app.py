from flask import Flask, jsonify, request, send_from_directory
import json
from flask_cors import CORS
import os

app = Flask(__name__, static_folder="static", static_url_path="")
CORS(app)

DATA_FILE = os.path.join(os.path.dirname(__file__), "fraud_cases.json")

def load_cases():
    with open(DATA_FILE, "r") as f:
        return json.load(f)

def save_cases(cases):
    with open(DATA_FILE, "w") as f:
        json.dump(cases, f, indent=2)

@app.route("/")
def index():
    return send_from_directory(app.static_folder, "index.html")

@app.route("/fraud-case", methods=["GET"])
def get_case():
    userName = request.args.get("userName", "").strip()
    print(f"🔍 Looking for case with userName='{userName}'")

    cases = load_cases()
    for case in cases:
        if case["userName"].lower() == userName.lower():  # Case-insensitive match
            print("✅ Found matching case:", case["userName"])
            return jsonify(case)
    print("❌ No case found for", userName)
    return jsonify({"error": "Case not found"}), 404

@app.route("/fraud-case", methods=["POST"])
def update_case():
    data = request.get_json()
    userName = data.get("userName")
    status = data.get("status")
    outcomeNote = data.get("outcomeNote")

    print(f"📝 Updating case for {userName}: {status} – {outcomeNote}")

    cases = load_cases()
    for case in cases:
        if case["userName"].lower() == userName.lower():
            case["status"] = status
            case["outcomeNote"] = outcomeNote
            save_cases(cases)
            print("✅ Case updated successfully!")
            return jsonify({"success": True})

    print("⚠️ Could not find case to update.")
    return jsonify({"error": "Case not found"}), 404

if __name__ == "__main__":
    print("🚀 Starting Fraud Alert Voice Agent backend on http://127.0.0.1:5500")
    app.run(debug=True,port=5500)
