from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import json
import os
from datetime import datetime

app = Flask(__name__, static_folder="static", static_url_path="")
CORS(app)

BASE_DIR = os.path.dirname(__file__)
CATALOG_FILE = os.path.join(BASE_DIR, "catalog.json")
ORDERS_FILE = os.path.join(BASE_DIR, "orders.json")


def load_catalog():
    with open(CATALOG_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def load_orders():
    if not os.path.exists(ORDERS_FILE):
        return []
    with open(ORDERS_FILE, "r", encoding="utf-8") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []


def save_orders(orders):
    with open(ORDERS_FILE, "w", encoding="utf-8") as f:
        json.dump(orders, f, indent=2)


@app.route("/")
def index():
    return send_from_directory(app.static_folder, "index.html")


@app.route("/catalog", methods=["GET"])
def get_catalog():
    catalog = load_catalog()
    return jsonify(catalog)


@app.route("/place-order", methods=["POST"])
def place_order():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    customer_name = data.get("customerName", "Guest")
    address = data.get("address", "Not provided")
    cart_items = data.get("items", [])

    if not cart_items:
        return jsonify({"error": "Cart is empty"}), 400

    catalog = {item["id"]: item for item in load_catalog()}

    total = 0
    enriched_items = []
    for entry in cart_items:
        item_id = entry.get("id")
        qty = entry.get("quantity", 1)
        product = catalog.get(item_id)
        if not product:
            continue
        line_total = product["price"] * qty
        total += line_total
        enriched_items.append({
            "id": item_id,
            "name": product["name"],
            "quantity": qty,
            "unit_price": product["price"],
            "line_total": line_total
        })

    orders = load_orders()
    order_id = len(orders) + 1

    order_obj = {
        "orderId": order_id,
        "customerName": customer_name,
        "address": address,
        "items": enriched_items,
        "total": total,
        "currency": "INR",
        "status": "received",
        "timestamp": datetime.now().isoformat(timespec="seconds")
    }

    orders.append(order_obj)
    save_orders(orders)

    print(f"🧾 New order placed: #{order_id} – {customer_name} – ₹{total}")
    return jsonify({
        "message": "Order placed successfully",
        "orderId": order_id,
        "total": total
    })


if __name__ == "__main__":
    print("🚀 Day 7 – Food & Grocery Ordering Voice Agent running at http://127.0.0.1:5000")
    app.run(debug=True, port=5000)
