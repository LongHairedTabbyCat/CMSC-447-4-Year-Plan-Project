import React, { useState, useEffect } from "react"; // Removed useCallback as it wasn't used after merge
import "./App.css";

const API_BASE_URL = "http://localhost:5000";

// Define the order of semesters for prerequisite checking (from old branch)
const semesterOrder = [
  "Spring 2025",
  "Fall 2025",
  "Spring 2026",
  "Fall 2026",
];

// Define prerequisite rules with types: 'strict' or 'concurrent'
// Note: Ensure course_names here EXACTLY match those in your data.
const prerequisiteRules = {
    "Artificial Intelligence": [
        // Example: AI needs CS I strictly before, but CS II can be concurrent
        { name: "Computer Science I", type: "strict" },
        { name: "Computer Science II", type: "concurrent" }
    ],
    "Computer Science II": [
        // Example: CS II needs CS I before
        { name: "Computer Science I", type: "strict" }
    ],
    "Computer Science I": [
        // Example: Computer Science I needs Precalculus Mathematics before
        { name: "Precalculus Mathematics", type: "strict" }
    ],
    "Data Structures": [
        // Example: Data Structures allows CS II concurrently
        { name: "Computer Science II", type: "concurrent" }
    ],
    "Machine Learning": [
        // Example: ML allows Data Structures and Lin Alg concurrently
        { name: "Data Structures", type: "concurrent" },
        { name: "Linear Algebra", type: "concurrent" }
    ],
    // This is for testing purposes - will be replaced later by more complex, SQL-based logic.
};

// --- Mock Conflict Checking Logic (Distinguishes Strict vs Concurrent) ---

const checkCourseConflicts = (semestersData) => {
    console.log("Running MOCK conflict check (Strict/Concurrent) with data:", JSON.stringify(semestersData));
    const updatedSemesters = JSON.parse(JSON.stringify(semestersData)); // Deep copy
    const takenCoursesInPreviousSemesters = new Set();
    let globalConflictsFound = false;

    // 1. Reset conflicts first
    semesterOrder.forEach(semesterName => {
        if (updatedSemesters[semesterName]) {
            updatedSemesters[semesterName] = updatedSemesters[semesterName].map(course => ({
                ...course,
                conflict: null
            }));
        }
    });

    // 2. Check conflicts semester by semester
    semesterOrder.forEach(semesterName => {
        const currentSemesterCourses = updatedSemesters[semesterName] || [];
        const coursesInCurrentSemesterSet = new Set(currentSemesterCourses.map(c => c.course_name));

        currentSemesterCourses.forEach((course, index) => {
            const rulesForThisCourse = prerequisiteRules[course.course_name];
            let unmetPrerequisitesMessages = [];

            if (rulesForThisCourse && rulesForThisCourse.length > 0) {
                rulesForThisCourse.forEach(prereqRule => { // Iterate through rule objects {name, type}
                    const { name: prereqName, type: prereqType } = prereqRule; // Get name and type
                    let isMet = false;

                    // Apply check based on the prerequisite type
                    if (prereqType === 'strict') {
                        isMet = takenCoursesInPreviousSemesters.has(prereqName); // Must be in *previous* semesters ONLY
                        if (!isMet) {
                            unmetPrerequisitesMessages.push(
                                `Prerequisite '${prereqName}' must be completed before.` // Specific message
                            );
                        }
                    } else if (prereqType === 'concurrent') {
                        isMet = takenCoursesInPreviousSemesters.has(prereqName) || coursesInCurrentSemesterSet.has(prereqName); // Can be previous OR current
                        if (!isMet) {
                            unmetPrerequisitesMessages.push(
                                `Prerequisite '${prereqName}' must be taken before or concurrently.` // Specific message
                            );
                        }
                    } else {
                        // Optional: Handle unknown types or default to one behavior (e.g., concurrent)
                        console.warn(`Unknown prerequisite type '${prereqType}' for ${prereqName} regarding ${course.course_name}. Assuming concurrent.`);
                        isMet = takenCoursesInPreviousSemesters.has(prereqName) || coursesInCurrentSemesterSet.has(prereqName);
                        if (!isMet) {
                            unmetPrerequisitesMessages.push(
                                `Prerequisite '${prereqName}' must be taken before or concurrently.`
                            );
                        }
                    }
                });
            }

            // If any prerequisites were unmet, combine messages and set the conflict property
            if (unmetPrerequisitesMessages.length > 0) {
                updatedSemesters[semesterName][index].conflict = unmetPrerequisitesMessages.join("\n");
                globalConflictsFound = true;
                console.log(`MOCK Conflict(s) for: ${course.course_name} in ${semesterName}: ${updatedSemesters[semesterName][index].conflict.replace('\n', '; ')}`);
            }
        });

        // 3. Add courses from CURRENT semester to set for NEXT semester's checks
        coursesInCurrentSemesterSet.forEach(courseName => {
            takenCoursesInPreviousSemesters.add(courseName);
        });
    });

    console.log("MOCK Conflict check (Strict/Concurrent) complete. Conflicts found:", globalConflictsFound);
    return updatedSemesters;
};
// --- End Mock Conflict Checking Logic ---


