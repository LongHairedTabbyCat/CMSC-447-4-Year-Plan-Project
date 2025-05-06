import React, { useState, useEffect, useCallback, useMemo } from "react"; // Added useMemo
import "./App.css";

const API_BASE_URL = "http://localhost:5000";

// Start with the initial 4 base years
const initialYears = ["Year1", "Year2", "Year3", "Year4"];

function App() {
  // State declarations
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDegree, setSelectedDegree] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [creditsFilter, setCreditsFilter] = useState("");
  const [courseNumberFilter, setCourseNumberFilter] = useState("");
  const [semesterFilter, setSemesterFilter] = useState(""); // State for Semester filter
  const [attributeFilter, setAttributeFilter] = useState(""); // State for Attribute filter
  const [attributeValueFilter, setAttributeValueFilter] = useState(""); // State for Attribute Value filter
  const [openCategories, setOpenCategories] = useState(new Set()); // For degree req accordion
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
  const [expandedCourses, setExpandedCourses] = useState(new Set()); // Tracks expanded course items in planner

  // Derived state/maps
  const yearMap = years.reduce((acc, year) => {
    acc[year] = "Year " + year.substring(4);
    return acc;
  }, {});

  // Static Data (Degree Requirements)
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
    "Computer Engineering": {
        notes: [
        "Minimum 120 credits total for degree.",
        "Minimum GPA of 2.0 overall.",
        "Completion of 45 upper-level credits, residence, Writing Intensive, and GenEd requirements.",
        "Minimum grade of 'C' in courses applied to the major (unless otherwise noted).",
        "Minimum of 18 credits in CMSC, CMPE and/or ENEE courses must be completed in residence at UMBC.",
        "Students may complete one major or minor from Computer Science and Electrical Engineering.",
        "Completion of one of the following tracks is required: Communications, Cybersecurity, or Electronic Systems."
        ],
        gateway: {
        title: "Computer Engineering Gateway",
        credits: 23,
        description: "Students are admitted to the Computer Engineering program when they pass the following Gateway courses with required minimum grades.",
        courses: [
            "CMPE 212 - Principles of Digital Design (4) - Minimum grade of 'B'",
            "CMSC 201 - Computer Science I (4) or CMSC 201H - Computer Science I (Honors) (4) - Minimum grade of 'B'",
            "MATH 151 - Calculus and Analytic Geometry I (4) - Minimum grade of 'B'",
            "PHYS 121 - Introductory Physics I (4) and PHYS 122 - Introductory Physics II (4) - At least one with minimum grade of 'B'",
            "ENES 101 - Introduction to Engineering (3) - Minimum grade of 'C'"
        ]
        },
        requiredCs: {
        title: "Required Computer Science Courses",
        credits: 16,
        description: "Complete the following:",
        courses: [
            "CMSC 202 - Computer Science II (4) or CMSC 202H - Computer Science II (Honors) (4)",
            "CMSC 203 - Discrete Structures (3)",
            "CMSC 341 - Data Structures (3) or CMSC 341H - Data Structures (3)",
            "CMSC 411 - Computer Architecture (3)",
            "CMSC 421 - Principles of Operating Systems (3)"
        ]
        },
        requiredMath: {
        title: "Required Mathematics Courses",
        credits: 14,
        description: "Complete the following:",
        courses: [
            "MATH 152 - Calculus and Analytic Geometry II (4)",
            "MATH 221 - Introduction to Linear Algebra (3)",
            "MATH 225 - Introduction to Differential Equations (3)",
            "MATH 251 - Multivariable Calculus (4)"
        ]
        },
        requiredScienceElective: {
        title: "Science Elective",
        credits: "3-4",
        description: "Complete one (1) of the following:",
        options: [
            "BIOL 141 - Foundations of Biology: Cells, Energy and Organisms (4)",
            "BIOL 142 - Foundations of Biology: Ecology and Evolution (4)",
            "CHEM 101 - Principles of Chemistry I (4)",
            "PHYS 220 - Introduction to Computational Physics (3)",
            "PHYS 224 - Vibrations and Waves (3)"
        ],
        countRequired: 1
        },
        requiredEngineering: {
        title: "Required Computer Engineering Courses",
        credits: 26,
        description: "Complete the following:",
        courses: [
            "CMPE 306 - Introductory Circuit Theory (4)",
            "CMPE 310 - Systems Design and Programming (4)",
            "CMPE 311 - C Programming and Embedded Systems (3)",
            "CMPE 314 - Principles of Electronic Circuits (4)",
            "CMPE 320 - Probability, Statistics, and Random Processes (3)",
            "CMPE 349 - Introduction to Professional Practice (3)",
            "CMPE 450 - Capstone I (3)",
            "CMPE 451 - Capstone II (3)"
        ]
        }
    },
    "Information Systems": {
        notes: [
        "Minimum 120 credits total for degree.",
        "Minimum GPA of 2.0 overall.",
        "Completion of 45 upper‑level credits, residence requirement, Writing Intensive requirement, and General Education requirement.",
        "Minimum 65 credits in the major.",
        "Minimum grade of 'C' in courses applied to the major (unless otherwise noted).",
        "Minimum of 9 IS courses at the 300 level or higher completed in residence at UMBC."
        ],
        gateway: {
        title: "Gateway Courses",
        credits: "13-14",
        description: "Complete the following courses with a grade of ‘B’ or better. These courses must be completed in residence and Information Systems does not support third‑time repeat petitions for the purposes of continuing in this major.",
        courses: [
            "IS 300 - Management Information Systems (3)",
            "IS 310 - Software and Hardware Concepts (3)",
            "IS 147 - Introduction to Computer Programming (3) or CMSC 201 - Computer Science I (4)",
            "MATH 151 - Calculus and Analytic Geometry I (4) or MATH 155 - Applied Calculus (4)"
        ]
        },
        informationSystems: {
        title: "Information Systems",
        credits: 21,
        description: "Complete the following:",
        courses: [
            "IS 410 - Introduction to Database Design (3)",
            "IS 420 - Database Application Development (3)",
            "IS 425 - Decision Support Systems (3)",
            "IS 436 - Structured Systems Analysis and Design (3)",
            "IS 450 - Data Communications and Networks (3)",
            "IS 451 - Network Design and Management (3)",
            "Additional upper‑level IS course, excluding IS 397, IS 399, IS 400, IS 467, IS 469, IS 478, IS 479 and any course also applied to an Information Systems certificate."
        ]
        },
        mathAndCs: {
        title: "Mathematics and Computer Science",
        credits: "13-14",
        description: "Complete the following. Students who complete IS 147 in the Gateway complete IS 247. Students who complete CMSC 201 in the Gateway complete CMSC 202.",
        courses: [
            "IS 247 - Computer Programming II (3) or CMSC 202 - Computer Science II (4)",
            "MATH 215 - Applied Finite Mathematics (3) or MATH 221 - Introduction to Linear Algebra (3)",
            "STAT 351 - Applied Statistics for Business and Economics (4)",
            "One additional semester of an approved programming language"
        ]
        },
        administrativeScience: {
        title: "Administrative Science",
        credits: 18,
        description: "Complete the following:",
        courses: [
            "MGMT 210 - The Practice of Management (3)",
            "ECON 101 - Principles of Microeconomics (3)",
            "ECON 102 - Principles of Macroeconomics (3)",
            "ECON 121 - Principles of Accounting I (3)",
            "ECON 122 - Principles of Accounting II (3)",
            "ENGL 393 - Technical Communication (3) or IS 369 - Research Seminar: Writings in Information Systems (3)"
        ]
        }
    }
  };


  // --- Functions ---

  // Toggle Course Expansion in Planner
  const toggleCourseExpansion = (itemKey) => {
    setExpandedCourses(prev => {
        const newSet = new Set(prev);
        if (newSet.has(itemKey)) {
            newSet.delete(itemKey);
        } else {
            newSet.add(itemKey);
        }
        return newSet;
    });
  };

  // Backend Conflict Checking
  const checkPrerequisitesWithAPI = useCallback(async (currentSemestersData) => {
    const semesterOrder = years.flatMap(year => [
        `${year}Fall`, `${year}Winter`, `${year}Spring`, `${year}Summer`
    ]);
    const payload = {
      semesters: semesterOrder.map(semesterKey => ({
        name: semesterKey,
        // Ensure courses property exists, even if empty
        courses: (currentSemestersData[semesterKey] || []).map(course => course.course_id)
      }))
    };

    console.log("Sending to backend for check:", JSON.stringify(payload));

    try {
      const response = await fetch(`${API_BASE_URL}/plan/check-prerequisites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API Error (${response.status}): ${errorData.error || 'Unknown error'}`);
      }

      const result = await response.json();
      console.log("Received from backend:", result);

      const conflictsMap = new Map();
      (result.missing_prerequisites || []).forEach(conflict => { // Safely handle if missing_prerequisites is undefined
        conflictsMap.set(conflict.course_id, conflict.message);
      });

      const updatedSemestersWithConflicts = { ...currentSemestersData };

      Object.keys(updatedSemestersWithConflicts).forEach(semesterKey => {
        // Ensure the semester key exists and has an array
        if (!updatedSemestersWithConflicts[semesterKey]) {
            updatedSemestersWithConflicts[semesterKey] = [];
        }
        updatedSemestersWithConflicts[semesterKey] = updatedSemestersWithConflicts[semesterKey].map(course => {
          const conflictMessage = conflictsMap.get(course.course_id);
          // Update conflict status, preserve other course data
          return { ...course, conflict: conflictMessage || null };
        });
      });

      console.log("Final state before setting:", updatedSemestersWithConflicts);
      setSemesters(updatedSemestersWithConflicts);

    } catch (error) {
      console.error("Failed to check prerequisites:", error);
      setError(`Prerequisite check failed: ${error.message}. Check backend connection.`);
      // Decide on error handling: keep potentially invalid state or revert
      // setSemesters(currentSemestersData); // Uncomment to revert on error
    }
  }, [years, setError]); // Added setError dependency

  // Recommended Credits Tooltip Helper
  function getRecommendedCredits(semesterKey) {
    const lower = semesterKey.toLowerCase();
    if (lower.includes("winter")) return "Up to 4.5 credits";
    if (lower.includes("summer")) return "Up to 16 credits";
    return "Recommended credits: 12-19";
  }

  // Fetch Courses from API on Mount
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
        // Ensure essential fields AND NEW fields are present or defaulted
        const sanitizedData = data.map(course => ({
          course_id: course.course_id ?? `missing_id_${Math.random()}`,
          catalog_name: course.catalog_name ?? 'Unknown ID', // Changed from catalogname for consistency
          course_name: course.course_name ?? 'Unnamed Course',
          category: course.category ?? null, // Default null if missing
          course_num: course.course_num ?? null, // Default null if missing
          course_desc: course.course_desc ?? '',
          course_credits: course.course_credits ?? 0,
          prerequisite_stmt: course.prerequisite_stmt ?? '',
          course_attributes: course.course_attributes ?? [], // Default empty array
          attribute_values: course.attribute_values ?? [], // Default empty array
          availability: course.availability ?? null, // Default null
          ...course // Spread remaining fields just in case
        }));
        setAllCourses(sanitizedData);
      } catch (e) {
        console.error("Failed to fetch courses:", e);
        setError("Failed to load courses. Please ensure the backend is running and returning valid data.");
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []); // Empty dependency array - runs once on mount

  // Drag & Drop Handlers
  const handleDragStart = (event, course, fromSemester = null) => {
     // Ensure *all* relevant data, including new fields, is transferred
     const draggedCourseData = {
        course_id: course.course_id,
        catalog_name: course.catalog_name,
        course_name: course.course_name,
        course_credits: course.course_credits,
        category: course.category,
        course_num: course.course_num,
        course_desc: course.course_desc,
        prerequisite_stmt: course.prerequisite_stmt,
        course_attributes: course.course_attributes,
        attribute_values: course.attribute_values,
        availability: course.availability,
     };
    event.dataTransfer.setData(
      "text/plain",
      JSON.stringify({ course: draggedCourseData, fromSemester })
    );
  };

  const handleDragOver = (event) => {
    event.preventDefault(); // Necessary to allow dropping
  };

  const handleDrop = (event, targetSemester) => {
    event.preventDefault();
    const transferData = JSON.parse(event.dataTransfer.getData("text/plain"));
    const { course, fromSemester } = transferData; // Course data here might be simplified from dragStart
    const uniqueId = course.course_id;

    // Avoid dropping onto itself
    if (fromSemester === targetSemester) return;

    let nextState = JSON.parse(JSON.stringify(semesters));

    // Remove from the original semester if moving & clean up expansion state
    if (fromSemester && nextState[fromSemester]) {
      const oldItemKey = `${fromSemester}-${uniqueId}`;
      setExpandedCourses(prev => {
         const newSet = new Set(prev);
         newSet.delete(oldItemKey);
         return newSet;
      });
      nextState[fromSemester] = nextState[fromSemester].filter(
        (c) => c.course_id !== uniqueId
      );
    }

    // Initialize target semester if it doesn't exist (should be rare)
    if (!nextState[targetSemester]) {
      nextState[targetSemester] = [];
    }
    const exists = nextState[targetSemester].some((c) => c.course_id === uniqueId);

    if (!exists) {
      // --- Use the full course data from allCourses ---
      // Find the complete course data from `allCourses` using the ID.
      // Fallback to the potentially simplified `course` from transferData if not found (should not happen ideally).
      const fullCourseData = allCourses.find((c) => c.course_id === uniqueId) || course;

      // Add the *full* course object with conflict initially null
      nextState[targetSemester].push({ ...fullCourseData, conflict: null });
    } else {
      console.warn(`Course ${uniqueId} already exists in ${targetSemester}`);
      // Optional: Prevent drop or show notification
      // checkPrerequisitesWithAPI(semesters); // Revert check?
      // return;
    }

    // Call the API check with the potential next state
    checkPrerequisitesWithAPI(nextState);
  };


  // Remove Course Handler
  const removeCourse = (semesterKey, courseToRemove) => {
    const uniqueId = courseToRemove.course_id;
    const itemKey = `${semesterKey}-${uniqueId}`;

    setExpandedCourses(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemKey);
        return newSet;
    });

    let nextState = JSON.parse(JSON.stringify(semesters));
    if (nextState[semesterKey]) {
        nextState[semesterKey] = nextState[semesterKey].filter(
            (c) => c.course_id !== uniqueId
        );
    }

    checkPrerequisitesWithAPI(nextState);
  };

  // --- Filtering Logic ---
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

  // Get Unique Values for Filters
  const uniqueCategories = useMemo(() => [
    ...new Set(allCourses.map((c) => c.category).filter(Boolean)),
  ].sort(), [allCourses]);

  const uniqueCredits = useMemo(() => [
    ...new Set(allCourses.map((c) => c.course_credits).filter((v) => v !== null && v !== undefined)),
  ].sort((a, b) => a - b), [allCourses]);

  // --- Get unique attributes and attribute values ---
  const uniqueAttributes = useMemo(() => [
      ...new Set(allCourses.flatMap(c => c.course_attributes || []).filter(Boolean))
  ].sort(), [allCourses]);

  const uniqueAttributeValues = useMemo(() => [
      ...new Set(allCourses.flatMap(c => c.attribute_values || []).filter(Boolean))
  ].sort(), [allCourses]);


  // Updated Filtered Courses Logic
  const filteredCourses = allCourses.filter((course) => {
    // Existing filters
    const categoryMatch = categoryFilter === "" || (course.category && course.category === categoryFilter);
    const creditsMatch = creditsFilter === "" || (course.course_credits !== null && course.course_credits === Number(creditsFilter));
    const courseNumberMatch = courseNumberFilter === "" || (course.course_num && course.course_num.toString().startsWith(courseNumberFilter));
    const searchTermMatch =
      searchTerm.trim() === "" ||
      (course.course_name && course.course_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (course.catalog_name && course.catalog_name.toLowerCase().includes(searchTerm.toLowerCase()));

    // --- Semester Filter ---
    const semesterMatch = (() => {
        if (semesterFilter === "") return true; // 'All Semesters' selected
        if (!course.availability) return false; // Course has no availability data

        switch (semesterFilter) {
            case "Fall": return course.availability.fall_availability > 0;
            case "Winter": return course.availability.winter_availability > 0;
            case "Spring": return course.availability.spring_availability > 0;
            case "Summer": return course.availability.summer_availability > 0;
            default: return true; // Should not happen, but default to true
        }
    })();
    // --- Semester Filter ---

    const attributeMatch = attributeFilter === "" || (course.course_attributes && course.course_attributes.includes(attributeFilter));
    const attributeValueMatch = attributeValueFilter === "" || (course.attribute_values && course.attribute_values.includes(attributeValueFilter));

    // Combine all filter results
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


  // Toggle Degree Requirement Category Visibility
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

  // Toggle Optional Semester Visibility
  const toggleOptionalSemester = (year, season, isVisibleState, setVisibleState, checkPrerequisites) => {
     setVisibleState((prev) => {
      const semesterKey = year + season;
      const newVisibility = !prev[year];

      if (!newVisibility) { // Toggling OFF (hiding)
        setExpandedCourses(currentExpanded => {
           const nextExpanded = new Set(currentExpanded);
           (semesters[semesterKey] || []).forEach(course => {
               nextExpanded.delete(`${semesterKey}-${course.course_id}`);
           });
           return nextExpanded;
        });

        let nextState = JSON.parse(JSON.stringify(semesters));
        nextState[semesterKey] = []; // Effectively remove courses for the check
        checkPrerequisites(nextState); // Call the API check
      }
      // No check needed when toggling ON

      return { ...prev, [year]: newVisibility };
    });
  };

  const toggleWinter = (year) => toggleOptionalSemester(year, "Winter", winterVisible, setWinterVisible, checkPrerequisitesWithAPI);
  const toggleSummer = (year) => toggleOptionalSemester(year, "Summer", summerVisible, setSummerVisible, checkPrerequisitesWithAPI);


  // Add/Remove Year Handlers
  const addYear = () => {
    const yearNums = years.map((y) => Number(y.replace("Year", "")));
    const maxYearNum = yearNums.length > 0 ? Math.max(...yearNums) : 0;
    const newYear = "Year" + (maxYearNum + 1);

    setYears((prev) => [...prev, newYear]);
    setWinterVisible((prev) => ({ ...prev, [newYear]: false }));
    setSummerVisible((prev) => ({ ...prev, [newYear]: false }));
    setSemesters((prev) => ({
      ...prev,
      [newYear + "Fall"]: [],
      [newYear + "Winter"]: [],
      [newYear + "Spring"]: [],
      [newYear + "Summer"]: [],
    }));
     // No API check needed here
  };

  const removeYear = (year) => {
    setExpandedCourses(prev => {
        const nextExpanded = new Set(prev);
        const keysToRemove = [`${year}Fall`, `${year}Winter`, `${year}Spring`, `${year}Summer`];
        keysToRemove.forEach(semesterKey => {
            (semesters[semesterKey] || []).forEach(course => {
                nextExpanded.delete(`${semesterKey}-${course.course_id}`);
            });
        });
        return nextExpanded;
    });

    setWinterVisible((prev) => { const updated = { ...prev }; delete updated[year]; return updated; });
    setSummerVisible((prev) => { const updated = { ...prev }; delete updated[year]; return updated; });

    let nextState = JSON.parse(JSON.stringify(semesters));
    delete nextState[year + "Fall"];
    delete nextState[year + "Winter"];
    delete nextState[year + "Spring"];
    delete nextState[year + "Summer"];

    setYears((prev) => prev.filter((y) => y !== year));

    checkPrerequisitesWithAPI(nextState);
  };


  // --- RENDER ---
  return (
    <div className="container">
      {/* --- LEFT COLUMN --- */}
      <div className="left-column">
        {/* Degree Requirements */}
        <div className="degree-requirements">
          <h2>Degree Requirements</h2>
          <select
            value={selectedDegree}
            onChange={(e) => {
              setSelectedDegree(e.target.value);
              setOpenCategories(new Set()); // Reset accordion on change
            }}
            className="degree-dropdown"
            aria-label="Select Degree Program"
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
                {Object.entries(degreeRequirements[selectedDegree]).map(([categoryKey, category]) => {
                    const isOpen = openCategories.has(categoryKey);
                    if (categoryKey === "notes" && Array.isArray(category)) {
                    // Special handling for notes array
                    return (
                        <div key={categoryKey} className="requirement-category category-notes">
                        <button type="button" className="category-header" onClick={() => toggleCategory(categoryKey)} aria-expanded={isOpen}>
                            <span>General Notes</span>
                            <span className="toggle-icon" aria-hidden="true">{isOpen ? "▼" : "▶"}</span>
                        </button>
                        {isOpen && (
                            <div className="category-content">
                            <ul>{category.map((note, idx) => <li key={`note-${idx}`}>{note}</li>)}</ul>
                            </div>
                        )}
                        </div>
                    );
                    }
                    // Skip rendering if category is not a valid object or is null
                    if (typeof category !== "object" || category === null || !category.title) return null;

                    let creditInfo = "";
                    if (category.credits) creditInfo = `(${category.credits} credits)`;
                    else if (category.creditsRequired) creditInfo = `(${category.creditsRequired} credits required)`;

                    return (
                    <div key={categoryKey} className={`requirement-category category-${categoryKey}`}>
                        <button type="button" className="category-header" onClick={() => toggleCategory(categoryKey)} aria-expanded={isOpen}>
                        <span>{category.title} {creditInfo}</span>
                        <span className="toggle-icon" aria-hidden="true">{isOpen ? "▼" : "▶"}</span>
                        </button>
                        {isOpen && (
                        <div className="category-content">
                            {category.description && <p>{category.description}</p>}
                            {/* Render based on content type (courses, options, sequences, etc.) */}
                            {category.courses && Array.isArray(category.courses) && (
                            <ul>{category.courses.map((course, idx) => <li key={`${categoryKey}-course-${idx}`}>{course}</li>)}</ul>
                            )}
                            {category.options && Array.isArray(category.options) && (
                            <>
                                {category.countRequired && <p><em>(Choose {category.countRequired})</em></p>}
                                <ul>{category.options.map((opt, idx) => <li key={`${categoryKey}-option-${idx}`}>{opt}</li>)}</ul>
                            </>
                            )}
                            {category.sequences && Array.isArray(category.sequences) && (
                            <>
                                {category.countRequired && <p><em>(Choose {category.countRequired} sequence)</em></p>}
                                {category.sequences.map((sequence, seqIndex) => (
                                <div key={`${categoryKey}-seq-${seqIndex}`} className="sequence-option">
                                    <p><strong>Option {seqIndex + 1}:</strong></p>
                                    <ul>{sequence.map((sCourse, sIdx) => <li key={`${categoryKey}-seq-${seqIndex}-course-${sIdx}`}>{sCourse}</li>)}</ul>
                                </div>
                                ))}
                            </>
                            )}
                            {/* Special rendering for technical electives */}
                            {categoryKey === "technicalElectives" && (
                            <div className="technical-electives-details">
                                {category.optionsDescription && <p><em>{category.optionsDescription}</em></p>}
                                {category.cmscOption && <p>- {category.cmscOption}</p>}
                                {category.cmpeOption && <p>- {category.cmpeOption}</p>}
                                {category.mathOptions && Array.isArray(category.mathOptions) && (
                                <>
                                    <p>- Maximum of two from the following MATH courses:</p>
                                    <ul>{category.mathOptions.map((mathOpt, idx) => <li key={`math-opt-${idx}`}>{mathOpt}</li>)}</ul>
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
            placeholder="Search course name or ID (e.g., CMSC 201)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search for courses"
          />
          {/* --- UPDATED FILTERS --- */}
          <div className="filters">
             {/* Existing Filters */}
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="filter-dropdown" aria-label="Filter by Category">
              <option value="">All Categories</option>
              {uniqueCategories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <select value={creditsFilter} onChange={(e) => setCreditsFilter(e.target.value)} className="filter-dropdown" aria-label="Filter by Credits">
              <option value="">All Credits</option>
              {uniqueCredits.map((cred) => <option key={cred} value={cred}>{cred} Credits</option>)}
            </select>
            <select value={courseNumberFilter} onChange={(e) => setCourseNumberFilter(e.target.value)} className="filter-dropdown" aria-label="Filter by Course Level">
              <option value="">All Levels</option>
              <option value="1">1xx</option>
              <option value="2">2xx</option>
              <option value="3">3xx</option>
              <option value="4">4xx</option>
              {/* Add others like 6xx if needed */}
            </select>
            {/* --- NEW FILTERS --- */}
             <select value={semesterFilter} onChange={(e) => setSemesterFilter(e.target.value)} className="filter-dropdown" aria-label="Filter by Semester Offered">
              <option value="">All Semesters</option>
              <option value="Fall">Fall</option>
              <option value="Winter">Winter</option>
              <option value="Spring">Spring</option>
              <option value="Summer">Summer</option>
            </select>
            <select value={attributeFilter} onChange={(e) => setAttributeFilter(e.target.value)} className="filter-dropdown" aria-label="Filter by Course Attribute">
              <option value="">All Attributes</option>
              {uniqueAttributes.map((attr) => <option key={attr} value={attr}>{attr}</option>)}
            </select>
             <select value={attributeValueFilter} onChange={(e) => setAttributeValueFilter(e.target.value)} className="filter-dropdown" aria-label="Filter by Attribute Value">
              <option value="">All Attribute Values</option>
              {uniqueAttributeValues.map((val) => <option key={val} value={val}>{val}</option>)}
            </select>
            {/* --- END NEW FILTERS --- */}
          </div>
          {/* --- END UPDATED FILTERS --- */}
          <div className="search-results">
            {loading && <p>Loading courses...</p>}
            {error && !loading && <p className="error-message">{error}</p>}
            {!loading && !error && anyFilterApplied() && filteredCourses.length > 0 &&
              filteredCourses.map((course) => (
                <div
                  key={course.course_id}
                  className="result-item"
                  draggable
                  onDragStart={(e) => handleDragStart(e, course)} // handleDragStart now sends full object data
                  title={`${course.course_name} (${course.course_credits} Cr)${course.course_desc ? `\nDesc: ${course.course_desc}` : ''}${course.prerequisite_stmt ? `\nPrereqs: ${course.prerequisite_stmt}` : ''}`}
                >
                  <strong>{course.catalog_name}</strong>: {course.course_name} ({course.course_credits} Cr)
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
      </div> {/* End Left Column */}

      {/* --- RIGHT COLUMN: MULTI-YEAR PLANNER --- */}
      <div className="semesters">
        <h2>Multi-Year Plan</h2>
        {error && <p className="error-message">{error}</p>}
        {years.map((year) => (
          <div className="year-container" key={year}>
            <div className="year-header-controls">
                <h3 className="year-header">{yearMap[year]}</h3>
                {!initialYears.includes(year) && (
                  <button className="remove-year-button" onClick={() => removeYear(year)} title={`Remove ${yearMap[year]}`}> × </button>
                )}
            </div>

            {/* Render Semesters for the Year  */}
            {["Fall", "Winter", "Spring", "Summer"].map(season => {
              const semesterKey = year + season;
              const isOptional = season === "Winter" || season === "Summer";
              const isVisible = isOptional ? (season === "Winter" ? winterVisible[year] : summerVisible[year]) : true;
              const toggleFunc = isOptional ? (season === "Winter" ? toggleWinter : toggleSummer) : null;
              const currentVisibility = isOptional ? (season === "Winter" ? winterVisible[year] : summerVisible[year]) : true;

              return (
                <React.Fragment key={semesterKey}>
                  {/* Toggle Bar */}
                  {isOptional && (
                    <div className="horizontal-line-container" onClick={() => toggleFunc(year)} title={currentVisibility ? `Hide ${season}` : `Show ${season}`} role="button" tabIndex={0} aria-expanded={currentVisibility}>
                      <div className="plus-circle" aria-hidden="true">{currentVisibility ? "–" : "+"}</div>
                    </div>
                  )}

                  {/* Semester Box */}
                  {isVisible && (
                    <div
                      className="semester-box"
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, semesterKey)} // handleDrop now uses full data from allCourses
                      aria-label={`${yearMap[year]} ${season} Semester Drop Zone`}
                    >
                      <div className="semester-title-container">
                        <div className="semester-title">{season}</div>
                        <div className="question-mark-container" title={getRecommendedCredits(semesterKey)}>
                          <span className="question-mark" aria-hidden="true">?</span>
                        </div>
                      </div>
                      <div className="courses" role="list" aria-label={`Courses in ${yearMap[year]} ${season}`}>
                        {(semesters[semesterKey] || []).map((course) => {
                          const itemKey = `${semesterKey}-${course.course_id}`;
                          const isExpanded = expandedCourses.has(itemKey);
                          const conflictMessage = course.conflict; // Get conflict message

                          return (
                            <div
                              key={itemKey}
                              className={`course-box ${conflictMessage ? "conflict" : ""} ${isExpanded ? "expanded" : ""}`}
                              draggable
                              onDragStart={(evt) => handleDragStart(evt, course, semesterKey)} // handleDragStart updated
                              title={conflictMessage || `${course.catalog_name}: ${course.course_name} - Click to expand/collapse`} // Combined tooltip
                              role="listitem"
                            >
                              <div className="course-box-header">
                                <button
                                  className="expand-toggle-btn"
                                  onClick={() => toggleCourseExpansion(itemKey)}
                                  title={isExpanded ? "Collapse Details" : "Expand Details"}
                                  aria-expanded={isExpanded}
                                  aria-controls={`details-${itemKey}`}
                                >
                                  {isExpanded ? "▼" : "▶"}
                                </button>
                                <strong className="course-box-title">{course.catalog_name}</strong>
                                <button
                                  className="remove-btn"
                                  onClick={() => removeCourse(semesterKey, course)}
                                  title={`Remove ${course.catalog_name}`}
                                  aria-label={`Remove ${course.catalog_name}`}
                                >
                                  ✖
                                </button>
                              </div>
                              {/* --- UPDATED EXPANDED DETAILS --- */}
                              {isExpanded && (
                                <div className="course-box-details" id={`details-${itemKey}`}>
                                  <p><strong>Name:</strong> {course.course_name || 'N/A'}</p>
                                  <p><strong>Credits:</strong> {course.course_credits ?? 'N/A'}</p>
                                  {course.category && <p><strong>Category:</strong> {course.category}</p>}
                                  {course.course_desc && <p><strong>Description:</strong> {course.course_desc}</p>}
                                  {/* NEW: Display Attributes */}
                                  {course.course_attributes && course.course_attributes.length > 0 && (
                                    <p><strong>Attributes:</strong> {course.course_attributes.join(', ')}</p>
                                  )}
                                  {/* Display Attribute Values */}
                                  {course.attribute_values && course.attribute_values.length > 0 && (
                                    <p><strong>Attribute Values:</strong> {course.attribute_values.join(', ')}</p>
                                  )}
                                   {/* Display Prerequisites Statement if available */}
                                  {course.prerequisite_stmt && <p><strong>Prerequisites:</strong> {course.prerequisite_stmt}</p>}
                                  {/* Display Conflict */}
                                  {conflictMessage && <p className="conflict-detail"><strong>Conflict:</strong> {conflictMessage}</p>}
                                </div>
                              )}
                              {/* --- END UPDATED EXPANDED DETAILS --- */}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div> // End year-container
        ))}

        {/* Add Year Button */}
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