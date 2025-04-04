import React, { useState } from "react";
import "./App.css";

function App() {
  const [searchTerm, setSearchTerm] = useState("");
  const [keyword, setKeyword] = useState("");
  const [selectedDegree, setSelectedDegree] = useState("");
  const [semesters, setSemesters] = useState({
    "Spring 2025": [],
    "Fall 2025": [],
    "Spring 2026": [],
    "Fall 2026": [],
  });

  const allCourses = [
    "Linear Algebra",
    "Physics",
    "Computer Science II",
    "Biology I",
    "Data Structures",
    "Machine Learning",
    "Artificial Intelligence",
    "Software Engineering",
    "Principles of Computer Security",
  ];

  const degreeRequirements = {
    "Computer Science": [
      "CMSC 203 - Discrete Structures (3)",
      "CMSC 304 - Social and Ethical Issues in Information Technology (3)",
      "CMSC 313 - Computer Organization and Assembly Language Programming (3)",
      "CMSC 331 - Principles of Programming Language (3)",
      "CMSC 341 - Data Structures (3)",
      "CMSC 411 - Computer Architecture (3)",
      "CMSC 421 - Principles of Operating Systems (3)",
      "CMSC 441 - Design and Analysis of Algorithms (3)",
      "CMSC 447 - Software Engineering I (3)",
    ],
    "Information Technology": [
      "IS 300 – Management Information Systems (3)",
      "IS 310 – Software and Hardware Concepts (3)",
      "IS 410 – Introduction to Database Design (3)",
      "IS 420 – Database Application Development (3)",
      "IS 425 – Decision Support Systems (3)",
      "IS 436 – Structured Systems Analysis & Design (3)",
      "IS 450 – Data Communications and Networks (3)",
      "IS 451 – Network Design and Management (3)",
    ],
    "Computer Engineering": [
      "CMPE 306 - Introductory Circuit Theory (4)",
      "CMPE 310 - Systems Design and Programming (4)",
      "CMPE 311 - C Programming and Embedded Systems (3)",
      "CMPE 314 - Principles of Electronic Circuits (4)",
      "CMPE 320 - Probability, Statistics, and Random Processes (3)",
      "CMPE 349 - Introduction to Professional Practice (3)",
      "CMPE 450 - Capstone I (3)",
      "CMPE 451 - Capstone II (3)",
    ],
  };

  const handleDragStart = (event, course, fromSemester = null) => {
    event.dataTransfer.setData(
      "text/plain",
      JSON.stringify({ course, fromSemester })
    );
  };

  const handleDrop = (event, targetSemester) => {
    event.preventDefault();
    const { course, fromSemester } = JSON.parse(
      event.dataTransfer.getData("text/plain")
    );

    setSemesters((prev) => {
      const updatedSemesters = { ...prev };

      if (fromSemester && fromSemester !== targetSemester) {
        updatedSemesters[fromSemester] = updatedSemesters[fromSemester].filter(
          (c) => c !== course
        );
      }

      if (!updatedSemesters[targetSemester].includes(course)) {
        updatedSemesters[targetSemester] = [
          ...updatedSemesters[targetSemester],
          course,
        ];
      }

      return updatedSemesters;
    });
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const removeCourse = (semester, course) => {
    setSemesters((prev) => ({
      ...prev,
      [semester]: prev[semester].filter((c) => c !== course),
    }));
  };

  const filteredCourses = allCourses.filter((course) =>
    course.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSearch = (type) => {
    alert(`Searching by: ${type}`);
    console.log("Search type:", type);
  };

  return (
    <div className="container">
      <div className="left-column">
        <div className="degree-requirements">
          <h2>Degree Requirements</h2>
          <select
            value={selectedDegree}
            onChange={(e) => setSelectedDegree(e.target.value)}
            className="degree-dropdown"
          >
            <option value="">Select a Degree</option>
            {Object.keys(degreeRequirements).map((degree) => (
              <option key={degree} value={degree}>
                {degree}
              </option>
            ))}
          </select>
          {selectedDegree && (
            <div className="degree-courses">
              <h3>Complete the following:</h3>
              <ul>
                {degreeRequirements[selectedDegree].map((course, index) => (
                  <li key={index}>{course}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="course-search">
          <h2>Course Search</h2>
          <input
            type="text"
            className="search-input"
            placeholder="Search for a course..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="search-grid">
            <select className="search-dropdown" onChange={() => handleSearch('category')}>
              <option value="">Category</option>
              <option value="option1">Option 1</option>
              <option value="option2">Option 2</option>
            </select>
            <select className="search-dropdown" onChange={() => handleSearch('credits')}>
              <option value="">Credits</option>
              <option value="1">1 Credit</option>
              <option value="2">2 Credits</option>
              <option value="3">3 Credits</option>
              <option value="4">4 Credits</option>
            </select>
            <select className="search-dropdown" onChange={() => handleSearch('courseNumber')}>
              <option value="">Course Number</option>
              <option value="100">100 Level</option>
              <option value="200">200 Level</option>
              <option value="300">300 Level</option>
              <option value="400">400 Level</option>
            </select>
            <select className="search-dropdown" onChange={() => handleSearch('semester')}>
              <option value="">Semester</option>
              <option value="fall">Fall</option>
              <option value="spring">Spring</option>
            </select>
            <select className="search-dropdown" onChange={() => handleSearch('courseAttribute')}>
              <option value="">Course Attribute</option>
              <option value="attr1">Attribute 1</option>
              <option value="attr2">Attribute 2</option>
            </select>
            <select className="search-dropdown" onChange={() => handleSearch('attributeValue')}>
              <option value="">Course Attribute Value</option>
              <option value="val1">Value 1</option>
              <option value="val2">Value 2</option>
            </select>
          </div>

          <div className="search-results">
            {searchTerm &&
              filteredCourses.map((course, index) => (
                <div
                  key={index}
                  className="result-item"
                  draggable
                  onDragStart={(event) => handleDragStart(event, course)}
                >
                  {course}
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="semesters">
        <h2>Semesters</h2>
        {Object.keys(semesters).map((semester, index) => (
          <div
            key={index}
            className="semester-item"
            onDragOver={handleDragOver}
            onDrop={(event) => handleDrop(event, semester)}
          >
            <div className="semester-title">{semester}</div>
            <div className="courses">
              {semesters[semester].map((course, idx) => (
                <div
                  key={idx}
                  className="course-box"
                  draggable
                  onDragStart={(event) =>
                    handleDragStart(event, course, semester)
                  }
                >
                  {course}
                  <button
                    className="remove-btn"
                    onClick={() => removeCourse(semester, course)}
                  >
                    ✖
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;