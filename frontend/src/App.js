import React, { useState, useEffect } from "react";
import "./App.css";

const API_BASE_URL = "http://localhost:5000";

// Define prerequisite rules
const prerequisiteRules = {
  "Artificial Intelligence": [
    { name: "Computer Science I", type: "strict" },
    { name: "Computer Science II", type: "concurrent" },
  ],
  "Computer Science II": [{ name: "Computer Science I", type: "strict" }],
  "Computer Science I": [{ name: "Precalculus Mathematics", type: "strict" }],
  "Data Structures": [{ name: "Computer Science II", type: "concurrent" }],
  "Machine Learning": [
    { name: "Data Structures", type: "concurrent" },
    { name: "Linear Algebra", type: "concurrent" },
  ],
};

// Start with the initial 4 base years
const initialYears = ["Year1", "Year2", "Year3", "Year4"];

function App() {
  // ---------------------------
  // LEFT SIDE STATES
  // ---------------------------
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

  // ---------------------------
  // Dynamic List of Years
  // ---------------------------
  const [years, setYears] = useState(initialYears);

  // ---------------------------
  // RIGHT SIDE STATES (Semesters)
  // ---------------------------
  // Initialize semesters for each year using keys like "Year1Fall", "Year1Winter", etc.
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

  // Winter & Summer toggles (by default they are hidden)
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

  // Generate display labels: e.g. "Year1" becomes "Year 1"
  const yearMap = years.reduce((acc, year) => {
    acc[year] = "Year " + year.substring(4);
    return acc;
  }, {});

  // ---------------------------
  // Degree Requirements Data (Left Side)
  // ---------------------------
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
  // CONFLICT CHECKING
  // ---------------------------
  const checkCourseConflicts = (semestersData) => {
    // Build a dynamic semester order from the current years array
    const semesterOrderDynamic = years.flatMap((year) => [
      year + "Fall",
      year + "Winter",
      year + "Spring",
      year + "Summer",
    ]);

    console.log("Running conflict check with data:", JSON.stringify(semestersData));
    const updatedSemesters = JSON.parse(JSON.stringify(semestersData));
    const takenCoursesInPreviousSemesters = new Set();
    let globalConflictsFound = false;

    // Reset conflict flags
    semesterOrderDynamic.forEach((semesterName) => {
      if (updatedSemesters[semesterName]) {
        updatedSemesters[semesterName] = updatedSemesters[semesterName].map((course) => ({
          ...course,
          conflict: null,
        }));
      }
    });

    // Check conflicts in the dynamic order
    semesterOrderDynamic.forEach((semesterName) => {
      const currentSemesterCourses = updatedSemesters[semesterName] || [];
      const coursesInCurrentSemesterSet = new Set(
        currentSemesterCourses.map((c) => c.course_name)
      );

      currentSemesterCourses.forEach((course, index) => {
        const rulesForThisCourse = prerequisiteRules[course.course_name];
        let unmetPrerequisitesMessages = [];

        if (rulesForThisCourse && rulesForThisCourse.length > 0) {
          rulesForThisCourse.forEach((prereqRule) => {
            const { name: prereqName, type: prereqType } = prereqRule;
            let isMet = false;
            if (prereqType === "strict") {
              isMet = takenCoursesInPreviousSemesters.has(prereqName);
              if (!isMet) {
                unmetPrerequisitesMessages.push(
                  `Prerequisite '${prereqName}' must be completed before.`
                );
              }
            } else if (prereqType === "concurrent") {
              isMet =
                takenCoursesInPreviousSemesters.has(prereqName) ||
                coursesInCurrentSemesterSet.has(prereqName);
              if (!isMet) {
                unmetPrerequisitesMessages.push(
                  `Prerequisite '${prereqName}' must be taken before or concurrently.`
                );
              }
            } else {
              console.warn(
                `Unknown prerequisite type '${prereqType}' for ${prereqName} regarding ${course.course_name}. Assuming concurrent.`
              );
              isMet =
                takenCoursesInPreviousSemesters.has(prereqName) ||
                coursesInCurrentSemesterSet.has(prereqName);
              if (!isMet) {
                unmetPrerequisitesMessages.push(
                  `Prerequisite '${prereqName}' must be taken before or concurrently.`
                );
              }
            }
          });
        }

        if (unmetPrerequisitesMessages.length > 0) {
          updatedSemesters[semesterName][index].conflict = unmetPrerequisitesMessages.join("\n");
          globalConflictsFound = true;
          console.log(
            `Conflict for ${course.course_name} in ${semesterName}: ${
              updatedSemesters[semesterName][index].conflict.replace("\n", "; ")
            }`
          );
        }
      });

      // Add course names for next semester check
      coursesInCurrentSemesterSet.forEach((courseName) => {
        takenCoursesInPreviousSemesters.add(courseName);
      });
    });

    console.log("Conflict check complete. Conflicts found:", globalConflictsFound);
    return updatedSemesters;
  };

  // ---------------------------
  // HELPER: Recommended Credits Tooltip
  // ---------------------------
  function getRecommendedCredits(semesterKey) {
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
  }, []);

  // ---------------------------
  // DRAG & DROP HANDLERS
  // ---------------------------
  const handleDragStart = (event, course, fromSemester = null) => {
    const draggedCourseData = {
      course_id: course.course_id,
      course_name: course.course_name,
      course_credits: course.course_credits,
      category: course.category,
      catalog_name: course.catalog_name,
      course_num: course.course_num,
      attribute: course.attribute,
      attributeValue: course.attributeValue,
    };
    event.dataTransfer.setData(
      "text/plain",
      JSON.stringify({ course: draggedCourseData, fromSemester })
    );
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (event, targetSemester) => {
    event.preventDefault();
    const transferData = JSON.parse(event.dataTransfer.getData("text/plain"));
    const { course, fromSemester } = transferData;
    const uniqueId = course.course_id || course.course_name;

    setSemesters((prev) => {
      let updated = JSON.parse(JSON.stringify(prev));

      if (fromSemester && fromSemester !== targetSemester && updated[fromSemester]) {
        updated[fromSemester] = updated[fromSemester].filter(
          (c) => (c.course_id || c.course_name) !== uniqueId
        );
      }

      if (!updated[targetSemester]) {
        updated[targetSemester] = [];
      }
      const exists = updated[targetSemester].some(
        (c) => (c.course_id || c.course_name) === uniqueId
      );
      if (!exists) {
        const fullCourseData =
          allCourses.find((c) => (c.course_id || c.course_name) === uniqueId) || course;
        updated[targetSemester].push({ ...fullCourseData, conflict: null });
      }
      return checkCourseConflicts(updated);
    });
  };

  const removeCourse = (semesterKey, courseToRemove) => {
    const uniqueId = courseToRemove.course_id || courseToRemove.course_name;
    setSemesters((prev) => {
      let updated = JSON.parse(JSON.stringify(prev));
      updated[semesterKey] = updated[semesterKey].filter(
        (c) => (c.course_id || c.course_name) !== uniqueId
      );
      return checkCourseConflicts(updated);
    });
  };

  // ---------------------------
  // FILTERING (Left Side)
  // ---------------------------
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
    const creditsMatch = creditsFilter === "" || course.course_credits === creditsFilter;
    const courseNumberMatch =
      courseNumberFilter === "" ||
      (course.course_num &&
        course.course_num.toString().startsWith(courseNumberFilter));
    const semesterMatch = semesterFilter === "" || course.semester === semesterFilter;
    const attributeMatch = attributeFilter === "" || course.attribute === attributeFilter;
    const attributeValueMatch =
      attributeValueFilter === "" || course.attributeValue === attributeValueFilter;
    const searchTermMatch =
      searchTerm.trim() === "" ||
      (course.course_name &&
        course.course_name.toLowerCase().includes(searchTerm.toLowerCase()));
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
  ].sort((a, b) => a - b);

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

  // ---------------------------
  // TOGGLE FUNCTIONS for Winter & Summer
  // ---------------------------
  const toggleWinter = (year) => {
    setWinterVisible((prev) => {
      const newVisibility = !prev[year];
      if (prev[year]) {
        // If currently visible, toggling off: remove courses
        setSemesters((prevSems) => {
          const updated = { ...prevSems };
          updated[year + "Winter"] = [];
          return checkCourseConflicts(updated);
        });
      }
      return { ...prev, [year]: newVisibility };
    });
  };

  const toggleSummer = (year) => {
    setSummerVisible((prev) => {
      const newVisibility = !prev[year];
      if (prev[year]) {
        // If currently visible, toggling off: remove courses
        setSemesters((prevSems) => {
          const updated = { ...prevSems };
          updated[year + "Summer"] = [];
          return checkCourseConflicts(updated);
        });
      }
      return { ...prev, [year]: newVisibility };
    });
  };

  // ---------------------------
  // ADD A NEW YEAR
  // ---------------------------
  const addYear = () => {
    // Calculate the new year number from the current years array.
    const yearNums = years.map((y) => Number(y.replace("Year", "")));
    const maxYearNum = Math.max(...yearNums);
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

  // ---------------------------
  // REMOVE A SPECIFIC YEAR
  // ---------------------------
  const removeYear = (year) => {
    // (Optional: prevent removal of base years if desired)
    // if (["Year1", "Year2", "Year3", "Year4"].includes(year)) return;

    // Remove the year from the 'years' list.
    setYears((prev) => prev.filter((y) => y !== year));

    // Remove its semesters from the state.
    setSemesters((prev) => {
      const updated = { ...prev };
      delete updated[year + "Fall"];
      delete updated[year + "Winter"];
      delete updated[year + "Spring"];
      delete updated[year + "Summer"];
      return checkCourseConflicts(updated);
    });

    // Remove from toggle states.
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

        {/* Course Search */}
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
              <option value="NONE">None</option>
            </select>
            <select
              value={attributeValueFilter}
              onChange={(e) => setAttributeValueFilter(e.target.value)}
              className="filter-dropdown"
              disabled={
                attributeFilter === "" ||
                attributeFilter === "NONE" ||
                attributeFilter === "First Year Experience"
              }
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
            {loading && <p>Loading courses...</p>}
            {error && <p className="error-message">{error}</p>}
            {!loading &&
              !error &&
              anyFilterApplied() &&
              filteredCourses.map((course) => (
                <div
                  key={course.course_id || course.course_name}
                  className="result-item"
                  draggable
                  onDragStart={(e) => handleDragStart(e, course)}
                >
                  <strong>{course.course_name}</strong> ({course.catalog_name})
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
            <h3 className="year-header">{yearMap[year]}</h3>

            {/* If this is an optional year (not one of the base 4), show a Remove button */}
            {!["Year1", "Year2", "Year3", "Year4"].includes(year) && (
              <button
                className="remove-year-button"
                onClick={() => removeYear(year)}
              >
                Remove {yearMap[year]}
              </button>
            )}

            {/* FALL (Always visible) */}
            <div
              className="semester-box"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, year + "Fall")}
            >
              <div className="semester-title">Fall</div>
              <div className="question-mark-container">
                <span className="question-mark">?</span>
                <span className="tooltip-text">{getRecommendedCredits(year + "Fall")}</span>
              </div>
              <div className="courses">
                {(semesters[year + "Fall"] || []).map((course, idx) => (
                  <div
                    key={year + "Fall-" + (course.course_id || course.course_name) + "-" + idx}
                    className={`course-box ${course.conflict ? "conflict" : ""}`}
                    draggable
                    onDragStart={(evt) => handleDragStart(evt, course, year + "Fall")}
                    title={course.conflict || ""}
                  >
                    <strong>{course.course_name}</strong>
                    <button className="remove-btn" onClick={() => removeCourse(year + "Fall", course)}>
                      ✖
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* WINTER Toggle */}
            <div className="horizontal-line-container" onClick={() => toggleWinter(year)}>
              <div className="plus-circle">{winterVisible[year] ? "–" : "+"}</div>
            </div>
            {winterVisible[year] && (
              <div
                className="semester-box"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, year + "Winter")}
              >
                <div className="semester-title">Winter</div>
                <div className="question-mark-container">
                  <span className="question-mark">?</span>
                  <span className="tooltip-text">{getRecommendedCredits(year + "Winter")}</span>
                </div>
                <div className="courses">
                  {(semesters[year + "Winter"] || []).map((course, idx) => (
                    <div
                      key={year + "Winter-" + (course.course_id || course.course_name) + "-" + idx}
                      className={`course-box ${course.conflict ? "conflict" : ""}`}
                      draggable
                      onDragStart={(evt) => handleDragStart(evt, course, year + "Winter")}
                      title={course.conflict || ""}
                    >
                      <strong>{course.course_name}</strong>
                      <button
                        className="remove-btn"
                        onClick={() => removeCourse(year + "Winter", course)}
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
              <div className="semester-title">Spring</div>
              <div className="question-mark-container">
                <span className="question-mark">?</span>
                <span className="tooltip-text">{getRecommendedCredits(year + "Spring")}</span>
              </div>
              <div className="courses">
                {(semesters[year + "Spring"] || []).map((course, idx) => (
                  <div
                    key={year + "Spring-" + (course.course_id || course.course_name) + "-" + idx}
                    className={`course-box ${course.conflict ? "conflict" : ""}`}
                    draggable
                    onDragStart={(evt) => handleDragStart(evt, course, year + "Spring")}
                    title={course.conflict || ""}
                  >
                    <strong>{course.course_name}</strong>
                    <button
                      className="remove-btn"
                      onClick={() => removeCourse(year + "Spring", course)}
                    >
                      ✖
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* SUMMER Toggle */}
            <div className="horizontal-line-container" onClick={() => toggleSummer(year)}>
              <div className="plus-circle">{summerVisible[year] ? "–" : "+"}</div>
            </div>
            {summerVisible[year] && (
              <div
                className="semester-box"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, year + "Summer")}
              >
                <div className="semester-title">Summer</div>
                <div className="question-mark-container">
                  <span className="question-mark">?</span>
                  <span className="tooltip-text">{getRecommendedCredits(year + "Summer")}</span>
                </div>
                <div className="courses">
                  {(semesters[year + "Summer"] || []).map((course, idx) => (
                    <div
                      key={year + "Summer-" + (course.course_id || course.course_name) + "-" + idx}
                      className={`course-box ${course.conflict ? "conflict" : ""}`}
                      draggable
                      onDragStart={(evt) => handleDragStart(evt, course, year + "Summer")}
                      title={course.conflict || ""}
                    >
                      <strong>{course.course_name}</strong>
                      <button
                        className="remove-btn"
                        onClick={() => removeCourse(year + "Summer", course)}
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
      </div>
    </div>
  );
}

export default App;