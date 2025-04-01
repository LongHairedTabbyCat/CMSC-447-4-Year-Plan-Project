import React, { useState } from "react";
import "./App.css";

function App() {
  const [expanded, setExpanded] = useState({});
  const [keyword, setKeyword] = useState("");

  const toggleExpand = (semester) => {
    setExpanded((prev) => ({
      ...prev,
      [semester]: !prev[semester],
    }));
  };

  const handleSearch = (type) => {
    alert(`Searching by: ${type}`);
    console.log("Search type:", type);
  };

  return (
    <div className="container">
      <div className="left-panel">
        <div className="degree-requirements">
          <h2 className="text-xl font-semibold mb-4">Degree Requirements</h2>
          <p className="text-gray-600">TODO:</p>
        </div>
        <div className="search-section">
          <h2 className="search-title">Class Search</h2>
          <div className="keyword-search">
            <input
              type="text"
              placeholder="Search by keyword..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="keyword-input"
            />
          </div>
          <div className="search-grid">
            <select className="search-dropdown" onChange={(e) => handleSearch('category')}>
              <option value="">Category</option>
              <option value="option1">Option 1</option>
              <option value="option2">Option 2</option>
            </select>
            <select className="search-dropdown" onChange={(e) => handleSearch('credits')}>
              <option value="">Credits</option>
              <option value="1">1 Credit</option>
              <option value="2">2 Credits</option>
              <option value="3">3 Credits</option>
              <option value="4">4 Credits</option>
            </select>
            <select className="search-dropdown" onChange={(e) => handleSearch('courseNumber')}>
              <option value="">Course Number</option>
              <option value="100">100 Level</option>
              <option value="200">200 Level</option>
              <option value="300">300 Level</option>
              <option value="400">400 Level</option>
            </select>
            <select className="search-dropdown" onChange={(e) => handleSearch('semester')}>
              <option value="">Semester</option>
              <option value="fall">Fall</option>
              <option value="spring">Spring</option>
            </select>
            <select className="search-dropdown" onChange={(e) => handleSearch('courseAttribute')}>
              <option value="">Course Attribute</option>
              <option value="attr1">Attribute 1</option>
              <option value="attr2">Attribute 2</option>
            </select>
            <select className="search-dropdown" onChange={(e) => handleSearch('attributeValue')}>
              <option value="">Course Attribute Value</option>
              <option value="val1">Value 1</option>
              <option value="val2">Value 2</option>
            </select>
          </div>
        </div>
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