# Import necessary libraries
import os
from flask import Flask, jsonify, request  # Flask for creating the API, jsonify for returning JSON responses
from flask_sqlalchemy import SQLAlchemy    # SQLAlchemy for database interactions
from flask_cors import CORS                # CORS to allow frontend (React) to make requests to the backend
from dotenv import load_dotenv
from flask_migrate import Migrate           # added ss
load_dotenv()

# Initialize the Flask app                  #loads environment variables from .env.
app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Resource Sharing (CORS) to allow frontend to communicate with backend

# Use environment variables for database credentials
DB_USER = os.getenv('DB_USER', 'root')  # Default to 'root' if not set
DB_PASSWORD = os.getenv('DB_PASSWORD', '')
DB_NAME = os.getenv('DB_NAME', 'project_db')
DB_HOST = os.getenv('DB_HOST', 'localhost')

app.config['SQLALCHEMY_DATABASE_URI'] = f'mysql+mysqlconnector://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}'   #Constructs the connection string for MySQL.
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False                                                            #Disables event system to save memory.

# Initialize the database with SQLAlchemy
db = SQLAlchemy(app)
migrate = Migrate(app, db)           # added ss
# -------------------- Database Model --------------------

# Define a User model (represents a table in the database)
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)  # Primary key, auto-incremented
    name = db.Column(db.String(100), nullable=False)  # User's name (String, required)
    email = db.Column(db.String(100), unique=True, nullable=False)  # User's email (must be unique, required)

    # Convert the object to a dictionary (useful for JSON responses)
    def to_dict(self):
        return {"id": self.id, "name": self.name, "email": self.email}

# Define a  Course Model
class Course(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    code = db.Column(db.String(10), unique=True, nullable=False)
    credits = db.Column(db.Integer, nullable=False)
    semester_offered = db.Column(db.String(50), nullable=True)  # New field: Fall, Spring, Summer, Winter
    prerequisites = db.Column(db.String(255), nullable=True)  # New field: Stores prerequisite course codes as a comma-separated string

    # Convert the object to a dictionary (useful for JSON responses)
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "code": self.code,
            "credits": self.credits,
            "semester_offered": self.semester_offered,
            "prerequisites": self.prerequisites.split(",") if self.prerequisites else []
        }

# This model links a course to a semester
class Plan(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    semester = db.Column(db.String(50), nullable=False)

    # Foreign key to the course table
    course_id = db.Column(db.Integer, db.ForeignKey('course.id'), nullable=False)

    # Relationship so we can access course details easily
    course = db.relationship('Course', backref='plans')



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

# Endpoint to GET the total numbers of credits for each semester has been planned - FYP-83
@app.route('/plan/credits', methods=['GET'])
def get_credits_per_semester():
    plans = Plan.query.all()  # Fetch all course plans
    semester_credits = {}
    for plan in plans:
        semester = plan.semester
        semester_credits[semester] = semester_credits.get(semester, 0) + plan.course.credits
    return jsonify(semester_credits)

# Create Dummy Data for testing purpose - FYP-83
@app.route('/seed', methods=['POST'])
def seed_data():

    # Clear existing data before any update otherwise a new POST will not work
    # Clear Plan table first (since it depends on Course)
    Plan.query.delete()
    db.session.commit()
    # Then clear Course table
    Course.query.delete()
    db.session.commit()

    # Now add courses
    c1 = Course(code='CMSC201', name='Intro to CS', credits=3)  # updated to 3
    c2 = Course(code='CMSC202', name='Advanced Programming', credits=3)
    c3 = Course(code='MATH151', name='Calculus I', credits=4)

    db.session.add_all([c1, c2, c3])
    db.session.commit()

    # Add to Plan
    p1 = Plan(course_id=c1.id, semester='Fall 2025')
    p2 = Plan(course_id=c2.id, semester='Fall 2025')
    p3 = Plan(course_id=c3.id, semester='Spring 2026')

    db.session.add_all([p1, p2, p3])
    db.session.commit()

    return jsonify({"message": "Seeded!"})


# -------------------- Run the Flask App --------------------
# Create database tables if they don’t exist
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True)  # Run the app in debug mode (useful for development)
