import React, { useState } from "react";
import "./App.css";

function App() {
  const [expanded, setExpanded] = useState({});

  const toggleExpand = (semester) => {
    setExpanded((prev) => ({
      ...prev,
      [semester]: !prev[semester],
    }));
  };

  return (
    <div className="container">
      <div className="degree-requirements">
        <h2 className="text-xl font-semibold mb-4">Degree Requirements</h2>
        <p className="text-gray-600">TODO:</p>
      </div>

      <div className="semesters">
        <h2 className="text-xl font-semibold mb-4">Semesters</h2>
        <div>
          {["Spring 2025", "Fall 2025", "Spring 2026", "Fall 2026"].map(
            (semester, index) => (
              <div key={index} className="semester-item">
                <div
                  className="semester-title"
                  onClick={() => toggleExpand(semester)}
                >
                  {semester}
                </div>
                {expanded[semester] && (
                  <div className="courses">
                    <div className="course-box">CMSC 201</div>
                    <div className="course-box">CMSC 202</div>
                    <div className="course-box">CMSC 203</div>
                    <div className="course-box">CMSC 341</div>
                  </div>
                )}
              </div>
            )
          )}
        </div>
        <button className="add-semester-btn">Add Semester</button>
      </div>
    </div>
  );
}

export default App;
