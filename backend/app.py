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
    prerequisite_stmt = db.Column(db.Text)

    # Convert the object to a dictionary (useful for JSON responses)
    def to_dict(self):
        return {
            "course_id": self.course_id,
            "course_name": self.course_name,
            "catalog_name": self.catalogname, # Use snake_case for consistency in JSON keys
            "category": self.category,
            "course_num": self.course_num,
            "course_desc": self.course_desc,
            "course_credits": self.course_credits,
            "prerequisite_stmt": self.prerequisite_stmt
        }

# Database models for course prerequisites
# Create the AndGroupPrereq model for course
class AndGroupPrereq(db.Model):
    __tablename__ = 'and_group_prereq'
    and_group_id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.course_id'))
    prerequisite_id = db.Column(db.Integer, db.ForeignKey('courses.course_id'), primary_key=True)

    def to_dict(self):
        return {
            "course_id": self.course_id,
            "and_group_id": self.and_group_id,
            "prerequisite_id": self.prerequisite_id
        }

# Create the ConcurrentPrereq model for course
class ConcurrentPrereq(db.Model):
    __tablename__ = 'concurrent_prereq'

    course_id = db.Column(db.Integer, db.ForeignKey('courses.course_id'), primary_key=True)
    concurrent_id = db.Column(db.Integer, db.ForeignKey('courses.course_id'), primary_key=True)

    def to_dict(self):
        return {
            "course_id": self.course_id,
            "concurrent_id": self.concurrent_id
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

# Endpoint to test AndGroupPrereq model. Use Postman GET Method with URL:http://localhost:5000/test/and-group-prereqs
@app.route('/test/and-group-prereqs', methods=['GET'])
def test_and_group_prereqs():
    results = AndGroupPrereq.query.all()
    return jsonify([row.to_dict() for row in results])

# Endpoint to test ConcurrentPrereq model. Use Postman GET Method with URL:http://localhost:5000/test/concurrent-prereqs
@app.route('/test/concurrent-prereqs', methods=['GET'])
def test_concurrent_prereqs():
    results = ConcurrentPrereq.query.all()
    return jsonify([row.to_dict() for row in results])

# Endpoint to check the prerequisites, use Postman POST Method with URL:http://localhost:5000/plan/check-prerequisites
# use for POST testing (also expected returned HTTP from frontend like this):
# {
#   "semesters": [
#     { "name": "Spring 2025", "courses": [60, 46] },
#     { "name": "Fall 2025", "courses": [24] },
#     { "name": "Spring 2026", "courses": [23, 1, 25] },
#     { "name": "Fall 2026", "courses": [49, 3, 34] }, // 3 is the corequisite of 49
#     { "name": "Spring 2027", "courses": [26, 35, 4] }
#   ]
# }
@app.route('/plan/check-prerequisites', methods=['POST'])
def check_prerequisites():
    data = request.get_json()
    semesters = data.get("semesters")

    if not semesters:
        return jsonify({"error": "Missing semester data"}), 400

    # Track all missing prerequisites and messages
    missing_prereqs = []
    messages = []

    for target_index, semester in enumerate(semesters):
        current_courses = semester.get("courses", [])

        # Get planned courses before this semester
        planned_courses = []
        for s in semesters[:target_index]:
            planned_courses.extend(s.get("courses", []))

        for course_id in current_courses:
            course = Course.query.get(course_id)
            if not course:
                continue

            # Check AND prerequisites
            and_prereqs = AndGroupPrereq.query.filter_by(course_id=course_id).all()
            group_map = {}
            for prereq in and_prereqs:
                group_map.setdefault(prereq.and_group_id, []).append(prereq.prerequisite_id)

            for group_id, prereq_ids in group_map.items():
                if not all(pid in planned_courses for pid in prereq_ids):
                    # Missing at least one prerequisite from this group
                    if not any(p["course_id"] == course_id for p in missing_prereqs):
                        missing_prereqs.append({
                            "course": course.catalogname,
                            "course_id": course_id,
                            "message": f"To take {course.catalogname}, you must complete the following prerequisites: {course.prerequiste_stmt}"
                        })

    # Gather all current semester courses by name for lookup
    semester_course_lookup = {s["name"]: set(s.get("courses", [])) for s in semesters}

    # Filter out missing prerequisites if satisfied via concurrent enrollment
    final_missing = []
    for entry in missing_prereqs:
        course_id = entry["course_id"]
        # Find the semester this course is planned in
        planned_sem = next((s for s in semesters if course_id in s.get("courses", [])), None)
        if not planned_sem:
            final_missing.append(entry)
            continue

        concurrent_courses = semester_course_lookup.get(planned_sem["name"], set())
        concurrents = ConcurrentPrereq.query.filter_by(course_id=course_id).all()
        concurrent_ids = [c.concurrent_id for c in concurrents]

        # If any concurrent prereq is in the same semester, skip this missing prereq
        if any(cid in concurrent_courses for cid in concurrent_ids):
            continue
        final_missing.append(entry)

    # Rebuild messages from filtered list
    final_messages = [entry["message"] for entry in final_missing]

    return jsonify({
        "missing_prerequisites": final_missing,
        "messages": final_messages
    })

# -------------------- Run the Flask App --------------------

if __name__ == '__main__':
    app.run(debug=False)  # Run the app in debug mode (useful for development)
