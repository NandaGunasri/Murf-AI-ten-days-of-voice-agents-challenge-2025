from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/submit-lead', methods=['POST'])
def submit_lead():
    data = request.get_json()
    print("📩 Received Lead Data:")
    print(data)
    # In real use, you’d send this to Zoho CRM API here.
    return jsonify({"status": "success", "message": "Lead data received successfully!"})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
