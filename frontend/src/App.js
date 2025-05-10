import React, { useState, useEffect, useCallback, useMemo } from "react";
import "./App.css";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const API_BASE_URL = "http://localhost:5000";

// Start with the initial 4 base years
const initialYears = ["Year1", "Year2", "Year3", "Year4"];

function getSemesterCreditLimits(semesterKey) {
  const lower = semesterKey.toLowerCase();
  if (lower.includes("winter")) {
    return { min: 0, max: 4.5, type: 'max', recText: "Up to 4.5 credits" };
  }
  if (lower.includes("summer")) {
    return { min: 0, max: 16, type: 'max', recText: "Up to 16 credits" };
  }
  // Default to Fall/Spring
  return { min: 12, max: 19, type: 'range', recText: "12-19 credits" };
}

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
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  const plannerRef = React.useRef(); // For printing PDF

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  // Derived state/maps
  const yearMap = years.reduce((acc, year) => {
    acc[year] = "Year " + year.substring(4);
    return acc;
  }, {});

  // Define this object BEFORE your `degreeRequirements` constant
const commonUniversityAndGepRequirements = {
  universityGraduationRequirements: {
    title: "University Graduation Requirements",
    notes: [
      "Minimum 120 academic credits must be completed (institutional credits do not count towards this total).",
      "The final 30 credits for the degree must be earned in residence at UMBC.",
      "A minimum cumulative Grade Point Average (GPA) of 2.00 is required.",
      "A total of 45 upper-level credits (courses numbered 300 or 400) must be completed.",
      "A major in an academic discipline must be successfully completed.",
      "Completion of two (2) different Physical Education (PE) activity courses (unless exempt due to age or veteran status).",
      "Completion of one (1) approved Writing Intensive (WI) designated course."
    ]
  },
  gepRequirementsOverview: {
      title: "General Education Program (GEP) Overview",
      notes: [
        "All courses applied to General Education Program (GEP) requirements must be completed with a grade of 'C' or better.",
        "A single course may not be used to fulfill more than one GEP requirement (e.g., a course cannot count as both an Arts/Humanities and a Social Science).",
        "A maximum of two courses from the same academic discipline may be used to satisfy the Arts/Humanities GEP requirement.",
        "A maximum of two courses from the same academic discipline may be used to satisfy the Social Sciences GEP requirement.",
        "Across all GEP requirements (excluding English Composition), a student may use up to three courses from the same academic discipline.",
        "Advanced Placement (AP), International Baccalaureate (IB), and College-Level Examination Program (CLEP) credits may be applicable towards GEP requirements, subject to UMBC's credit policies.",
        "Only one First-Year Seminar (FYS) course may be counted towards fulfilling GEP requirements."
      ]
  },
  englishCompositionGEP: {
    title: "English Composition (GEP)",
    description: "Complete English 100 (ENGL 100) or an approved equivalent (typically 1 course)."
    // You could add `courses: ["ENGL 100 - Composition (3)"]` if you want to list it like other requirements
  },
  artsHumanitiesGEP: {
    title: "Arts & Humanities (AH - GEP)",
    description: "Complete three (3) approved Arts & Humanities (AH) designated courses. These courses must originate from at least two (2) different academic disciplines."
  },
  socialSciencesGEP: {
    title: "Social Sciences (SS - GEP)",
    description: "Complete three (3) approved Social Sciences (SS) designated courses. These courses must originate from at least two (2) different academic disciplines."
  },
  mathematicsGEP: {
    title: "Mathematics (M - GEP)",
    description: "Complete one (1) approved Mathematics (M) or Statistics designated course."
  },
  sciencesGEP: {
    title: "Sciences (S/SL - GEP)",
    description: "Complete two (2) approved Science designated courses. At least one of these science courses must include a laboratory component (designated SL)."
  },
  cultureGEP: {
    title: "Culture (C - GEP)",
    description: "Requirement varies by degree type: \n - Bachelor of Arts (B.A.) students: Complete two (2) 'C' designated courses. \n - Bachelor of Science (B.S.) / Bachelor of Science in Engineering (B.S.E.) students: Complete one (1) 'C' designated course."
  },
  foreignLanguageGEP: {
    title: "Foreign Language (FL - GEP)",
    description: "Demonstrate proficiency in a foreign language through the 201-level (e.g., SPAN 201). Proficiency can be demonstrated by course completion, placement testing, or other approved equivalents."
  }
};

  // Static Data (Degree Requirements)
  const degreeRequirements = {
    "Computer Science": {
      ...commonUniversityAndGepRequirements,
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
        ...commonUniversityAndGepRequirements,
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
        ...commonUniversityAndGepRequirements,
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
      (result.missing_prerequisites || []).forEach(conflict => {
        const courseDetails = allCourses.find(c => c.course_id === conflict.course_id);

        let hasNoActualPrerequisites = false;
        if (courseDetails) {
            const stmt = courseDetails.prerequisite_stmt;
            hasNoActualPrerequisites =
                !stmt ||
                stmt.trim().toLowerCase() === "n/a" ||
                stmt.trim().toLowerCase() === "none";
        }

        if (!hasNoActualPrerequisites) {
            conflictsMap.set(conflict.course_id, conflict.message);
        } else {
            console.log(`Ignoring backend-reported conflict for course ${conflict.course_id} as its prerequisite_stmt ("${courseDetails?.prerequisite_stmt}") indicates no actual prerequisites.`);
        }
      });

      const updatedSemestersWithConflicts = { ...currentSemestersData };

      Object.keys(updatedSemestersWithConflicts).forEach(semesterKey => {
        if (!updatedSemestersWithConflicts[semesterKey]) {
            updatedSemestersWithConflicts[semesterKey] = [];
        }
        updatedSemestersWithConflicts[semesterKey] = updatedSemestersWithConflicts[semesterKey].map(course => {
          const conflictMessage = conflictsMap.get(course.course_id);
          return { ...course, conflict: conflictMessage || null };
        });
      });

      console.log("Final state before setting:", updatedSemestersWithConflicts);
      setSemesters(updatedSemestersWithConflicts);

    } catch (error) {
      console.error("Failed to check prerequisites:", error);
      setError(`Prerequisite check failed: ${error.message}. Check backend connection.`);
    }
  }, [years, setError, allCourses]);

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
        const sanitizedData = data.map(course => ({
          course_id: course.course_id ?? `missing_id_${Math.random()}`,
          catalog_name: course.catalog_name ?? 'Unknown ID',
          course_name: course.course_name ?? 'Unnamed Course',
          category: course.category ?? null,
          course_num: course.course_num ?? null,
          course_desc: course.course_desc ?? '',
          course_credits: course.course_credits ?? 0,
          prerequisite_stmt: course.prerequisite_stmt ?? '',
          course_attributes: course.course_attributes ?? [],
          attribute_values: course.attribute_values ?? [],
          availability: course.availability ?? null,
          ...course
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
  }, []);

  // Drag & Drop Handlers
  const handleDragStart = (event, course, fromSemester = null) => {
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
    event.preventDefault();
  };

  const toggleIgnorePrereqs = (semesterKey, courseId) => {
    setSemesters(currentSemesters => {
      const updatedSemesters = JSON.parse(JSON.stringify(currentSemesters));
      if (!updatedSemesters[semesterKey]) {
        console.warn(`Semester ${semesterKey} not found while toggling ignore flag.`);
        return currentSemesters;
      }
      let courseFound = false;
      updatedSemesters[semesterKey] = updatedSemesters[semesterKey].map(course => {
        if (course.course_id === courseId) {
          courseFound = true;
          return {
            ...course,
            ignorePrereqs: !course.ignorePrereqs
          };
        }
        return course;
      });
      if (!courseFound) {
          console.warn(`Course ID ${courseId} not found in semester ${semesterKey} while toggling ignore flag.`);
      }
      // No need to call checkPrerequisitesWithAPI here as this is a UI-only state for display
      return updatedSemesters;
    });
  };

  const handleDrop = (event, targetSemester) => {
    event.preventDefault();
    const transferData = JSON.parse(event.dataTransfer.getData("text/plain"));
    const { course, fromSemester } = transferData;
    const uniqueId = course.course_id;

    if (fromSemester === targetSemester) return;

    let nextState = JSON.parse(JSON.stringify(semesters));

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

    if (!nextState[targetSemester]) {
      nextState[targetSemester] = [];
    }
    const exists = nextState[targetSemester].some((c) => c.course_id === uniqueId);

    if (!exists) {
      const fullCourseData = allCourses.find((c) => c.course_id === uniqueId) || course;
      nextState[targetSemester].push({
          ...fullCourseData,
          conflict: null,
          ignorePrereqs: false
      });
    } else {
      console.warn(`Course ${uniqueId} already exists in ${targetSemester}`);
    }
    checkPrerequisitesWithAPI(nextState);
  };

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

  const uniqueCategories = useMemo(() => [
    ...new Set(allCourses.map((c) => c.category).filter(Boolean)),
  ].sort(), [allCourses]);

  const uniqueCredits = useMemo(() => [
    ...new Set(allCourses.map((c) => c.course_credits).filter((v) => v !== null && v !== undefined)),
  ].sort((a, b) => a - b), [allCourses]);

  const uniqueAttributes = useMemo(() => [
      ...new Set(allCourses.flatMap(c => c.course_attributes || []).filter(Boolean))
  ].sort(), [allCourses]);

  const uniqueAttributeValues = useMemo(() => [
      ...new Set(allCourses.flatMap(c => c.attribute_values || []).filter(Boolean))
  ].sort(), [allCourses]);

  const filteredCourses = allCourses.filter((course) => {
    const categoryMatch = categoryFilter === "" || (course.category && course.category === categoryFilter);
    const creditsMatch = creditsFilter === "" || (course.course_credits !== null && course.course_credits === Number(creditsFilter));
    const courseNumberMatch = courseNumberFilter === "" || (course.course_num && course.course_num.toString().startsWith(courseNumberFilter));
    const searchTermMatch =
      searchTerm.trim() === "" ||
      (course.course_name && course.course_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (course.catalog_name && course.catalog_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const semesterMatch = (() => {
        if (semesterFilter === "") return true;
        if (!course.availability) return false;
        switch (semesterFilter) {
            case "Fall": return course.availability.fall_availability > 0;
            case "Winter": return course.availability.winter_availability > 0;
            case "Spring": return course.availability.spring_availability > 0;
            case "Summer": return course.availability.summer_availability > 0;
            default: return true;
        }
    })();

    const attributeMatch = attributeFilter === "" || (course.course_attributes && course.course_attributes.includes(attributeFilter));
    const attributeValueMatch = attributeValueFilter === "" || (course.attribute_values && course.attribute_values.includes(attributeValueFilter));

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

  const toggleOptionalSemester = (year, season, isVisibleState, setVisibleState, checkPrerequisites) => {
     setVisibleState((prev) => {
      const semesterKey = year + season;
      const newVisibility = !prev[year];

      if (!newVisibility) {
        setExpandedCourses(currentExpanded => {
           const nextExpanded = new Set(currentExpanded);
           (semesters[semesterKey] || []).forEach(course => {
               nextExpanded.delete(`${semesterKey}-${course.course_id}`);
           });
           return nextExpanded;
        });

        let nextState = JSON.parse(JSON.stringify(semesters));
        nextState[semesterKey] = [];
        checkPrerequisites(nextState);
      }
      return { ...prev, [year]: newVisibility };
    });
  };

  const toggleWinter = (year) => toggleOptionalSemester(year, "Winter", winterVisible, setWinterVisible, checkPrerequisitesWithAPI);
  const toggleSummer = (year) => toggleOptionalSemester(year, "Summer", summerVisible, setSummerVisible, checkPrerequisitesWithAPI);

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

const handleDownloadPDF = () => {
  const input = plannerRef.current;
  if (!input) return;

  const originalScrollY = window.scrollY;
  const originalHeight = input.style.height;
  const originalOverflow = input.style.overflow;
  const originalTheme = document.documentElement.getAttribute("data-theme");

  // Force light mode for export
  document.documentElement.setAttribute("data-theme", "light");

  input.style.height = input.scrollHeight + "px";
  input.style.overflow = "visible";

  setTimeout(() => {
    html2canvas(input, { scale: 2, useCORS: true }).then((canvas) => {
      // Restore theme and styles
      document.documentElement.setAttribute("data-theme", originalTheme || "");
      input.style.height = originalHeight;
      input.style.overflow = originalOverflow;
      window.scrollTo(0, originalScrollY);

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position -= pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save("my-planned-courses.pdf");
    });
  }, 500);
};

  const totalPlanCredits = useMemo(() => {
    return Object.values(semesters)
      .flat()
      .reduce((total, course) => total + (Number(course.course_credits) || 0), 0);
  }, [semesters]);


  // --- RENDER ---
  return (
  <>
  <header className="site-header">
  <div className="header-content-left">
    <img src="/umbc-logo.png" alt="UMBC Logo" className="header-logo" />
    <h1 className="planner-title">UMBC Degree Planner</h1>
  </div>
  <div className="settings-menu">
    <button className="settings-button" title="Settings">Settings▾</button>
    <div className="settings-dropdown">
      <input
        type="file"
        accept=".json"
        id="topbar-import-input"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (event) => {
            try {
              const parsed = JSON.parse(event.target.result);
            if (parsed.semesters && parsed.years) {
              setSemesters(parsed.semesters);
              setYears(parsed.years);

              const newWinterVisibility = {};
              const newSummerVisibility = {};

              (parsed.years || initialYears).forEach((year) => { // Use initialYears as fallback
                const hasWinter = parsed.semesters[`${year}Winter`]?.length > 0;
                const hasSummer = parsed.semesters[`${year}Summer`]?.length > 0;
                newWinterVisibility[year] = hasWinter;
                newSummerVisibility[year] = hasSummer;
              });

              setWinterVisible(newWinterVisibility);
              setSummerVisible(newSummerVisibility);

              // Check prerequisites after import
              checkPrerequisitesWithAPI(parsed.semesters);

            } else {
              alert("Invalid plan file format.");
            }
            } catch (err) {
              alert("Failed to import plan. Make sure it's a valid JSON file.");
              console.error("Import error:", err);
            }
          };
          reader.readAsText(file);
          e.target.value = "";
        }}
      />
      <button onClick={() => document.getElementById("topbar-import-input").click()}>
        Import Plan
      </button>
      <button
        onClick={() => {
          const planData = { semesters, years };
          const blob = new Blob([JSON.stringify(planData, null, 2)], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = "my-4year-plan.json";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }}
      >
        Export Plan
      </button>
      <button onClick={handleDownloadPDF}>
        Download Plan PDF
      </button>
      <button
          onClick={() => setDarkMode(prev => !prev)}
        >
          {darkMode ? "Light Mode" : "Dark Mode"}
      </button>
    </div>
  </div>
      </header>

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
                            {category.description && <p>{category.description.split('\n').map((line, i) => <React.Fragment key={i}>{line}<br/></React.Fragment>)}</p>}
                            {category.notes && Array.isArray(category.notes) && (
                              <ul>
                               {category.notes.map((note, idx) => <li key={`${categoryKey}-note-${idx}`}>{note}</li>)}
                              </ul>
                            )}
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
          <div className="filters">
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
            </select>
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
          </div>
          <div className="search-results">
            {loading && <p>Loading courses...</p>}
            {error && !loading && <p className="error-message">{error}</p>}
            {!loading && !error && anyFilterApplied() && filteredCourses.length > 0 &&
              filteredCourses.map((course) => (
                <div
                  key={course.course_id}
                  className="result-item"
                  draggable
                  onDragStart={(e) => handleDragStart(e, course)}
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

      <div className="semesters" ref={plannerRef}>
        <div className="semesters-main-header">
            <h2>Multi-Year Plan</h2>
            {(() => {
                let totalCreditsWarningMessage = "";
                if (totalPlanCredits > 0 && totalPlanCredits < 120) {
                    totalCreditsWarningMessage = `Overall total credits (${totalPlanCredits}) are below the typical minimum of 120 for graduation.`;
                }
                const totalCreditsTitle = totalCreditsWarningMessage || `Overall Total: ${totalPlanCredits} Cr. (Aim for 120+ for graduation).`;

                return (
                    <div
                        className={`total-plan-credits-display ${totalCreditsWarningMessage ? 'credit-warning' : ''}`}
                        title={totalCreditsTitle}
                    >
                        Overall Total: {totalPlanCredits} Cr
                    </div>
                );
            })()}
        </div>

        {error && <p className="error-message">{error}</p>}
            {years.map((year) => {
                let yearMinRecommended = 0;
                let yearMaxRecommended = 0;
                let yearActiveSemestersRecTextParts = [];

                ["Fall", "Winter", "Spring", "Summer"].forEach(season => {
                    const semesterKey = year + season;
                    const isOptional = season === "Winter" || season === "Summer";
                    const isSemesterVisible = isOptional
                      ? (season === "Winter" ? winterVisible[year] : summerVisible[year])
                      : true;

                    if (isSemesterVisible) {
                        const limits = getSemesterCreditLimits(semesterKey);
                        yearMinRecommended += limits.min;
                        yearMaxRecommended += limits.type === 'range' ? limits.max : limits.max; // For 'max' type, min is 0, so max is the upper bound
                        yearActiveSemestersRecTextParts.push(`${season}: ${limits.recText}`);
                    }
                });

                const yearTotalCredits = ["Fall", "Winter", "Spring", "Summer"].reduce((acc, season) => {
                    const semesterKey = year + season;
                    const isOptional = season === "Winter" || season === "Summer";
                    const isSemesterVisible = isOptional
                      ? (season === "Winter" ? winterVisible[year] : summerVisible[year])
                      : true;

                    if (isSemesterVisible && semesters[semesterKey]) {
                      const semesterCredits = (semesters[semesterKey] || []).reduce(
                        (sAcc, course) => sAcc + (Number(course.course_credits) || 0), 0
                      );
                      return acc + semesterCredits;
                    }
                    return acc;
                  }, 0);

                let yearCreditWarningMessage = "";
                if (yearTotalCredits > 0) {
                    if (yearTotalCredits < yearMinRecommended) {
                        yearCreditWarningMessage = `Year total (${yearTotalCredits} Cr) is below the recommended minimum of ${yearMinRecommended} Cr for active semesters.`;
                    } else if (yearTotalCredits > yearMaxRecommended) {
                        yearCreditWarningMessage = `Year total (${yearTotalCredits} Cr) exceeds the recommended maximum of ${yearMaxRecommended} Cr for active semesters.`;
                    }
                }
                const yearRecommendedRangeText = `Recommended for active semesters: ${yearMinRecommended}-${yearMaxRecommended} Cr. (${yearActiveSemestersRecTextParts.join(', ')})`;
                const yearCreditsTitle = yearCreditWarningMessage
                    ? `${yearCreditWarningMessage} (${yearRecommendedRangeText})`
                    : (yearTotalCredits > 0
                        ? `Year Total: ${yearTotalCredits} Cr. ${yearRecommendedRangeText}`
                        : `No courses in ${yearMap[year]}. ${yearRecommendedRangeText}`);


                return (
                  <div className="year-container" key={year}>
                    <div className="year-header-controls">
                        <div className="year-header-left">
                            <h3 className="year-header">{yearMap[year]}</h3>
                        </div>
                        <div className="year-header-right">
                            <div
                                className={`year-credits-display ${yearCreditWarningMessage ? 'credit-warning' : ''}`}
                                title={yearCreditsTitle}
                            >
                                Total: {yearTotalCredits} Cr
                            </div>
                            {!initialYears.includes(year) && (
                            <button className="remove-year-button" onClick={() => removeYear(year)} title={`Remove ${yearMap[year]}`}> × </button>
                            )}
                        </div>
                    </div>

                    {["Fall", "Winter", "Spring", "Summer"].map(season => {
                      const semesterKey = year + season;
                      const isOptional = season === "Winter" || season === "Summer";
                      const isVisible = isOptional ? (season === "Winter" ? winterVisible[year] : summerVisible[year]) : true;
                      const toggleFunc = isOptional ? (season === "Winter" ? () => toggleWinter(year) : () => toggleSummer(year)) : null;
                      const currentVisibility = isOptional ? (season === "Winter" ? winterVisible[year] : summerVisible[year]) : true;

                      const semesterCourses = semesters[semesterKey] || [];
                      const semesterTotalCredits = semesterCourses.reduce((acc, course) => acc + (Number(course.course_credits) || 0), 0);

                      const creditLimits = getSemesterCreditLimits(semesterKey);
                      let creditWarningMessage = "";

                      if (semesterTotalCredits > 0) {
                        if (creditLimits.type === 'range') {
                          if (semesterTotalCredits < creditLimits.min) {
                            creditWarningMessage = `Credits (${semesterTotalCredits}) are below recommended minimum of ${creditLimits.min}.`;
                          } else if (semesterTotalCredits > creditLimits.max) {
                            creditWarningMessage = `Credits (${semesterTotalCredits}) exceed recommended maximum of ${creditLimits.max}.`;
                          }
                        } else if (creditLimits.type === 'max') {
                          if (semesterTotalCredits > creditLimits.max) {
                            creditWarningMessage = `Credits (${semesterTotalCredits}) exceed recommended maximum of ${creditLimits.max}.`;
                          }
                        }
                        if (creditWarningMessage) {
                            creditWarningMessage += ` (Recommended: ${creditLimits.recText})`;
                        }
                      }

                      const semesterCreditsTitle = creditWarningMessage ||
                        (semesterTotalCredits > 0
                            ? `Total: ${semesterTotalCredits} Cr. Recommended: ${creditLimits.recText}.`
                            : `No courses in ${season}. Recommended: ${creditLimits.recText}.`);

                      return (
                        <React.Fragment key={semesterKey}>
                          {isOptional && (
                            <div className="horizontal-line-container" onClick={() => toggleFunc(year)} title={currentVisibility ? `Hide ${season}` : `Show ${season}`} role="button" tabIndex={0} aria-expanded={currentVisibility}>
                              <div className="plus-circle" aria-hidden="true">{currentVisibility ? "–" : "+"}</div>
                            </div>
                          )}

                          {isVisible && (
                            <div
                              className="semester-box"
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleDrop(e, semesterKey)}
                              aria-label={`${yearMap[year]} ${season} Semester Drop Zone`}
                            >
                              <div className="semester-title-container">
                                <div className="semester-title">{season}</div>
                                <div className="semester-header-right-items">
                                  <div
                                    className={`semester-credits-display ${creditWarningMessage ? 'credit-warning' : ''}`}
                                    title={semesterCreditsTitle}
                                  >
                                    {semesterTotalCredits} Cr
                                  </div>
                                  {/* REMOVED QUESTION MARK ICON
                                  <div className="question-mark-container" title={getRecommendedCredits(semesterKey)}>
                                    <span className="question-mark" aria-hidden="true">?</span>
                                  </div>
                                  */}
                                </div>
                              </div>
                              <div className="courses" role="list" aria-label={`Courses in ${yearMap[year]} ${season}`}>
                                {/* ... (course mapping and rendering logic remains the same) ... */}
                                {semesterCourses.map((course) => {
                                  const itemKey = `${semesterKey}-${course.course_id}`;
                                  const isExpanded = expandedCourses.has(itemKey);
                                  const conflictMessage = course.conflict;
                                  const isIgnored = course.ignorePrereqs === true;
                                  const showConflictStyle = conflictMessage && !isIgnored;

                                  return (
                                    <div
                                      key={itemKey}
                                      className={`course-box ${showConflictStyle ? "conflict" : ""} ${isExpanded ? "expanded" : ""} ${isIgnored ? "ignored-indicator" : ""}`}
                                      draggable
                                      onDragStart={(evt) => handleDragStart(evt, course, semesterKey)}
                                      title={
                                        isIgnored
                                        ? `${course.catalog_name}: Prerequisite check ignored by user. ${conflictMessage ? `(Original conflict: ${conflictMessage})` : ''}`
                                        : conflictMessage
                                        ? `Conflict: ${conflictMessage}`
                                        : `${course.catalog_name}: ${course.course_name} - Click to expand/collapse`
                                      }
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
                                      {isExpanded && (
                                        <div className="course-box-details" id={`details-${itemKey}`}>
                                          <div className="details-main-content">
                                            <p><strong>Name:</strong> {course.course_name}</p>
                                            <p><strong>Credits:</strong> {course.course_credits ?? 'N/A'}</p>
                                            {course.category && <p><strong>Category:</strong> {course.category}</p>}
                                            {course.course_desc && <p><strong>Description:</strong> {course.course_desc}</p>}
                                            {course.prerequisite_stmt && <p><strong>Prerequisites (Stated):</strong> {course.prerequisite_stmt}</p>}


                                            {conflictMessage && !isIgnored && (
                                              <p className="conflict-detail"><strong>Conflict:</strong> {conflictMessage}</p>
                                            )}
                                            {conflictMessage && isIgnored && (
                                              <p className="ignored-conflict-detail">
                                                <strong>Conflict Ignored:</strong> <span className="original-conflict-text">{conflictMessage}</span>
                                              </p>
                                            )}
                                          </div>

                                          <div className="details-actions">
                                            <button
                                              className={`ignore-prereq-btn ${isIgnored ? 'active' : ''}`}
                                              onClick={() => toggleIgnorePrereqs(semesterKey, course.course_id)}
                                              title={isIgnored ? "Re-enable prerequisite checking for this course" : "Ignore prerequisites for this course"}
                                            >
                                              {isIgnored ? "Undo Ignore" : "Ignore"}
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                );
            })}

            <div className="add-year-container">
              <button className="add-year-button" onClick={addYear}>
                + Add Another Year
              </button>
            </div>
          </div>
      </div>
      <footer className="site-footer">
        <a
          href="https://docs.google.com/forms/d/e/1FAIpQLSdT-G6yJmAvB1LkSB3STqOaK8jnKZZ0IVU47R5F-jEcYWBV9A/viewform?usp=dialog"
          target="_blank"
          rel="noopener noreferrer"
          className="feedback-button"
        >
          Feedback
        </a>
      </footer>
    </>
  );
}

export default App;