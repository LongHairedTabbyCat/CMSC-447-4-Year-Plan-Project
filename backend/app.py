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

# Define the plan model
class Plan(db.Model):
    __tablename__ = 'plan'
    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.course_id'), nullable=False)
    semester = db.Column(db.String(50), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'course_id': self.course_id,
            'semester': self.semester
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

# Endpoint to check the prerequisites, use Postman POST Method with URL:http://localhost:5000/plan/check-prerequisites
# use for POST testing (also expected returned HTTP from frontend like this):
# {
#   "course_id": 6,
#   "target_semester": "Spring 2026",
#   "semesters": [
#     { "name": "Spring 2025", "courses": [1] },
#     { "name": "Fall 2025", "courses": [2] },
#     { "name": "Spring 2026", "courses": [3] }, // target semester
#     { "name": "Fall 2026", "courses": [10,23] }
#   ]
# }
@app.route('/plan/check-prerequisites', methods=['POST'])
def check_prerequisites():
    # Get JSON data from the frontend request
    data = request.get_json()
    course_id = data.get('course_id')
    target_semester = data.get('target_semester')
    semesters = data.get('semesters')

    if not course_id or not target_semester or not semesters:
        return jsonify({'error': 'Missing required data'}), 400

    # Build semester order to find the index of the target semester
    semester_names = [s['name'] for s in semesters]

    if target_semester not in semester_names:
        return jsonify({'error': 'Target semester not found in provided semesters'}), 400

    target_index = semester_names.index(target_semester)

    # Collect all courses planned in semesters before the target semester
    planned_ids = []
    for sem in semesters[:target_index]:
        planned_ids.extend(sem.get('courses', []))

    # Container for structured missing prerequisites
    missing_groups = []

    # Check AND prerequisites — all must be completed before this course
    and_reqs = AndPrereq.query.filter_by(course_id=course_id).all()
    and_missing = []

    for req in and_reqs:
        # If a required prerequisite is not in planned courses, add it to missing list
        if req.required_prereq_id not in planned_ids:
            course = Course.query.get(req.required_prereq_id)
            if course:
                and_missing.append(course.to_dict())

    if and_missing:
        course_labels = [f'{c["category"]} {c["course_num"]}' for c in and_missing]
        message = "You must complete all of the following courses before taking this one: " + ", ".join(
            course_labels) + "."
        missing_groups.append({
            "type": "AND",
            "courses": and_missing,
            "message": message
        })

    # Check OR prerequisites — at least one course from the group must be completed
    or_groups = OrPrereq.query.filter_by(course_id=course_id).all()
    for group in or_groups:
        group_courses = OrGroupPrereq.query.filter_by(or_group_id=group.or_group_id).all()
        group_missing = []

        # If none of the group's prerequisites are in planned courses
        if not any(p.prerequisite_id in planned_ids for p in group_courses):
            for p in group_courses:
                course = Course.query.get(p.prerequisite_id)
                if course:
                    group_missing.append(course.to_dict())

        if group_missing:
            course_labels = [f'{c["category"]} {c["course_num"]}' for c in group_missing]
            message = "You must complete at least one of the following courses: " + ", ".join(course_labels) + "."
            missing_groups.append({
                "type": "OR",
                "courses": group_missing,
                "message": message
            })

    # Check AND group prerequisites — all must be completed from the group
    and_groups = AndGroupPrereq.query.filter(AndGroupPrereq.and_group_id.in_(
        [g.or_group_id for g in or_groups]
    )).all()

    grouped = {}
    for row in and_groups:
        grouped.setdefault(row.and_group_id, []).append(row)

    for group_id, prereqs in grouped.items():
        group_missing = []
        for p in prereqs:
            if p.prerequisite_id not in planned_ids:
                course = Course.query.get(p.prerequisite_id)
                if course:
                    group_missing.append(course.to_dict())

        if group_missing:
            course_labels = [f'{c["category"]} {c["course_num"]}' for c in group_missing]
            message = "You must complete all of the following prerequisite courses in this group: " + ", ".join(
                course_labels) + "."
            missing_groups.append({
                "type": "AND_GROUP",
                "courses": group_missing,
                "message": message
            })

    # Return all missing prerequisite groups
    return jsonify({"missing_prerequisites": missing_groups})

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
