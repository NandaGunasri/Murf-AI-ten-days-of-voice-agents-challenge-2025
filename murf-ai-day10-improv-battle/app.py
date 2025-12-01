import random
import datetime
from flask import Flask, jsonify, request, send_from_directory

app = Flask(
    __name__,
    static_folder="static",
    static_url_path=""
)

# --- Simple in-memory improv state (single-player local demo) ---

improv_state = {
    "player_name": None,
    "current_round": 0,
    "max_rounds": 3,
    "rounds": [],  # each: {"scenario": str, "player_lines": str, "host_reaction": str}
    "phase": "idle",  # "idle" | "awaiting_improv" | "reacting" | "done"
    "current_scenario": None,
    "created_at": None,
}

SCENARIOS = [
    "You are a time-travelling tour guide explaining modern smartphones to someone from the 1800s.",
    "You are a barista who has to tell a customer that their latte is actually a portal to another dimension.",
    "You are a restaurant waiter who must calmly tell a customer that their order has escaped the kitchen.",
    "You are a customer trying to return an obviously cursed object to a very skeptical shop owner.",
    "You are a teacher who just discovered the class goldfish can talk, but only during parent-teacher meetings.",
]

SUPPORTIVE_REACTIONS = [
    "That was fantastic! I loved how you committed to the character.",
    "Brilliant energy! The way you leaned into the absurdity really worked.",
    "Nice! You kept the scene moving and added some fun detail.",
]

NEUTRAL_REACTIONS = [
    "Interesting take! I think you could push the character even further next time.",
    "Not bad at all. There were some fun moments, but you can slow down and explore more.",
    "Cool idea. With a bit more emotion it could really pop.",
]

CRITICAL_REACTIONS = [
    "That one felt a little rushed; you could have stayed in the moment longer.",
    "You had a good setup, but you pulled away just when it got juicy.",
    "I wanted a bit more commitment to the character there — don’t be afraid to be big and weird!",
]


def pick_reaction():
    """Pick a reaction with mixed tone: supportive / neutral / mildly critical."""
    bucket = random.choices(
        population=["supportive", "neutral", "critical"],
        weights=[0.4, 0.35, 0.25],
        k=1,
    )[0]

    if bucket == "supportive":
        return random.choice(SUPPORTIVE_REACTIONS)
    if bucket == "neutral":
        return random.choice(NEUTRAL_REACTIONS)
    return random.choice(CRITICAL_REACTIONS)


def next_scenario():
    return random.choice(SCENARIOS)


# ---------- Routes ----------


@app.route("/")
def index():
    # serve static/index.html
    return send_from_directory("static", "index.html")


@app.route("/api/state", methods=["GET"])
def get_state():
    return jsonify(improv_state)


@app.route("/api/start", methods=["POST"])
def start_game():
    data = request.get_json(force=True)
    name = (data.get("player_name") or "").strip()
    if not name:
        name = "Mystery Player"

    improv_state["player_name"] = name
    improv_state["current_round"] = 0
    improv_state["rounds"] = []
    improv_state["phase"] = "awaiting_improv"
    improv_state["current_scenario"] = next_scenario()
    improv_state["created_at"] = datetime.datetime.utcnow().isoformat()

    intro = (
        f"Welcome to Improv Battle, {name}! "
        "I’m your high-energy host. We’ll play three short improv rounds. "
        "I’ll give you a scenario, you act it out, then I react with brutally honest but friendly feedback.\n\n"
        f"Round 1: {improv_state['current_scenario']} "
        "Whenever you’re ready, dive into the scene! When you’re done, say something like 'end scene'."
    )

    return jsonify({
        "host_reply": intro,
        "state": improv_state
    })


@app.route("/api/player-turn", methods=["POST"])
def player_turn():
    data = request.get_json(force=True)
    text = (data.get("text") or "").strip()

    # Early exit
    if any(kw in text.lower() for kw in ["stop game", "quit game", "end show", "exit game"]):
        improv_state["phase"] = "done"
        closing = (
            "Got it, we’ll end the show here. Thanks for jumping into Improv Battle! "
            "You were a brave performer — come back any time for another round of chaos. 🎭"
        )
        return jsonify({"host_reply": closing, "state": improv_state})

    phase = improv_state.get("phase", "idle")

    if phase in ("idle", "done"):
        # Game not started or already finished
        msg = (
            "Improv Battle isn’t currently running. Refresh the page and hit "
            "'Start Improv Battle' to play a new game."
        )
        return jsonify({"host_reply": msg, "state": improv_state})

    if phase == "awaiting_improv":
        # Player just performed. Store their lines.
        current_round = improv_state["current_round"]
        scenario = improv_state["current_scenario"] or "Unknown scenario"

        reaction = pick_reaction()
        improv_state["rounds"].append({
            "round": current_round + 1,
            "scenario": scenario,
            "player_lines": text,
            "host_reaction": reaction,
        })

        improv_state["current_round"] += 1

        # Decide if we’re done or moving to next round
        if improv_state["current_round"] >= improv_state["max_rounds"]:
            improv_state["phase"] = "done"

            # Build short closing summary
            moments = []
            for r in improv_state["rounds"]:
                snippet = r["scenario"]
                moments.append(f"Round {r['round']}: {snippet}")

            moments_text = " • ".join(moments) if moments else "a whirlwind of strange scenes"

            closing = (
                f"{reaction}\n\n"
                f"And that wraps our final round! Overall, you played a performer who loves "
                f"leaning into unusual situations. Highlights: {moments_text}.\n\n"
                "Thanks for playing Improv Battle! 🎤🎭"
            )

            return jsonify({"host_reply": closing, "state": improv_state})

        # Not done yet → prepare next scenario
        improv_state["phase"] = "awaiting_improv"
        improv_state["current_scenario"] = next_scenario()
        next_round = improv_state["current_round"] + 1

        host_text = (
            f"{reaction}\n\n"
            f"Alright, let’s jump to Round {next_round}! "
            f"Your next scenario:\n{improv_state['current_scenario']}\n\n"
            "Act it out in character, and say 'end scene' when you’re done."
        )

        return jsonify({"host_reply": host_text, "state": improv_state})

    # Fallback (shouldn’t really happen)
    return jsonify({
        "host_reply": "Hmm, something went out of rhythm in the control room. "
                      "Try refreshing the page to restart Improv Battle.",
        "state": improv_state,
    })


if __name__ == "__main__":
    print("🎭 Improv Battle host warming up on http://127.0.0.1:5000")
    app.run(debug=True)
