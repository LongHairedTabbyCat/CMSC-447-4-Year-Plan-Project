import React, { useState, useEffect, useCallback } from "react";
import "./App.css";

const API_BASE_URL = "http://localhost:5000";

const initialYears = ["Year1", "Year2", "Year3", "Year4"];

function App() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDegree, setSelectedDegree] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [creditsFilter, setCreditsFilter] = useState("");
  const [courseNumberFilter, setCourseNumberFilter] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");
  const [attributeFilter, setAttributeFilter] = useState("");
  const [attributeValueFilter, setAttributeValueFilter] = useState("");
  const [openCategories, setOpenCategories] = useState(new Set());
  const [allCourses, setAllCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [years, setYears] = useState(initialYears);
  const [semesters, setSemesters] = useState(() => {
    const init = {};
    initialYears.forEach((year) => {
      init[year + "Fall"] = [];
      init[year + "Winter"] = [];
      init[year + "Spring"] = [];
      init[year + "Summer"] = [];
    });
    return init;
  });
  const [winterVisible, setWinterVisible] = useState(() => {
    const init = {};
    initialYears.forEach((year) => {
      init[year] = false;
    });
    return init;
  });
  const [summerVisible, setSummerVisible] = useState(() => {
    const init = {};
    initialYears.forEach((year) => {
      init[year] = false;
    });
    return init;
  });
  const yearMap = years.reduce((acc, year) => {
    acc[year] = "Year " + year.substring(4);
    return acc;
  }, {});
  // ... (Keep degreeRequirements data) ...
    const degreeRequirements = {
    "Computer Science": {
      notes: [
        "Minimum 120 credits total for degree.",
        "Minimum GPA of 2.0 overall.",
        "Minimum grade of 'C' in courses applied to the major (unless otherwise noted).",
        "Completion of 45 upper-level credits, residence, Writing Intensive, and GenEd requirements.",
        "Two courses in each track cannot be used towards any other tracks.",
      ],
      gateway: {
        title: "Computer Science Gateway",
        credits: 8,
        description: "Complete the following with minimum grade of ‘B’:",
        courses: ["CMSC 201 - Computer Science I (4)", "CMSC 202 - Computer Science II (4)"],
      },
      requiredCs: {
        title: "Required Computer Science Courses",
        credits: 27,
        description: "Complete the following:",
        courses: [
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
      },
      requiredMath: {
        title: "Required Mathematics Courses",
        credits: 11,
        description: "Complete the following:",
        courses: [
          "MATH 151 - Calculus and Analytic Geometry I (4)",
          "MATH 152 - Calculus and Analytic Geometry II (4)",
          "MATH 221 - Introduction to Linear Algebra (3)",
        ],
      },
      requiredStats: {
        title: "Required Statistics Courses",
        credits: "3-4",
        description: "Complete one (1) of the following:",
        options: [
          "STAT 355 - Introduction to Probability and Statistics for Scientists and Engineers (4)",
          "STAT 451 - Introduction to Probability Theory (3)",
        ],
        countRequired: 1,
      },
      requiredScienceSequence: {
        title: "Required Science Sequence",
        credits: 8,
        description: "Complete one (1) of the following two-course sequences:",
        sequences: [
          [
            "BIOL 141 - Foundations of Biology: Cells, Energy and Organisms (4)",
            "BIOL 142 - Foundations of Biology: Ecology and Evolution (4)",
          ],
          [
            "CHEM 101 - Principles of Chemistry I (4)",
            "CHEM 102 - Principles of Chemistry II (4)",
          ],
          [
            "PHYS 121 - Introductory Physics I (4)",
            "PHYS 122 - Introductory Physics II (4)",
          ],
        ],
        countRequired: 1,
      },
      requiredLab: {
        title: "Lab Science",
        credits: "2-4",
        description: "Complete one (1) of the following:",
        options: [
          "CHEM 102L - Introductory Chemistry Lab I (2)",
          "GES 286 - Exploring the Environment: A Geo-Spatial Perspective (4)",
          "PHYS 122L - Introductory Physics Laboratory (3)",
          "SCI 101L - Quantitative Reasoning: Measurement and Skills Lab (2)",
        ],
        countRequired: 1,
      },
      csElectives: {
        title: "Computer Science Electives",
        creditsRequired: 6,
        description: "Complete a minimum of 6 credits from the following:",
        options: [
          "CMSC 426 - Principles of Computer Security (3)",
          "CMSC 431 - Compiler Design Principles (3)",
          "CMSC 435 - Computer Graphics (3)",
          "CMSC 448 - Software Engineering II (3)",
          "CMSC 451 - Automata Theory and Formal Languages (3)",
          "CMSC 455 - Numerical Computations (3)",
          "CMSC 456 - Symbolic Computation (3)",
          "CMSC 461 - Database Management Systems (3)",
          "CMSC 471 - Introduction to Artificial Intelligence (3)",
          "CMSC 481 - Computer Networks (3)",
          "CMSC 483 - Parallel and Distributed Processing (3)",
        ],
      },
      technicalElectives: {
        title: "Technical Electives",
        creditsRequired: 9,
        description:
          "Complete 9 credits from 400-level CMSC courses (excluding CMSC 404, 495, 498, 499), approved computer engineering (CMPE) courses, or a maximum of two courses from the list below:",
        optionsDescription: "Eligible courses include:",
        cmscOption:
          "Any CMSC 4xx level course not otherwise required or excluded (CMSC 404, 495, 498, 499).",
        cmpeOption: "Approved Computer Engineering (CMPE) courses.",
        mathOptions: [
          "MATH 430 - Matrix Analysis (3)",
          "MATH 441 - Introduction to Numerical Analysis (3)",
          "MATH 452 - Introduction to Stochastic Processes (3)",
          "MATH 475 - Combinatorics and Graph Theory (3)",
          "MATH 481 - Mathematical Modeling (3)",
          "MATH 483 - Linear and Combinatorial Optimization (3)",
        ],
        mathLimitNote:
          "A maximum of two MATH courses from this list may be used towards the Technical Elective requirement.",
      },
    },
  };


  // ---------------------------
  // NEW: BACKEND CONFLICT CHECKING
  // ---------------------------
  const checkPrerequisitesWithAPI = useCallback(async (currentSemestersData) => {
    // 1. Define the chronological order of semesters based on current years
    const semesterOrder = years.flatMap(year => [
        `${year}Fall`,
        `${year}Winter`,
        `${year}Spring`,
        `${year}Summer`
    ]);

    // 2. Transform data for the backend
    const payload = {
      semesters: semesterOrder.map(semesterKey => ({
        // Use the semester key as the name for simplicity in debugging,
        // the backend primarily cares about the order.
        name: semesterKey,
        // Ensure we only send course IDs
        courses: (currentSemestersData[semesterKey] || []).map(course => course.course_id)
      }))
    };

    console.log("Sending to backend for check:", JSON.stringify(payload));

    try {
      const response = await fetch(`${API_BASE_URL}/plan/check-prerequisites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API Error (${response.status}): ${errorData.error || 'Unknown error'}`);
      }

      const result = await response.json();
      console.log("Received from backend:", result);

      // 3. Process the response and update the state
      const conflictsMap = new Map();
      result.missing_prerequisites.forEach(conflict => {
        conflictsMap.set(conflict.course_id, conflict.message);
      });

      const updatedSemestersWithConflicts = { ...currentSemestersData };
      let conflictsFound = false;

      // Iterate through the *original* data structure to update conflicts
      Object.keys(updatedSemestersWithConflicts).forEach(semesterKey => {
        updatedSemestersWithConflicts[semesterKey] = updatedSemestersWithConflicts[semesterKey].map(course => {
          const conflictMessage = conflictsMap.get(course.course_id);
          if (conflictMessage) {
            conflictsFound = true;
            // Make sure prerequisite statement is correctly referenced (backend sends 'message')
             return { ...course, conflict: conflictMessage };
             // Backend sends the full prereq statement now in 'message', was course.prerequisite_stmt before
            // return { ...course, conflict: `Prerequisite Issue: ${course.prerequisite_stmt}` };
          } else {
            return { ...course, conflict: null }; // Clear previous conflicts if resolved
          }
        });
      });

       console.log("Conflicts found status:", conflictsFound);
       console.log("Final state before setting:", updatedSemestersWithConflicts);

      // Update the main state
      setSemesters(updatedSemestersWithConflicts);

    } catch (error) {
      console.error("Failed to check prerequisites:", error);
      setError(`Failed to check prerequisites: ${error.message}. Check backend connection.`);
      // Optionally revert state or show a persistent error message
      // For now, we'll just log it and keep the optimistic update
      setSemesters(currentSemestersData); // Revert to state before API call if needed
    }
  }, [years, setError]); // Include dependencies for useCallback

  // ---------------------------
  // HELPER: Recommended Credits Tooltip
  // ---------------------------
  function getRecommendedCredits(semesterKey) {
    // ... (keep existing implementation) ...
    const lower = semesterKey.toLowerCase();
    if (lower.includes("winter")) {
      return "Up to 4.5 credits";
    } else if (lower.includes("summer")) {
      return "Up to 16 credits";
    }
    return "Recommended credits: 12-19";
  }

  // ---------------------------
  // FETCH Courses from API
  // ---------------------------
  useEffect(() => {
    // ... (keep existing implementation) ...
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`${API_BASE_URL}/courses`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setAllCourses(data);
      } catch (e) {
        console.error("Failed to fetch courses:", e);
        setError("Failed to load courses. Please ensure the backend is running.");
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []); // Empty dependency array - runs once on mount

  // ---------------------------
  // DRAG & DROP HANDLERS
  // ---------------------------
  const handleDragStart = (event, course, fromSemester = null) => {
    // ... (keep existing implementation) ...
     const draggedCourseData = {
      course_id: course.course_id,
      course_name: course.course_name,
      course_credits: course.course_credits,
      category: course.category,
      catalog_name: course.catalog_name,
      course_num: course.course_num,
      attribute: course.attribute,
      attributeValue: course.attributeValue,
      prerequisite_stmt: course.prerequisite_stmt
    };
    event.dataTransfer.setData(
      "text/plain",
      JSON.stringify({ course: draggedCourseData, fromSemester })
    );
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  // MODIFIED handleDrop
  const handleDrop = (event, targetSemester) => {
    event.preventDefault();
    const transferData = JSON.parse(event.dataTransfer.getData("text/plain"));
    const { course, fromSemester } = transferData;
    const uniqueId = course.course_id; // Use course_id as primary identifier

    // Create the next potential state *before* calling setSemesters
    let nextState = JSON.parse(JSON.stringify(semesters));

    // Remove from the original semester if moving
    if (fromSemester && fromSemester !== targetSemester && nextState[fromSemester]) {
      nextState[fromSemester] = nextState[fromSemester].filter(
        (c) => c.course_id !== uniqueId
      );
    }

    // Add to the target semester if not already present
    if (!nextState[targetSemester]) {
      nextState[targetSemester] = [];
    }
    const exists = nextState[targetSemester].some(
      (c) => c.course_id === uniqueId
    );

    if (!exists) {
      // Find full course data from allCourses to ensure consistency
      const fullCourseData = allCourses.find((c) => c.course_id === uniqueId) || course;
      // Add with null conflict initially - backend will update
      nextState[targetSemester].push({ ...fullCourseData, conflict: null });
    }

    // Call the API check with the potential next state
    // The API function will handle calling setSemesters internally now
    checkPrerequisitesWithAPI(nextState);
  };


  // MODIFIED removeCourse
  const removeCourse = (semesterKey, courseToRemove) => {
    const uniqueId = courseToRemove.course_id;

    // Create the next potential state
    let nextState = JSON.parse(JSON.stringify(semesters));
    if (nextState[semesterKey]) {
        nextState[semesterKey] = nextState[semesterKey].filter(
            (c) => c.course_id !== uniqueId
        );
    }


    // Call the API check with the potential next state
    // The API function will handle calling setSemesters internally
    checkPrerequisitesWithAPI(nextState);
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
    // Ensure properties exist before accessing/checking
    const categoryMatch = categoryFilter === "" || (course.category && course.category === categoryFilter);
    const creditsMatch = creditsFilter === "" || (course.course_credits !== null && course.course_credits === creditsFilter);
    const courseNumberMatch =
      courseNumberFilter === "" ||
      (course.course_num &&
        course.course_num.toString().startsWith(courseNumberFilter));

    // Add checks if these are expected filter criteria from the fetched data
     const semesterMatch = semesterFilter === "" || (course.semester && course.semester === semesterFilter); // Assuming 'semester' property exists
     const attributeMatch = attributeFilter === "" || (course.attribute && course.attribute === attributeFilter); // Assuming 'attribute' property exists
     const attributeValueMatch = attributeValueFilter === "" || (course.attributeValue && course.attributeValue === attributeValueFilter); // Assuming 'attributeValue' property exists

    const searchTermMatch =
      searchTerm.trim() === "" ||
      (course.course_name &&
        course.course_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (course.catalog_name && // Also search by catalog name
        course.catalog_name.toLowerCase().includes(searchTerm.toLowerCase()));

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

  const uniqueCategories = [
    ...new Set(allCourses.map((c) => c.category).filter(Boolean)),
  ].sort();
  const uniqueCredits = [
    ...new Set(allCourses.map((c) => c.course_credits).filter((v) => v !== null && v !== undefined)),
  ].sort((a, b) => a - b); // Ensure numerical sort

  const toggleCategory = (categoryKey) => {
    setOpenCategories((prev) => {
      const newOpenCategories = new Set(prev);
      if (newOpenCategories.has(categoryKey)) {
        newOpenCategories.delete(categoryKey);
      } else {
        newOpenCategories.add(categoryKey);
      }
      return newOpenCategories;
    });
  };


  // MODIFIED toggleWinter
  const toggleWinter = (year) => {
    setWinterVisible((prev) => {
      const newVisibility = !prev[year];
      if (prev[year]) { // If currently visible, toggling OFF
        // Create the next potential state (removing courses)
        let nextState = JSON.parse(JSON.stringify(semesters));
        nextState[year + "Winter"] = [];
        // Trigger check *after* calculating the state change
        checkPrerequisitesWithAPI(nextState);
      } else {
          // If toggling ON, no courses change, just visibility
          // No need to call checkPrerequisitesWithAPI here
      }
      return { ...prev, [year]: newVisibility };
    });
  };

  // MODIFIED toggleSummer
  const toggleSummer = (year) => {
    setSummerVisible((prev) => {
      const newVisibility = !prev[year];
      if (prev[year]) { // If currently visible, toggling OFF
         // Create the next potential state (removing courses)
        let nextState = JSON.parse(JSON.stringify(semesters));
        nextState[year + "Summer"] = [];
        // Trigger check *after* calculating the state change
        checkPrerequisitesWithAPI(nextState);
      } else {
         // If toggling ON, no courses change, just visibility
         // No need to call checkPrerequisitesWithAPI here
      }
      return { ...prev, [year]: newVisibility };
    });
  };


  const addYear = () => {
    // Calculate the new year number from the current years array.
    const yearNums = years.map((y) => Number(y.replace("Year", "")));
    const maxYearNum = yearNums.length > 0 ? Math.max(...yearNums) : 0; // Handle empty case
    const newYear = "Year" + (maxYearNum + 1);

    setYears((prev) => [...prev, newYear]);
    // Initialize toggles for the new year.
    setWinterVisible((prev) => ({ ...prev, [newYear]: false }));
    setSummerVisible((prev) => ({ ...prev, [newYear]: false }));
    // Initialize the 4 semester keys for the new year.
    setSemesters((prev) => ({
      ...prev,
      [newYear + "Fall"]: [],
      [newYear + "Winter"]: [],
      [newYear + "Spring"]: [],
      [newYear + "Summer"]: [],
    }));
  };

  // MODIFIED removeYear
  const removeYear = (year) => {

    // Remove from toggle states first
    setWinterVisible((prev) => {
      const updated = { ...prev };
      delete updated[year];
      return updated;
    });
    setSummerVisible((prev) => {
      const updated = { ...prev };
      delete updated[year];
      return updated;
    });

    // Calculate the next state *after* removing the year's semesters
    let nextState = JSON.parse(JSON.stringify(semesters));
    delete nextState[year + "Fall"];
    delete nextState[year + "Winter"];
    delete nextState[year + "Spring"];
    delete nextState[year + "Summer"];

    // Update the years list
    setYears((prev) => prev.filter((y) => y !== year));

    // Check prerequisites with the state *after* removal
    checkPrerequisitesWithAPI(nextState);
  };


  // ---------------------------
  // RENDER
  // ---------------------------
  return (
    <div className="container">
      {/* LEFT COLUMN */}
      <div className="left-column">
         <div className="degree-requirements">
          <h2>Degree Requirements</h2>
          <select
            value={selectedDegree}
            onChange={(e) => {
              setSelectedDegree(e.target.value);
              setOpenCategories(new Set());
            }}
            className="degree-dropdown"
          >
            <option value="">Select a Degree</option>
            {Object.keys(degreeRequirements || {}).map((deg) => (
              <option key={deg} value={deg}>
                {deg}
              </option>
            ))}
          </select>
          {selectedDegree && degreeRequirements[selectedDegree] && (
            <div className="degree-accordion">
              {Object.keys(degreeRequirements[selectedDegree]).map((categoryKey) => {
                const category = degreeRequirements[selectedDegree][categoryKey];
                const isOpen = openCategories.has(categoryKey);
                if (categoryKey === "notes" && Array.isArray(category)) {
                  return (
                    <div key={categoryKey} className="requirement-category category-notes">
                      <button
                        type="button"
                        className="category-header"
                        onClick={() => toggleCategory(categoryKey)}
                        aria-expanded={isOpen}
                      >
                        <span>General Notes</span>
                        <span className="toggle-icon">{isOpen ? "▼" : "▶"}</span>
                      </button>
                      {isOpen && (
                        <div className="category-content">
                          <ul>
                            {category.map((note, idx) => (
                              <li key={`note-${idx}`}>{note}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                }
                if (typeof category !== "object" || category === null) return null;

                let creditInfo = "";
                if (category.credits) {
                  creditInfo = `(${category.credits} credits)`;
                } else if (category.creditsRequired) {
                  creditInfo = `(${category.creditsRequired} credits required)`;
                }

                return (
                  <div key={categoryKey} className={`requirement-category category-${categoryKey}`}>
                    <button
                      type="button"
                      className="category-header"
                      onClick={() => toggleCategory(categoryKey)}
                      aria-expanded={isOpen}
                    >
                      <span>{category.title || categoryKey} {creditInfo}</span>
                      <span className="toggle-icon">{isOpen ? "▼" : "▶"}</span>
                    </button>
                    {isOpen && (
                      <div className="category-content">
                        {category.description && <p>{category.description}</p>}
                        {category.courses && Array.isArray(category.courses) && (
                          <ul>
                            {category.courses.map((course, idx) => (
                              <li key={`${categoryKey}-course-${idx}`}>{course}</li>
                            ))}
                          </ul>
                        )}
                        {category.options && Array.isArray(category.options) && (
                          <>
                            {category.countRequired && <p><em>(Choose {category.countRequired})</em></p>}
                            <ul>
                              {category.options.map((opt, idx) => (
                                <li key={`${categoryKey}-option-${idx}`}>{opt}</li>
                              ))}
                            </ul>
                          </>
                        )}
                        {category.sequences && Array.isArray(category.sequences) && (
                          <>
                            {category.countRequired && <p><em>(Choose {category.countRequired} sequence)</em></p>}
                            {category.sequences.map((sequence, seqIndex) => (
                              <div key={`${categoryKey}-seq-${seqIndex}`} className="sequence-option">
                                <p><strong>Option {seqIndex + 1}:</strong></p>
                                <ul>
                                  {sequence.map((sCourse, sIdx) => (
                                    <li key={`${categoryKey}-seq-${seqIndex}-course-${sIdx}`}>{sCourse}</li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </>
                        )}
                        {categoryKey === "technicalElectives" && (
                          <div className="technical-electives-details">
                            {category.optionsDescription && <p><em>{category.optionsDescription}</em></p>}
                            {category.cmscOption && <p>- {category.cmscOption}</p>}
                            {category.cmpeOption && <p>- {category.cmpeOption}</p>}
                            {category.mathOptions && Array.isArray(category.mathOptions) && (
                              <>
                                <p>- Maximum of two from the following MATH courses:</p>
                                <ul>
                                  {category.mathOptions.map((mathOpt, idx) => (
                                    <li key={idx}>{mathOpt}</li>
                                  ))}
                                </ul>
                              </>
                            )}
                            {category.mathLimitNote && <p><em>{category.mathLimitNote}</em></p>}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="course-search">
          <h2>Course Search</h2>
          <input
            type="text"
            className="search-input"
            placeholder="Search course name or ID..." // Updated placeholder
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="filters">
             {/* Ensure filter options match available data properties */}
             <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="filter-dropdown"
            >
              <option value="">Category</option>
              {uniqueCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <select
              value={creditsFilter}
              onChange={(e) => {
                const val = e.target.value;
                // Handle empty string correctly
                setCreditsFilter(val === "" ? "" : parseInt(val, 10));
              }}
              className="filter-dropdown"
            >
              <option value="">Credits</option>
              {uniqueCredits.map((cred) => (
                <option key={cred} value={cred}>
                  {cred} Credits
                </option>
              ))}
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
            {/* Add back other filters when they're created */}
            {/*
            <select
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="filter-dropdown"
            >
             ...
            </select>
             <select
              value={attributeFilter}
               onChange={(e) => setAttributeFilter(e.target.value)}
              className="filter-dropdown"
            >
             ...
            </select>
            <select
              value={attributeValueFilter}
               onChange={(e) => setAttributeValueFilter(e.target.value)}
              className="filter-dropdown"
              disabled={...}
            >
             ...
            </select>
            */}
          </div>
          <div className="search-results">
            {loading && <p>Loading courses...</p>}
            {error && <p className="error-message">{error}</p>}
            {!loading &&
              !error &&
              anyFilterApplied() &&
              filteredCourses.map((course) => (
                <div
                  // Use course_id for key consistency
                  key={course.course_id}
                  className="result-item"
                  draggable
                  onDragStart={(e) => handleDragStart(e, course)}
                  // Add tooltip for course description if available
                  title={course.course_desc || ''}
                >
                   {/* Display catalog name and course name */}
                  <strong>{course.catalog_name || `Course ID: ${course.course_id}`}</strong>: {course.course_name || 'No Name'} ({course.course_credits || 'N/A'} Cr)
                </div>
              ))}
            {!loading &&
              !error &&
              anyFilterApplied() &&
              filteredCourses.length === 0 && (
                <p>No courses match the selected filters.</p>
              )}
            {!loading && !error && !anyFilterApplied() && (
              <p>Apply filters or search to see courses.</p>
            )}
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: MULTI-YEAR PLANNER */}
      <div className="semesters">
        <h2>Semesters</h2>
        {years.map((year) => (
          <div className="year-container" key={year}>
            <div className="year-header-controls"> {/* Wrapper for header and button */}
                <h3 className="year-header">{yearMap[year]}</h3>
                {/* Show Remove button only for non-base years */}
                {!initialYears.includes(year) && (
                <button
                    className="remove-year-button"
                    onClick={() => removeYear(year)}
                    title={`Remove ${yearMap[year]}`} // Tooltip for clarity
                >
                    × {/* Use a simple 'x' symbol */}
                </button>
                )}
            </div>


            {/* FALL (Always visible) */}
            <div
              className="semester-box"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, year + "Fall")}
            >
              <div className="semester-title-container"> {/* Wrap title and tooltip */}
                <div className="semester-title">Fall</div>
                <div className="question-mark-container">
                  <span className="question-mark">?</span>
                  <span className="tooltip-text">{getRecommendedCredits(year + "Fall")}</span>
                </div>
              </div>
              <div className="courses">
                {(semesters[year + "Fall"] || []).map((course, idx) => (
                  <div
                    key={year + "Fall-" + course.course_id + "-" + idx} // Use course_id
                    // Apply conflict class if conflict exists and is not null/empty
                    className={`course-box ${course.conflict ? "conflict" : ""}`}
                    draggable
                    onDragStart={(evt) => handleDragStart(evt, course, year + "Fall")}
                    // Display conflict message in tooltip
                    title={course.conflict || `${course.catalog_name}: ${course.course_name}`} // Show course name if no conflict
                  >
                     {/* Display catalog name */}
                    <strong>{course.catalog_name || `ID: ${course.course_id}`}</strong>
                    <button
                      className="remove-btn"
                      onClick={() => removeCourse(year + "Fall", course)}
                      title="Remove Course" // Add tooltip
                      >
                      ✖
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* WINTER Toggle */}
            <div className="horizontal-line-container" onClick={() => toggleWinter(year)} title={winterVisible[year] ? "Hide Winter" : "Show Winter"}>
              <div className="plus-circle">{winterVisible[year] ? "–" : "+"}</div>
            </div>
            {winterVisible[year] && (
              <div
                className="semester-box"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, year + "Winter")}
              >
                 <div className="semester-title-container">
                    <div className="semester-title">Winter</div>
                    <div className="question-mark-container">
                    <span className="question-mark">?</span>
                    <span className="tooltip-text">{getRecommendedCredits(year + "Winter")}</span>
                    </div>
                </div>
                <div className="courses">
                  {(semesters[year + "Winter"] || []).map((course, idx) => (
                    <div
                       key={year + "Winter-" + course.course_id + "-" + idx}
                       className={`course-box ${course.conflict ? "conflict" : ""}`}
                       draggable
                       onDragStart={(evt) => handleDragStart(evt, course, year + "Winter")}
                       title={course.conflict || `${course.catalog_name}: ${course.course_name}`}
                    >
                      <strong>{course.catalog_name || `ID: ${course.course_id}`}</strong>
                      <button
                        className="remove-btn"
                        onClick={() => removeCourse(year + "Winter", course)}
                         title="Remove Course"
                      >
                        ✖
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SPRING (Always visible) */}
            <div
              className="semester-box"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, year + "Spring")}
            >
               <div className="semester-title-container">
                    <div className="semester-title">Spring</div>
                    <div className="question-mark-container">
                    <span className="question-mark">?</span>
                    <span className="tooltip-text">{getRecommendedCredits(year + "Spring")}</span>
                    </div>
                </div>
              <div className="courses">
                {(semesters[year + "Spring"] || []).map((course, idx) => (
                   <div
                       key={year + "Spring-" + course.course_id + "-" + idx}
                       className={`course-box ${course.conflict ? "conflict" : ""}`}
                       draggable
                       onDragStart={(evt) => handleDragStart(evt, course, year + "Spring")}
                       title={course.conflict || `${course.catalog_name}: ${course.course_name}`}
                    >
                     <strong>{course.catalog_name || `ID: ${course.course_id}`}</strong>
                    <button
                      className="remove-btn"
                      onClick={() => removeCourse(year + "Spring", course)}
                       title="Remove Course"
                    >
                      ✖
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* SUMMER Toggle */}
            <div className="horizontal-line-container" onClick={() => toggleSummer(year)} title={summerVisible[year] ? "Hide Summer" : "Show Summer"}>
              <div className="plus-circle">{summerVisible[year] ? "–" : "+"}</div>
            </div>
            {summerVisible[year] && (
              <div
                className="semester-box"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, year + "Summer")}
              >
                <div className="semester-title-container">
                    <div className="semester-title">Summer</div>
                    <div className="question-mark-container">
                    <span className="question-mark">?</span>
                    <span className="tooltip-text">{getRecommendedCredits(year + "Summer")}</span>
                    </div>
                </div>
                <div className="courses">
                  {(semesters[year + "Summer"] || []).map((course, idx) => (
                    <div
                      key={year + "Summer-" + course.course_id + "-" + idx}
                      className={`course-box ${course.conflict ? "conflict" : ""}`}
                      draggable
                      onDragStart={(evt) => handleDragStart(evt, course, year + "Summer")}
                      title={course.conflict || `${course.catalog_name}: ${course.course_name}`}
                    >
                      <strong>{course.catalog_name || `ID: ${course.course_id}`}</strong>
                      <button
                        className="remove-btn"
                        onClick={() => removeCourse(year + "Summer", course)}
                         title="Remove Course"
                      >
                        ✖
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Button to add another year */}
        <div className="add-year-container">
          <button className="add-year-button" onClick={addYear}>
            + Add Another Year
          </button>
        </div>
      </div> {/* End Right Column */}
    </div> // End Container
  );
}

export default App;