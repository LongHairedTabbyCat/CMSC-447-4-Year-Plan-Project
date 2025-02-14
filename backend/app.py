# Import necessary libraries
import os
from flask import Flask, jsonify, request  # Flask for creating the API, jsonify for returning JSON responses
from flask_sqlalchemy import SQLAlchemy    # SQLAlchemy for database interactions
from flask_cors import CORS                # CORS to allow frontend (React) to make requests to the backend
from dotenv import load_dotenv

load_dotenv()

# Initialize the Flask app
app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Resource Sharing (CORS) to allow frontend to communicate with backend

# Use environment variables for database credentials
DB_USER = os.getenv('DB_USER', 'root')  # Default to 'root' if not set
DB_PASSWORD = os.getenv('DB_PASSWORD', '')
DB_NAME = os.getenv('DB_NAME', 'project_db')
DB_HOST = os.getenv('DB_HOST', 'localhost')

app.config['SQLALCHEMY_DATABASE_URI'] = f'mysql+mysqlconnector://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize the database with SQLAlchemy
db = SQLAlchemy(app)

# -------------------- Database Model --------------------

# Define a User model (represents a table in the database)
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)  # Primary key, auto-incremented
    name = db.Column(db.String(100), nullable=False)  # User's name (String, required)
    email = db.Column(db.String(100), unique=True, nullable=False)  # User's email (must be unique, required)

    # Convert the object to a dictionary (useful for JSON responses)
    def to_dict(self):
        return {"id": self.id, "name": self.name, "email": self.email}

# Create database tables if they don’t exist
with app.app_context():
    db.create_all()

# -------------------- API Routes --------------------

# Endpoint to GET all users from the database
@app.route('/users', methods=['GET'])
def get_users():
    users = User.query.all()  # Retrieve all user records
    return jsonify([user.to_dict() for user in users])  # Return a list of users as JSON

# Endpoint to POST (add) a new user
@app.route('/users', methods=['POST'])
def add_user():
    data = request.json  # Get JSON data sent by the frontend
    new_user = User(name=data['name'], email=data['email'])  # Create a new User object
    db.session.add(new_user)  # Add the new user to the session
    db.session.commit()  # Commit changes to the database
    return jsonify(new_user.to_dict()), 201  # Return the new user as JSON with HTTP status 201 (Created)

# -------------------- Run the Flask App --------------------

if __name__ == '__main__':
    app.run(debug=True)  # Run the app in debug mode (useful for development)
