from flask import Flask, request, jsonify
from flask_pymongo import PyMongo
from flask_cors import CORS
from dotenv import load_dotenv
import os
from datetime import datetime, timedelta
from twilio.twiml.messaging_response import MessagingResponse
import re
from bson import ObjectId
from functools import wraps
import jwt
import hashlib

# Initialize Flask app
app = Flask(__name__)
CORS(app, supports_credentials=True)

# Load environment variables
load_dotenv()
app.config["MONGO_URI"] = os.getenv("MONGO_URI")
app.config["SECRET_KEY"] = os.getenv("FLASK_SECRET_KEY")
app.config["JWT_SECRET"] = os.getenv("JWT_SECRET")
app.config["JWT_EXPIRATION"] = timedelta(hours=1)

mongo = PyMongo(app)

# Enhanced SMS parser with regex patterns
SMS_PATTERNS = [
    (r'(?:spent|paid|debited)\s*(\d+\.?\d*)\s*(?:on|for)\s*(.+)', 'expense'),
    (r'(?:received|credited|deposited)\s*(\d+\.?\d*)\s*(?:from|for)\s*(.+)', 'income')
]

# JWT Authentication decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        try:
            data = jwt.decode(token.split()[1], app.config['JWT_SECRET'], algorithms=["HS256"])
            current_user = mongo.db.users.find_one({'_id': ObjectId(data['user_id'])})
        except:
            return jsonify({'message': 'Token is invalid!'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

# Enhanced SMS processing endpoint
@app.route('/sms', methods=['POST'])
def sms_reply():
    msg = request.form.get('Body').lower()
    sender = request.form.get('From')
    
    transaction = None
    for pattern, t_type in SMS_PATTERNS:
        match = re.search(pattern, msg)
        if match:
            transaction = {
                'amount': float(match.group(1)),
                'type': t_type,
                'description': match.group(2).strip(),
                'date': datetime.now(),
                'source': 'sms',
                'category': 'auto-detected'
            }
            break
    
    if not transaction:
        # Fallback to simple amount detection
        amount = re.search(r'\d+\.?\d*', msg)
        if amount:
            transaction = {
                'amount': float(amount.group()),
                'type': 'expense',
                'description': msg,
                'date': datetime.now(),
                'source': 'sms',
                'category': 'uncategorized'
            }
    
    if transaction:
        mongo.db.transactions.insert_one(transaction)
        resp = MessagingResponse()
        resp.message(f"Recorded {transaction['type']} of ₹{transaction['amount']} for {transaction['description']}")
        return str(resp)
    
    resp = MessagingResponse()
    resp.message("Could not process transaction. Please use format: 'Paid 500 for groceries'")
    return str(resp)

# User registration endpoint
@app.route('/register', methods=['POST'])
def register():
    data = request.json
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'message': 'Email and password required'}), 400
    
    if mongo.db.users.find_one({'email': data['email']}):
        return jsonify({'message': 'User already exists'}), 400
    
    hashed_password = hashlib.sha256(data['password'].encode()).hexdigest()
    user_id = mongo.db.users.insert_one({
        'email': data['email'],
        'password': hashed_password,
        'created_at': datetime.now()
    }).inserted_id
    
    return jsonify({'status': 'success', 'user_id': str(user_id)}), 201

# User login endpoint
@app.route('/login', methods=['POST'])
def login():
    auth = request.json
    if not auth or not auth.get('email') or not auth.get('password'):
        return jsonify({'message': 'Email and password required'}), 400
    
    user = mongo.db.users.find_one({'email': auth['email']})
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    hashed_password = hashlib.sha256(auth['password'].encode()).hexdigest()
    if user['password'] != hashed_password:
        return jsonify({'message': 'Invalid credentials'}), 401
    
    token = jwt.encode({
        'user_id': str(user['_id']),
        'exp': datetime.utcnow() + app.config["JWT_EXPIRATION"]
    }, app.config['JWT_SECRET'])
    
    return jsonify({'token': token}), 200

# Enhanced transactions API
@app.route('/transactions', methods=['GET', 'POST'])
@token_required
def transactions(current_user):
    if request.method == 'POST':
        transaction = request.json
        transaction.update({
            'date': datetime.now(),
            'user_id': current_user['_id']
        })
        mongo.db.transactions.insert_one(transaction)
        return jsonify({"status": "success"}), 201
    
    # Get transactions with filters
    query = {'user_id': current_user['_id']}
    
    # Date range filter
    if request.args.get('start_date'):
        query['date'] = {'$gte': datetime.fromisoformat(request.args['start_date'])}
    if request.args.get('end_date'):
        if 'date' in query:
            query['date']['$lte'] = datetime.fromisoformat(request.args['end_date'])
        else:
            query['date'] = {'$lte': datetime.fromisoformat(request.args['end_date'])}
    
    # Type filter
    if request.args.get('type'):
        query['type'] = request.args['type']
    
    # Category filter
    if request.args.get('category'):
        query['category'] = request.args['category']
    
    transactions = list(mongo.db.transactions.find(query, {'_id': 0}).sort('date', -1))
    return jsonify(transactions)

# Statistics endpoint
@app.route('/stats', methods=['GET'])
@token_required
def stats(current_user):
    pipeline = [
        {'$match': {'user_id': current_user['_id']}},
        {'$group': {
            '_id': '$type',
            'total': {'$sum': '$amount'},
            'count': {'$sum': 1}
        }}
    ]
    stats = list(mongo.db.transactions.aggregate(pipeline))
    
    # Calculate monthly spending
    monthly_pipeline = [
        {'$match': {
            'user_id': current_user['_id'],
            'type': 'expense',
            'date': {'$gte': datetime.now() - timedelta(days=30)}
        }},
        {'$group': {
            '_id': None,
            'monthly_spending': {'$sum': '$amount'}
        }}
    ]
    monthly_stats = list(mongo.db.transactions.aggregate(monthly_pipeline))
    
    return jsonify({
        'stats': stats,
        'monthly_spending': monthly_stats[0]['monthly_spending'] if monthly_stats else 0
    })

# Budget management
@app.route('/budget', methods=['GET', 'POST'])
@token_required
def budget(current_user):
    if request.method == 'POST':
        budget_data = request.json
        mongo.db.budgets.update_one(
            {'user_id': current_user['_id']},
            {'$set': {
                'amount': budget_data['amount'],
                'categories': budget_data.get('categories', {}),
                'updated_at': datetime.now()
            }},
            upsert=True
        )
        return jsonify({'status': 'success'})
    
    budget_data = mongo.db.budgets.find_one({'user_id': current_user['_id']})
    return jsonify(budget_data or {})

# Enhanced clear data endpoint
@app.route('/clear', methods=['POST'])
@token_required
def clear_data(current_user):
    if request.json.get('confirm') == 'DELETE_ALL_MY_DATA':
        result = mongo.db.transactions.delete_many({'user_id': current_user['_id']})
        return jsonify({
            'status': 'success',
            'deleted_count': result.deleted_count
        })
    return jsonify({'status': 'error', 'message': 'Confirmation required'}), 400

if __name__ == '__main__':
    app.run(debug=True, port=8000)
