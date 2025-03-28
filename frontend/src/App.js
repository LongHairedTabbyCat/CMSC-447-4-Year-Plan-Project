import React, { useState } from "react";
import "./App.css";

function App() {
  const [searchTerm, setSearchTerm] = useState("");
  const [semesters, setSemesters] = useState({
    "Spring 2025": [],
    "Fall 2025": [],
    "Spring 2026": [],
    "Fall 2026": [],
  });
  const [selectedDegree, setSelectedDegree] = useState("");

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

  return (
    <div className="container">
      {/* left column: degree requirements and course search */}
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

      {/* right column: semesters */}
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
