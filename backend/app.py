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

# Database models for course prerequisites

# Create the AndPrereq model for course. It doesn't only store prerequisites where there are two or more requirements, it stores any prerequisite that’s part of an AND-type requirement, even if there’s only one.
class AndPrereq(db.Model):
    __tablename__ = 'and_prereq'

    # Use both course_id and required_rereq_id as primary key to prevent duplicate entries because of the many-to many relationship between courses and their prerequisites
    course_id = db.Column(db.Integer, db.ForeignKey('courses.course_id'), primary_key=True)
    required_prereq_id = db.Column(db.Integer, db.ForeignKey('courses.course_id'), primary_key=True)

    # Convert model instance into a dictionary avoid rewriting the same dictionary logic again
    def to_dict(self):
        return {
            "course_id": self.course_id,
            "required_prereq_id": self.required_prereq_id
        }

# Create the OrPrereq model for course.
class OrPrereq(db.Model):
    __tablename__ = 'or_prereq'

    or_group_id = db.Column(db.Integer, primary_key=True, autoincrement=True) # autoincrement uniquely identify each group of OR prerequisites, added base on db
    course_id = db.Column(db.Integer, db.ForeignKey('courses.course_id'))

    def to_dict(self):
        return {
            "or_group_id": self.or_group_id,
            "course_id": self.course_id
        }

# Create the OrGroupPrereq model for course.
class OrGroupPrereq(db.Model):
    __tablename__ = 'or_group_prereq'

    or_group_id = db.Column(db.Integer, db.ForeignKey('or_prereq.or_group_id'), primary_key=True)
    prerequisite_id = db.Column(db.Integer, db.ForeignKey('courses.course_id'), primary_key=True)

    def to_dict(self):
        return {
            "or_group_id": self.or_group_id,
            "prerequisite_id": self.prerequisite_id
        }

# Create the AndGroupPrereq model for course.
class AndGroupPrereq(db.Model):
    __tablename__ = 'and_group_prereq'

    and_group_id = db.Column(db.Integer, db.ForeignKey('or_prereq.or_group_id'), primary_key=True)
    prerequisite_id = db.Column(db.Integer, db.ForeignKey('courses.course_id'), primary_key=True)

    def to_dict(self):
        return {
            "and_group_id": self.and_group_id,
            "prerequisite_id": self.prerequisite_id
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

# Endpoint to test AndPrereq model. Use Postman GET Method with URL:http://localhost:5000/test/and-prereqs
@app.route('/test/and-prereqs', methods=['GET'])
def get_and_prereqs():
    prereqs = AndPrereq.query.all()
    ## Manually construct a list of dictionary
    # result = [
    #     {
    #         "course_id": p.course_id,
    #         "required_prereq_id": p.required_prereq_id
    #     }
    #     for p in prereqs
    # ]

    #return jsonify(result)
    # Calling the helper method using .to_dict() for the test result format
    result = [p.to_dict() for p in prereqs]
    return jsonify(result)

# Endpoint to test OrPrereq model, use Postman GET Method with URL:http://localhost:5000/test/or-prereqs
@app.route('/test/or-prereqs', methods=['GET'])
def get_or_prereqs():
    prereqs = OrPrereq.query.all()
    result = [p.to_dict() for p in prereqs]
    return jsonify(result)

# Endpoint to test OrGroupPrereq model, use Postman GET Method with URL:http://localhost:5000/test/or-group-prereqs
@app.route('/test/or-group-prereqs', methods=['GET'])
def get_or_group_prereqs():
    prereqs = OrGroupPrereq.query.all()
    result = [entry.to_dict() for entry in prereqs]
    return jsonify(result)

# Endpoint to test AndGroupPrereq model, use Postman GET Method with URL:http://localhost:5000/test/and-group-prereqs
@app.route('/test/and-group-prereqs', methods=['GET'])
def get_and_group_prereqs():
    prereqs = AndGroupPrereq.query.all()
    result = [entry.to_dict() for entry in prereqs]
    return jsonify(result) # Returned empty result due to empty database for this table

# Endpoint for testing purpose
@app.route('/test', methods=['GET'])
def test():
    # session = db.session
    # stmt = select(Course).where(Course.course_id.in_([1, 2]))
    # wantedCourses = session.scalars(stmt).all()

    wantedCourses = Course.query.where(Course.course_id.in_([1, 2])).all()
    return "1"

# -------------------- Run the Flask App --------------------

if __name__ == '__main__':
    app.run(debug=False)  # Run the app in debug mode (useful for development)
