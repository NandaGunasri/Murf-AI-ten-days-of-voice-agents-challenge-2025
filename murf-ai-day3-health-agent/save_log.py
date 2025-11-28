import json, sys, datetime, os

def main():
    try:
        # Read JSON data from the frontend
        data = json.load(sys.stdin)

        # Create an entry with timestamp
        entry = {
            "date": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "mood": data.get("mood"),
            "energy": data.get("energy"),
            "goals": data.get("goals")
        }

        log_file = "wellness_log.json"

        # Read existing logs or create new
        if os.path.exists(log_file):
            with open(log_file, "r") as f:
                logs = json.load(f)
        else:
            logs = []

        # Add new entry
        logs.append(entry)

        # Write updated data
        with open(log_file, "w") as f:
            json.dump(logs, f, indent=4)

        print("Saved successfully ✅")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
