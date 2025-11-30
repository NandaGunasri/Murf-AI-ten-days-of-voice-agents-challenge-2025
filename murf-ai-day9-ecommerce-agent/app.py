from flask import Flask, jsonify, request, send_from_directory
from datetime import datetime
import json
import os

app = Flask(__name__, static_folder="static")

# ------------------------------
# Catalog data
# ------------------------------
PRODUCTS = [
    {"id": "mug-001", "name": "Stoneware Coffee Mug", "price": 800, "currency": "INR", "category": "mug"},
    {"id": "shirt-001", "name": "Classic Black T-Shirt", "price": 499, "currency": "INR", "category": "t-shirt"},
    {"id": "hoodie-001", "name": "Grey Hoodie", "price": 999, "currency": "INR", "category": "hoodie"},
    {"id": "cup-001", "name": "Blue Ceramic Cup", "price": 350, "currency": "INR", "category": "cup"}
]

ORDERS_FILE = "orders.json"

# ------------------------------
# Serve the main page
# ------------------------------
@app.route("/")
def index():
    return send_from_directory("static", "index.html")

# ------------------------------
# Serve static files (CSS + JS)
# ------------------------------
@app.route("/<path:path>")
def static_files(path):
    return send_from_directory("static", path)

# ------------------------------
# API endpoints
# ------------------------------
@app.route("/catalog")
def catalog():
    return jsonify(PRODUCTS)

@app.route("/order", methods=["POST"])
def create_order():
    data = request.get_json()
    items = data.get("items", [])
    total = 0
    order_items = []

    for i in items:
        product = next((p for p in PRODUCTS if p["id"] == i["product_id"]), None)
        if product:
            qty = i.get("quantity", 1)
            total += product["price"] * qty
            order_items.append({
                "product_id": product["id"],
                "product_name": product["name"],
                "price": product["price"],
                "quantity": qty
            })

    order = {
        "id": f"order-{int(datetime.now().timestamp())}",
        "items": order_items,
        "total": total,
        "currency": "INR",
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }

    # Save to file
    if os.path.exists(ORDERS_FILE):
        with open(ORDERS_FILE, "r") as f:
            orders = json.load(f)
    else:
        orders = []
    orders.append(order)
    with open(ORDERS_FILE, "w") as f:
        json.dump(orders, f, indent=2)

    return jsonify(order)

@app.route("/orders")
def get_orders():
    if not os.path.exists(ORDERS_FILE):
        return jsonify([])
    with open(ORDERS_FILE, "r") as f:
        return jsonify(json.load(f))

# ------------------------------
if __name__ == "__main__":
    print("🛍️ Voice E-Commerce Agent running at http://127.0.0.1:5000")
    app.run(debug=True)