function App() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDegree, setSelectedDegree] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [creditsFilter, setCreditsFilter] = useState("");
  const [courseNumberFilter, setCourseNumberFilter] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");
  const [attributeFilter, setAttributeFilter] = useState("");
  const [attributeValueFilter, setAttributeValueFilter] = useState("");
  const [openCategories, setOpenCategories] = useState(new Set()); // State for open dropdowns
  const [semesters, setSemesters] = useState(() => { // Initialize using semesterOrder
    const initial = {};
    semesterOrder.forEach(name => { initial[name] = []; });
    return initial;
  });

  const [allCourses, setAllCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const degreeRequirements = {
  "Computer Science": {
    // --- General Notes (Optional, for display) ---
    notes: [
      "Minimum 120 credits total for degree.",
      "Minimum GPA of 2.0 overall.",
      "Minimum grade of 'C' in courses applied to the major (unless otherwise noted).",
      "Completion of 45 upper-level credits, residence, Writing Intensive, and GenEd requirements.",
      "Two courses in each track cannot be used towards any other tracks." // If applicable to other tracks you might add later
    ],

    // --- Specific Course Categories ---
    gateway: {
      title: "Computer Science Gateway",
      credits: 8,
      description: "Complete the following with minimum grade of ‘B’:",
      courses: [
        "CMSC 201 - Computer Science I (4)",
        "CMSC 202 - Computer Science II (4)",
      ],
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
      credits: "3-4", // Credits vary based on choice
      description: "Complete one (1) of the following:",
      options: [
        "STAT 355 - Introduction to Probability and Statistics for Scientists and Engineers (4)",
        "STAT 451 - Introduction to Probability Theory (3)",
      ],
      countRequired: 1, // Explicitly state how many options to choose
    },
    requiredScienceSequence: {
      title: "Required Science Sequence",
      credits: 8, // Each sequence is 8 credits
      description: "Complete one (1) of the following two-course sequences:",
      sequences: [
        [
          "BIOL 141 - Foundations of Biology: Cells, Energy and Organisms (4)",
          "BIOL 142 - Foundations of Biology: Ecology and Evolution (4)"
        ],
        [
          "CHEM 101 - Principles of Chemistry I (4)",
          "CHEM 102 - Principles of Chemistry II (4)"
        ],
        [
          "PHYS 121 - Introductory Physics I (4)",
          "PHYS 122 - Introductory Physics II (4)"
        ],
      ],
      countRequired: 1, // Choose one sequence
    },
    requiredLab: {
      title: "Lab Science",
      credits: "2-4", // Credits vary
      description: "Complete one (1) of the following:",
      options: [
        "CHEM 102L - Introductory Chemistry Lab I (2)",
        "GES 286 - Exploring the Environment: A Geo-Spatial Perspective (4)", // Note: Check if this is a lab course or a mistake in the source text, usually labs are 1-2 credits. Assuming text is correct for now.
        "PHYS 122L - Introductory Physics Laboratory (3)",
        "SCI 101L - Quantitative Reasoning: Measurement and Skills Lab (2)", // Corrected name based on common UMBC Catalogs, adjust if needed
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
      description: "Complete 9 credits from 400-level CMSC courses (excluding CMSC 404, 495, 498, 499), approved computer engineering (CMPE) courses, or a maximum of two courses from the list below:",
      // It's hard to list ALL eligible 400-level CMSC dynamically here,
      // so we list the specific MATH options and note the CMSC/CMPE rule.
      optionsDescription: "Eligible courses include:",
      cmscOption: "Any CMSC 4xx level course not otherwise required or excluded (CMSC 404, 495, 498, 499).",
      cmpeOption: "Approved Computer Engineering (CMPE) courses.",
      mathOptions: [ // List the specific MATH options
        "MATH 430 - Matrix Analysis (3)",
        "MATH 441 - Introduction to Numerical Analysis (3)",
        "MATH 452 - Introduction to Stochastic Processes (3)",
        "MATH 475 - Combinatorics and Graph Theory (3)",
        "MATH 481 - Mathematical Modeling (3)",
        "MATH 483 - Linear and Combinatorial Optimization (3)",
      ],
      mathLimitNote: "A maximum of two MATH courses from this list may be used towards the Technical Elective requirement."
    }
  },
  // You can add other degrees here using the same structured format
  // "Information Technology": { ... },
  // "Computer Engineering": { ... },
};

  // --- Fetch Courses Effect (unchanged) ---
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


  // --- Drag and Drop Handlers (Integrate MOCK check) ---

  const handleDragStart = (event, course, fromSemester = null) => {
    // Use the existing structure for dragged data
    const draggedCourseData = {
      course_id: course.course_id,
      course_name: course.course_name,
      course_credits: course.course_credits,
      category: course.category,
      catalog_name: course.catalog_name,
      course_num: course.course_num,
      semester: course.semester,
      attribute: course.attribute,
      attributeValue: course.attributeValue,
    };
    event.dataTransfer.setData(
      "text/plain",
      JSON.stringify({ course: draggedCourseData, fromSemester })
    );
    // No effectAllowed needed here, handled by browser defaults or handleDragOver
  };

 const handleDrop = (event, targetSemester) => {
    event.preventDefault();
    const transferData = JSON.parse(event.dataTransfer.getData("text/plain"));
    const { course, fromSemester } = transferData; // 'course' here is the dragged data object

    // Use course_id if available, otherwise fall back to course_name for uniqueness check
    const uniqueId = course.course_id || course.course_name;

    // Use the functional update form of setState for safety
    setSemesters(prevSemesters => {
        let updatedSemesters = JSON.parse(JSON.stringify(prevSemesters)); // Deep copy for modification

        // 1. Remove from original semester if moved
        if (fromSemester && fromSemester !== targetSemester && updatedSemesters[fromSemester]) {
            updatedSemesters[fromSemester] = updatedSemesters[fromSemester].filter(
                (c) => (c.course_id || c.course_name) !== uniqueId
            );
        }

        // Initialize target semester if needed (shouldn't be necessary with initialization, but safe)
        if (!updatedSemesters[targetSemester]) {
            updatedSemesters[targetSemester] = [];
        }

        // 2. Add to target semester if not already present
        const courseExists = updatedSemesters[targetSemester].some(
            (existingCourse) => (existingCourse.course_id || existingCourse.course_name) === uniqueId
        );

        if (!courseExists) {
            // Find the full course data from allCourses to ensure we have the latest/complete object
            const fullCourseData = allCourses.find(c => (c.course_id || c.course_name) === uniqueId) || course;
             // Add the course, ensuring it has a 'conflict' property initialized to null
            const courseToAdd = { ...fullCourseData, conflict: null };
            updatedSemesters[targetSemester] = [...updatedSemesters[targetSemester], courseToAdd];
        }

        // 3. Run the MOCK conflict check on the new state and return it
        const finalState = checkCourseConflicts(updatedSemesters);
        console.log("State after drop and conflict check:", finalState); // Debug log
        return finalState;
    });
};


  const handleDragOver = (event) => {
    event.preventDefault();
    // Optionally set dropEffect if needed, but often default is fine
    // event.dataTransfer.dropEffect = "move";
  };

  // --- Remove Handler (Integrate MOCK check) ---
  const removeCourse = (semester, courseToRemove) => {
    const uniqueIdToRemove = courseToRemove.course_id || courseToRemove.course_name;

    setSemesters(prevSemesters => {
        let updatedSemesters = JSON.parse(JSON.stringify(prevSemesters)); // Deep copy

        if (updatedSemesters[semester]) {
            updatedSemesters[semester] = updatedSemesters[semester].filter(
                (c) => (c.course_id || c.course_name) !== uniqueIdToRemove
            );
        }

        // Re-run MOCK conflict check after removal
        const finalState = checkCourseConflicts(updatedSemesters);
        console.log("State after remove and conflict check:", finalState); // Debug log
        return finalState;
    });
  };

  // --- Filtering Logic (unchanged) ---
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
    // Handle credits filter potentially being a number or ""
    const creditsMatch = creditsFilter === "" || course.course_credits === creditsFilter;
    const courseNumberMatch = courseNumberFilter === "" || (course.course_num && course.course_num.toString().startsWith(courseNumberFilter));
    // Note: These filters below might not work well if the backend doesn't supply these fields yet
    const semesterMatch = semesterFilter === "" || course.semester === semesterFilter;
    const attributeMatch = attributeFilter === "" || course.attribute === attributeFilter;
    const attributeValueMatch = attributeValueFilter === "" || course.attributeValue === attributeValueFilter;
    const searchTermMatch = searchTerm.trim() === "" || (course.course_name && course.course_name.toLowerCase().includes(searchTerm.toLowerCase()));

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

  // --- Dynamically generate filter options (unchanged) ---
  const uniqueCategories = [...new Set(allCourses.map(c => c.category).filter(Boolean))].sort();
  const uniqueCredits = [...new Set(allCourses.map(c => c.course_credits).filter(c => c !== null))].sort((a, b) => a - b);

  const toggleCategory = (categoryKey) => {
    setOpenCategories(prevOpenCategories => {
      const newOpenCategories = new Set(prevOpenCategories); // Create a mutable copy
      if (newOpenCategories.has(categoryKey)) {
        newOpenCategories.delete(categoryKey); // Close it
      } else {
        newOpenCategories.add(categoryKey); // Open it
      }
      return newOpenCategories; // Return the new Set
    });
  };

  return (
    <div className="container">
      {/* Left Column (unchanged structure) */}
      <div className="left-column">
        {/* Degree Requirements - Updated */}
        <div className="degree-requirements">
          <h2>Degree Requirements</h2>
          <select
             value={selectedDegree}
             onChange={(e) => {
               setSelectedDegree(e.target.value);
               setOpenCategories(new Set()); // Reset open categories when degree changes
             }}
             className="degree-dropdown"
           >
             <option value="">Select a Degree</option>
             {Object.keys(degreeRequirements || {}).map((degree) => (
               <option key={degree} value={degree}>
                 {degree}
               </option>
             ))}
           </select>

           {/* --- Dropdown Rendering Logic --- */}
           {selectedDegree && degreeRequirements[selectedDegree] && (
             <div className="degree-accordion">
                {/* Iterate through all requirement categories */}
                {Object.keys(degreeRequirements[selectedDegree]).map(categoryKey => {
                    const category = degreeRequirements[selectedDegree][categoryKey];
                    const isOpen = openCategories.has(categoryKey);

                    // Special handling for 'notes' if you want it displayed differently
                    // or just treat it like any other category
                    if (categoryKey === 'notes' && Array.isArray(category)) {
                        // Option 1: Render notes as a non-collapsible section (or collapsible)
                         return (
                            <div key={categoryKey} className="requirement-category category-notes">
                                <button
                                    type="button"
                                    className="category-header"
                                    onClick={() => toggleCategory(categoryKey)}
                                    aria-expanded={isOpen}
                                >
                                    <span>General Notes</span>
                                    <span className="toggle-icon">{isOpen ? '▼' : '▶'}</span>
                                </button>
                                {isOpen && (
                                    <div className="category-content">
                                        <ul>
                                            {category.map((note, index) => (
                                                <li key={`note-${index}`}>{note}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                         );
                    }

                    // Skip rendering if category is not an object (like the notes array if handled above)
                    if (typeof category !== 'object' || category === null) return null;


                    // Determine credit string to display in header
                    let creditInfo = '';
                    if (category.credits) {
                        creditInfo = `(${category.credits} credits)`;
                    } else if (category.creditsRequired) {
                         creditInfo = `(${category.creditsRequired} credits required)`;
                    } else if (category.title === "Lab Science" || category.title === "Required Statistics Courses") {
                        // Add specific logic if credits vary like "2-4" or "3-4"
                        creditInfo = `(${category.credits} credits)`;
                    }


                    // Regular category rendering
                    return (
                      <div key={categoryKey} className={`requirement-category category-${categoryKey}`}>
                        <button
                          type="button" // Good practice for non-submitting buttons
                          className="category-header"
                          onClick={() => toggleCategory(categoryKey)}
                          aria-expanded={isOpen} // Accessibility
                        >
                          {/* Header Content: Title and Credits */}
                          <span>{category.title || categoryKey} {creditInfo}</span>
                          {/* Toggle Icon */}
                          <span className="toggle-icon">{isOpen ? '▼' : '▶'}</span>
                        </button>

                        {/* Content - Render only if open */}
                        {isOpen && (
                          <div className="category-content">
                            {/* Description */}
                            {category.description && <p>{category.description}</p>}

                            {/* Required Courses List */}
                            {category.courses && Array.isArray(category.courses) && (
                              <ul>
                                {category.courses.map((course, index) => (
                                  <li key={`${categoryKey}-course-${index}`}>{course}</li>
                                ))}
                              </ul>
                            )}

                            {/* Options List */}
                            {category.options && Array.isArray(category.options) && (
                              <>
                                 {category.countRequired && <p><em>(Choose {category.countRequired})</em></p>}
                                 <ul>
                                   {category.options.map((option, index) => (
                                     <li key={`${categoryKey}-option-${index}`}>{option}</li>
                                   ))}
                                 </ul>
                              </>
                            )}

                             {/* Science Sequences List */}
                             {category.sequences && Array.isArray(category.sequences) && (
                                <>
                                   {category.countRequired && <p><em>(Choose {category.countRequired} sequence)</em></p>}
                                    {category.sequences.map((sequence, seqIndex) => (
                                        <div key={`${categoryKey}-seq-${seqIndex}`} className="sequence-option">
                                            <p><strong>Option {seqIndex + 1}:</strong></p>
                                            <ul>
                                                {sequence.map((course, courseIndex) => (
                                                    <li key={`${categoryKey}-seq-${seqIndex}-course-${courseIndex}`}>{course}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </>
                             )}

                             {/* Special Handling for Technical Electives */}
                             {categoryKey === 'technicalElectives' && (
                                <div className="technical-electives-details">
                                    {category.optionsDescription && <p><em>{category.optionsDescription}</em></p>}
                                    {category.cmscOption && <p>- {category.cmscOption}</p>}
                                    {category.cmpeOption && <p>- {category.cmpeOption}</p>}
                                    {category.mathOptions && Array.isArray(category.mathOptions) && (
                                        <>
                                         <p>- Maximum of two from the following MATH courses:</p>
                                         <ul>
                                            {category.mathOptions.map((mathOption, index) => (
                                                <li key={`${categoryKey}-math-${index}`}>{mathOption}</li>
                                            ))}
                                         </ul>
                                        </>
                                    )}
                                     {category.mathLimitNote && <p><em>{category.mathLimitNote}</em></p>}
                                </div>
                             )}
                          </div> // End category-content
                        )}
                      </div> // End requirement-category
                    );
                })}
             </div> // End degree-accordion
           )}
           {/* --- End Dropdown Rendering Logic --- */}
        </div>

        {/* Course Search & Filters (unchanged structure) */}
        <div className="course-search">
          <h2>Course Search</h2>
          <input
            type="text"
            className="search-input"
            placeholder="Search for a course..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {/* Filters UI (unchanged) */}
          <div className="filters">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="filter-dropdown"
            >
              <option value="">Category</option>
              {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>

            <select
              value={creditsFilter}
              onChange={(e) => {
                  const value = e.target.value;
                  // Store as number or empty string
                  setCreditsFilter(value === "" ? "" : parseInt(value, 10));
              }}
              className="filter-dropdown"
            >
              <option value="">Credits</option>
              {uniqueCredits.map(cred => <option key={cred} value={cred}>{cred} Credits</option>)}
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
                disabled={attributeFilter === "" || attributeFilter === "NONE" || attributeFilter === "First Year Experience"}
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

          {/* Display Loading / Error / Results (unchanged structure) */}
          <div className="search-results">
             {loading && <p>Loading courses...</p>}
             {error && <p className="error-message">{error}</p>}
             {!loading && !error && anyFilterApplied() &&
              filteredCourses.map((course) => (
                <div
                  // Use course_id if available, fallback to course_name for key
                  key={course.course_id || course.course_name}
                  className="result-item"
                  draggable
                  onDragStart={(event) => handleDragStart(event, course)}
                >
                  <strong>{course.course_name}</strong> ({course.catalog_name})
                </div>
              ))}
            {!loading && !error && anyFilterApplied() && filteredCourses.length === 0 && (
                 <p>No courses match the selected filters.</p>
            )}
            {!loading && !error && !anyFilterApplied() && (
                <p>Apply filters or search to see courses.</p>
            )}
          </div>
        </div>
      </div>

      {/* Right Column (Semesters) - Updated Rendering */}
      <div className="semesters">
        <h2>Semesters</h2>
        {/* Use semesterOrder to ensure consistent display order */}
        {semesterOrder.map((semesterName) => (
          <div
            key={semesterName}
            className="semester-item"
            onDragOver={handleDragOver}
            onDrop={(event) => handleDrop(event, semesterName)}
          >
            <div className="semester-title">{semesterName}</div>
            <div className="courses">
              {/* Render courses from state, checking for existence */}
              {(semesters[semesterName] || []).map((course, idx) => (
                <div
                  // Use course_id if available, fallback to course_name for key uniqueness
                  key={`${semesterName}-${course.course_id || course.course_name}-${idx}`}
                   // Add 'conflict' class conditionally based on the course's conflict property
                  className={`course-box ${course.conflict ? 'conflict' : ''}`}
                  draggable
                  onDragStart={(event) =>
                    // Pass the full course object and the semester it's coming from
                    handleDragStart(event, course, semesterName)
                  }
                  // Add title attribute to show conflict message on hover
                  title={course.conflict || ''}
                >
                  <strong>{course.course_name}</strong>
                  <button
                    className="remove-btn"
                    onClick={() => removeCourse(semesterName, course)}
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