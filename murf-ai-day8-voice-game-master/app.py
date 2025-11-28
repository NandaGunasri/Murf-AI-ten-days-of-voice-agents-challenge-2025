from flask import Flask, jsonify, request, send_from_directory

app = Flask(__name__, static_folder='static')

@app.route('/')
def serve_index():
    return send_from_directory('static', 'index.html')

@app.route('/<path:filename>')
def serve_static_files(filename):
    return send_from_directory('static', filename)

@app.route('/story', methods=['GET', 'POST'])
def story():
    if request.method == 'GET':
        return jsonify({
            "reply": "You hear the calm voice of your Game Master: You are the hero of this story. "
                     "I will describe what happens, and you tell me what you do. You can speak or type your actions. Let's begin.",
            "world": "Shards of the Skyfire",
            "tone": "Fantasy Adventure • Dramatic but friendly",
        })
    
    data = request.get_json()
    user_input = data.get('message', '').lower()

    if 'woods' in user_input:
        reply = ("You head into the Whispering Woods. The trees rise tall and dark. "
                 "A faint blue glow pulses deeper within. The path splits ahead — "
                 "a narrow hunter's trail or a safer road. What do you do?")
    elif 'traveler' in user_input or 'traveller' in user_input:
        reply = ("You approach the traveler. He nods slowly. "
                 "'Beware the spirits,' he warns. 'They test those who seek the crystal.'")
    elif 'spirits' in user_input:
        reply = ("You bow to the spirits. They whisper softly: "
                 "'Only courage reveals the true path.' A cold wind sweeps past you.")
    elif 'crystal' in user_input:
        reply = ("You grab the crystal. It hums with ancient energy, illuminating the forest. "
                 "The world shifts — you glimpse a glowing portal forming ahead!")
    elif 'restart' in user_input:
        reply = "The story resets. You stand once again at the edge of Emberfall Village."
    else:
        reply = ("The world seems unsure what you mean. Try saying things like: "
                 "'head into the woods', 'talk to the traveler', 'bow to the spirits', or 'grab the crystal'.")

    return jsonify({"reply": reply})

if __name__ == "__main__":
    print("🎮 Voice Game Master running on http://127.0.0.1:5000")
    app.run(debug=True)
