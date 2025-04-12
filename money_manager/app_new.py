from flask import Flask, jsonify, request
from flask_cors import CORS
import uuid
from datetime import datetime

app = Flask(__name__)
CORS(app)

# In-memory data stores
transactions = []
categories = [
    {"id": str(uuid.uuid4()), "name": "Account", "type": "asset"},
    {"id": str(uuid.uuid4()), "name": "Cash", "type": "asset"},
    {"id": str(uuid.uuid4()), "name": "Card", "type": "asset"}
]

@app.route('/api/transactions', methods=['GET', 'POST'])
def handle_transactions():
    if request.method == 'POST':
        data = request.json
        transaction = {
            "id": str(uuid.uuid4()),
            "amount": float(data['amount']),
            "type": data['type'],
            "description": data['description'],
            "category": data['category'],
            "date": data['date'],
            "created_at": datetime.now().isoformat()
        }
        transactions.append(transaction)
        return jsonify({"status": "success", "data": transaction})
    else:
        return jsonify({"status": "success", "data": transactions})

@app.route('/api/categories', methods=['GET'])
def get_categories():
    return jsonify({"status": "success", "data": categories})

@app.route('/api/reports', methods=['GET'])
def get_reports():
    income = sum(t['amount'] for t in transactions if t['type'] == 'income')
    expenses = sum(t['amount'] for t in transactions if t['type'] == 'expense')
    return jsonify({
        "income": income,
        "expenses": expenses,
        "balance": income - expenses
    })

if __name__ == '__main__':
    app.run(debug=True, port=8001)