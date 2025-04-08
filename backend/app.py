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

# Define a Course model (represents the 'courses' table in the database)
class Course(db.Model):
    __tablename__ = 'courses' # Explicitly define table name
    course_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    course_name = db.Column(db.String(255), nullable=True)
    catalogname = db.Column(db.String(255), nullable=False)
    category = db.Column(db.String(255), nullable=True)
    course_num = db.Column(db.Integer, nullable=True)
    course_desc = db.Column(db.Text, nullable=True) # Use db.Text for TEXT SQL type
    course_credits = db.Column(db.Integer, nullable=True)

    # Convert the object to a dictionary (useful for JSON responses)
    def to_dict(self):
        return {
            "course_id": self.course_id,
            "course_name": self.course_name,
            "catalog_name": self.catalogname, # Use snake_case for consistency in JSON keys
            "category": self.category,
            "course_num": self.course_num,
            "course_desc": self.course_desc,
            "course_credits": self.course_credits
        }

# Create database tables if they don’t exist
with app.app_context():
    db.create_all()

# -------------------- API Routes --------------------

# Endpoint to GET all courses from the database
@app.route('/courses', methods=['GET'])
def get_courses():
    try:
        courses = Course.query.all() # Retrieve all course records
        # Convert each Course object to a dictionary using the to_dict method
        courses_list = [course.to_dict() for course in courses]
        return jsonify(courses_list) # Return the list of courses as JSON
    except Exception as e:
        # Log the error for debugging purposes (optional but recommended)
        # app.logger.error(f"Error fetching courses: {e}")
        return jsonify({"error": "Failed to retrieve courses", "details": str(e)}), 500

# -------------------- Run the Flask App --------------------

if __name__ == '__main__':
    app.run(debug=True)  # Run the app in debug mode (useful for development)
