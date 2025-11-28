from flask import Flask, request, jsonify
from flask_cors import CORS
import json, os, datetime

app = Flask(__name__)
CORS(app)  # enable cross-origin access

@app.route("/save", methods=["POST"])
def save_data():
    data = request.json
    entry = {
        "date": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "mood": data.get("mood"),
        "energy": data.get("energy"),
        "goals": data.get("goals"),
        "summary": data.get("summary", "No summary provided")
    }

    log_file = "wellness_log.json"

    if os.path.exists(log_file):
        with open(log_file, "r") as f:
            logs = json.load(f)
    else:
        logs = []

    logs.append(entry)

    with open(log_file, "w") as f:
        json.dump(logs, f, indent=4)

    return jsonify({"message": "Saved successfully ✅"}), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
