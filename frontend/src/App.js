import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDegree, setSelectedDegree] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [creditsFilter, setCreditsFilter] = useState("");
  const [courseNumberFilter, setCourseNumberFilter] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");
  const [attributeFilter, setAttributeFilter] = useState("");
  const [attributeValueFilter, setAttributeValueFilter] = useState("");
  const [semesters, setSemesters] = useState({
    "Spring 2025": [],
    "Fall 2025": [],
    "Spring 2026": [],
    "Fall 2026": [],
  });

  const allCourses = [
    { name: "First Year Seminar", category: "FYS - First Year Seminar", credits: 3, courseNumber: 100, semester: "Spring", attribute: "First Year Experience", attributeValue: "" },
    { name: "Linear Algebra", category: "MATH - Mathematics", credits: 3, courseNumber: 100, semester: "Fall", attribute: "General Education Program", attributeValue: "Mathematics" },
    { name: "Physics", category: "PHYS - Physics", credits: 3, courseNumber: 200, semester: "Spring", attribute: "General Education Program", attributeValue: "Science Plus Lab" },
    { name: "Computer Science II", category: "CMSC - Computer Science", credits: 3, courseNumber: 200, semester: "Fall", attribute: "", attributeValue: "" },
    { name: "Biology I", category: "BIOL - Biology", credits: 4, courseNumber: 100, semester: "Spring", attribute: "General Education Program", attributeValue: "Science Plus Lab" },
    { name: "Data Structures", category: "CMSC - Computer Science", credits: 3, courseNumber: 300, semester: "Fall", attribute: "", attributeValue: "" },
    { name: "Machine Learning", category: "CMSC - Computer Science", credits: 4, courseNumber: 400, semester: "Spring", attribute: "", attributeValue: "" },
    { name: "Artificial Intelligence", category: "CMSC - Computer Science", credits: 3, courseNumber: 400, semester: "Fall", attribute: "", attributeValue: "" },
    { name: "Software Engineering", category: "CMSC - Computer Science", credits: 3, courseNumber: 400, semester: "Spring", attribute: "", attributeValue: "" },
    { name: "Principles of Computer Security", category: "CMSC - Computer Science", credits: 3, courseNumber: 400, semester: "Spring", attribute: "", attributeValue: "" },
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
          (c) => c.name !== course.name
        );
      }

      const courseExists = updatedSemesters[targetSemester].some(
          (existingCourse) => existingCourse.name === course.name
      );

      if (!courseExists) {
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

  const removeCourse = (semester, courseToRemove) => {
    setSemesters((prev) => ({
      ...prev,
      [semester]: prev[semester].filter((c) => c.name !== courseToRemove.name),
    }));
  };

  const anyFilterApplied = () => {
    return (
      searchTerm.trim() !== "" ||
      categoryFilter !== "" ||
      creditsFilter !== "" ||
      courseNumberFilter !== "" ||
      semesterFilter !== "" ||
      attributeFilter !== "" ||
      attributeValueFilter !== ""
    );
  };


  const filteredCourses = allCourses.filter((course) => {
    const categoryMatch = categoryFilter === "" || course.category === categoryFilter;
    const creditsMatch = creditsFilter === "" || course.credits === creditsFilter;
    const courseNumberMatch = courseNumberFilter === "" || course.courseNumber.toString().startsWith(courseNumberFilter);
    const semesterMatch = semesterFilter === "" || course.semester === semesterFilter;
    const attributeMatch = attributeFilter === "" || course.attribute === attributeFilter;
    const attributeValueMatch = attributeValueFilter === "" || course.attributeValue === attributeValueFilter;
    const searchTermMatch = searchTerm.trim() === "" || course.name.toLowerCase().includes(searchTerm.toLowerCase());

    return (
      categoryMatch &&
      creditsMatch &&
      courseNumberMatch &&
      semesterMatch &&
      attributeMatch &&
      attributeValueMatch &&
      searchTermMatch
    );
  });

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
          <div className="filters">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="filter-dropdown"
            >
              <option value="">Category</option>
              <option value="FYS - First Year Seminar">FYS - First Year Seminar</option>
              <option value="MATH - Mathematics">MATH - Mathematics</option>
              <option value="PHYS - Physics">PHYS - Physics</option>
              <option value="BIOL - Biology">BIOL - Biology</option>
              <option value="CMSC - Computer Science">CMSC - Computer Science</option>
            </select>

            <select
              value={creditsFilter}
              onChange={(e) => {
                  const value = e.target.value;
                  setCreditsFilter(value === "" ? "" : parseInt(value, 10));
              }}
              className="filter-dropdown"
            >
              <option value="">Credits</option>
              <option value="3">3 Credits</option>
              <option value="4">4 Credits</option>
            </select>

            <select
              value={courseNumberFilter}
              onChange={(e) => setCourseNumberFilter(e.target.value)}
              className="filter-dropdown"
            >
              <option value="">Course Number</option>
              <option value="1">1xx</option>
              <option value="2">2xx</option>
              <option value="3">3xx</option>
              <option value="4">4xx</option>
            </select>

            <select
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="filter-dropdown"
            >
              <option value="">Semester</option>
              <option value="Fall">Fall</option>
              <option value="Spring">Spring</option>
            </select>

            <select
              value={attributeFilter}
              onChange={(e) => setAttributeFilter(e.target.value)}
              className="filter-dropdown"
            >
              <option value="">Attribute</option>
              <option value="First Year Experience">First Year Experience</option>
              <option value="General Education Program">General Education Program</option>
            </select>

             <select
                value={attributeValueFilter}
                onChange={(e) => setAttributeValueFilter(e.target.value)}
                className="filter-dropdown"
                disabled={attributeFilter === "" || attributeFilter === "NONE"}
            >
                <option value="">Attribute Value</option>
                {attributeFilter === "General Education Program" && (
                    <>
                        <option value="Mathematics">Mathematics</option>
                        <option value="Science Plus Lab">Science Plus Lab</option>
                    </>
                )}
            </select>

          </div>

          <div className="search-results">
            {anyFilterApplied() &&
              filteredCourses.map((course, index) => (
                <div
                  key={index}
                  className="result-item"
                  draggable
                  onDragStart={(event) => handleDragStart(event, course)}
                >
                  <strong>{course.name}</strong>
                </div>
              ))}
            {anyFilterApplied() && filteredCourses.length === 0 && (
                 <p>No courses match the selected filters.</p>
            )}
          </div>
        </div>
      </div>

      <div className="semesters">
        <h2>Semesters</h2>
        {Object.keys(semesters).map((semester) => (
          <div
            key={semester}
            className="semester-item"
            onDragOver={handleDragOver}
            onDrop={(event) => handleDrop(event, semester)}
          >
            <div className="semester-title">{semester}</div>
            <div className="courses">
              {semesters[semester].map((course, idx) => (
                <div
                  key={`${semester}-${course.name}-${idx}`}
                  className="course-box"
                  draggable
                  onDragStart={(event) =>
                    handleDragStart(event, course, semester)
                  }
                >
                  <strong>{course.name}</strong>
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