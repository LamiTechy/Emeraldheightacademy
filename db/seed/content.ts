import type { courseCategoryEnum, courseModeEnum, difficultyEnum, questionTypeEnum } from "../schema";

export const CURRENT_YEAR = new Date().getFullYear();

export const DEFAULT_PASSWORDS = {
  admin: "Admin@1234",
  tutor: "Tutor@1234",
  student: "Student@1234",
} as const;

export const ADMIN = {
  name: "Samuel Adeyemi (EHA)",
  email: "admin@emeraldheightacademy.com",
  phone: "+2348030000001",
  title: "Founder & Super Admin",
};

export const TUTORS = [
  {
    name: "Adebayo Ogundele",
    email: "tutor.adebayo@emeraldheightacademy.com",
    phone: "+2348030000011",
    bio: "JAMB mathematics and physics specialist with 12 years of exam-prep experience. Known for turning weak topics into sure points.",
    qualifications: "B.Sc. Mathematics (UNILAG), M.Ed. Assessment",
    specialties: ["JAMB Maths", "JAMB Physics", "Further Maths"],
  },
  {
    name: "Chidinma Okafor",
    email: "tutor.chidinma@emeraldheightacademy.com",
    phone: "+2348030000012",
    bio: "English language and literature tutor. Focused on comprehension, grammar accuracy and essay structure for WAEC/NECO/JAMB.",
    qualifications: "B.A. English (UNN), PGDE",
    specialties: ["English Language", "Comprehension", "Essay Writing"],
  },
  {
    name: "Yusuf Bello",
    email: "tutor.yusuf@emeraldheightacademy.com",
    phone: "+2348030000013",
    bio: "Primary school enrichment tutor. Builds strong foundations in mental maths, times tables and early English.",
    qualifications: "NCE Elementary Education",
    specialties: ["Primary Maths", "Primary English", "Phonics"],
  },
] as const;

export const STUDENT_NAMES = [
  "Aisha Bello",
  "Tunde Adeleke",
  "Ngozi Eze",
  "Ibrahim Sani",
  "Folake Adeniyi",
  "Emeka Nwachukwu",
  "Amina Yakubu",
  "Segun Ogunleye",
  "Blessing Uche",
  "Musa Danjuma",
  "Chiamaka Obi",
  "Kelechi Anyanwu",
  "Zainab Lawal",
  "Oluwaseun Ajayi",
  "Halima Abubakar",
  "Chidi Okonkwo",
  "Fatima Bello",
  "Tobi Alabi",
  "Amara Nnadi",
  "Sadiq Aliyu",
  "Grace Uduak",
  "Damilola Bakare",
  "Peter Gyang",
  "Maryam Idris",
  "Ifeanyi Obiora",
] as const;

export const COURSES = [
  {
    key: "jamb",
    code: "JAMB-PREP",
    name: "JAMB/UTME Preparation",
    slug: "jamb-prep",
    category: "exam_prep" as (typeof courseCategoryEnum.enumValues)[number],
    description:
      "Intensive UTME preparation covering Mathematics, English, Physics and use-of-English skills with weekly CBT practice.",
    longDescription:
      "A 12-week programme that takes candidates from syllabus coverage to exam readiness. Every week combines topic drills, past-question work and timed computer-based tests. Students leave with a personal weak-topic plan and full mock-exam experience.",
    durationWeeks: 12,
    scheduleSummary: "Morning & evening weekday batches, plus Saturday revision",
    mode: "hybrid" as (typeof courseModeEnum.enumValues)[number],
    syllabus: [
      "Algebra & equations",
      "Functions & graphs",
      "Geometry & mensuration",
      "Statistics & probability",
      "Use of English: comprehension",
      "Use of English: lexis & structure",
      "Physics: mechanics",
      "Physics: waves & electricity",
      "CBT strategy & time management",
      "Full mock exams",
    ],
    featured: true,
    sortOrder: 1,
  },
  {
    key: "waec",
    code: "WAEC-NECO",
    name: "WAEC & NECO Preparation",
    slug: "waec-neco-prep",
    category: "exam_prep" as (typeof courseCategoryEnum.enumValues)[number],
    description:
      "Complete preparation for WAEC and NECO with subject combinations, past questions and continuous assessment practice.",
    longDescription:
      "Designed for candidates aiming for five credits including English and Mathematics. Covers core subjects with emphasis on question patterns, practicals guidance and answer-writing technique for theory papers.",
    durationWeeks: 16,
    scheduleSummary: "Weekend batch (Saturdays), intensive revision on Sundays before exams",
    mode: "hybrid" as (typeof courseModeEnum.enumValues)[number],
    syllabus: [
      "English: grammar & usage",
      "English: comprehension & summary",
      "Mathematics: number bases",
      "Mathematics: geometry & trigonometry",
      "Biology: cell & systems",
      "Chemistry fundamentals",
      "E-commerce / Data processing basics",
      "Past questions drills (10 years)",
      "Theory answer structure",
    ],
    featured: true,
    sortOrder: 2,
  },
  {
    key: "primary",
    code: "PRIM-EXC",
    name: "Primary Excellence (Maths & English)",
    slug: "primary-excellence",
    category: "primary" as (typeof courseCategoryEnum.enumValues)[number],
    description:
      "After-school enrichment for primary pupils: mental maths, times tables, reading fluency and creative writing.",
    longDescription:
      "Small classes that rebuild confidence in core subjects. Pupils work through graded workbooks with weekly feedback for parents, phonics support for readers, and enrichment challenges for advanced pupils.",
    durationWeeks: 20,
    scheduleSummary: "Weekday afternoons (Mon–Thu), two parallel batches",
    mode: "physical" as (typeof courseModeEnum.enumValues)[number],
    syllabus: [
      "Number work & place value",
      "Fractions, decimals & percentages",
      "Mental maths drills",
      "Reading comprehension",
      "Grammar & tenses",
      "Creative writing",
      "Spelling & phonics",
      "Revision & test prep",
    ],
    featured: true,
    sortOrder: 3,
  },
  {
    key: "postutme",
    code: "PUTME-PREP",
    name: "Post-UTME Screening Prep",
    slug: "post-utme-prep",
    category: "exam_prep" as (typeof courseCategoryEnum.enumValues)[number],
    description:
      "Targeted preparation for university Post-UTME screening tests with departmental past questions, oral practice and timed CBT drills.",
    longDescription:
      "A 6-week sprint for candidates who already sat UTME. We drill departmental past questions, general papers and screening-format CBTs, plus mock screening sessions so nothing on test day is a surprise.",
    durationWeeks: 6,
    scheduleSummary: "Evening weekday classes (Tue & Thu), Saturday mock screening tests",
    mode: "hybrid" as (typeof courseModeEnum.enumValues)[number],
    syllabus: [
      "Departmental past questions (5 years)",
      "Use of English: screening format",
      "Quantitative reasoning drills",
      "Current affairs & general paper",
      "Oral / interview technique",
      "Timed CBT screening simulations",
      "Mock Post-UTME exams",
    ],
    featured: true,
    sortOrder: 4,
  },
  {
    key: "jupeb",
    code: "JUPEB-PREP",
    name: "JUPEB Programme",
    slug: "jupeb-prep",
    category: "university" as (typeof courseCategoryEnum.enumValues)[number],
    description:
      "Full JUPEB A-level programme offering three to four subject combinations with continuous assessment for direct entry into 200 level.",
    longDescription:
      "A one-year A-level programme that prepares candidates for JUPEB examinations and direct entry admission into 200 level. Lectures run with university-style coursework, weekly tests and a strong emphasis on essay and practical work.",
    durationWeeks: 32,
    scheduleSummary: "Weekday morning lectures (Mon–Fri), Saturday practicals & tutorials",
    mode: "hybrid" as (typeof courseModeEnum.enumValues)[number],
    syllabus: [
      "Use of English (General Paper)",
      "Biology: theory & practicals",
      "Chemistry: theory & practicals",
      "Physics: theory & practicals",
      "Mathematics",
      "Economics",
      "Literature-in-English",
      "Continuous assessment & mock exams",
    ],
    featured: true,
    sortOrder: 5,
  },
] as const;

export const BATCHES = [
  {
    key: "jamb-morning",
    courseKey: "jamb",
    name: "JAMB Morning Batch",
    code: "JAMB-MOR",
    daysOfWeek: [1, 3, 5],
    startTime: "09:00:00",
    endTime: "12:00:00",
    mode: "hybrid" as (typeof courseModeEnum.enumValues)[number],
    room: "Hall A",
    meetingUrl: null,
    capacity: 25,
  },
  {
    key: "jamb-evening",
    courseKey: "jamb",
    name: "JAMB Evening Batch",
    code: "JAMB-EVE",
    daysOfWeek: [2, 4],
    startTime: "16:00:00",
    endTime: "19:00:00",
    mode: "hybrid" as (typeof courseModeEnum.enumValues)[number],
    room: "Hall B",
    meetingUrl: null,
    capacity: 25,
  },
  {
    key: "waec-weekend",
    courseKey: "waec",
    name: "WAEC Weekend Batch",
    code: "WAEC-WKND",
    daysOfWeek: [6],
    startTime: "09:00:00",
    endTime: "13:00:00",
    mode: "hybrid" as (typeof courseModeEnum.enumValues)[number],
    room: "Hall A",
    meetingUrl: null,
    capacity: 20,
  },
  {
    key: "primary-a",
    courseKey: "primary",
    name: "Primary Afternoon A",
    code: "PRIM-A",
    daysOfWeek: [1, 3],
    startTime: "14:00:00",
    endTime: "16:00:00",
    mode: "physical" as (typeof courseModeEnum.enumValues)[number],
    room: "Class 1",
    meetingUrl: null,
    capacity: 15,
  },
  {
    key: "primary-b",
    courseKey: "primary",
    name: "Primary Afternoon B",
    code: "PRIM-B",
    daysOfWeek: [2, 4],
    startTime: "14:00:00",
    endTime: "16:00:00",
    mode: "physical" as (typeof courseModeEnum.enumValues)[number],
    room: "Class 2",
    meetingUrl: null,
    capacity: 15,
  },
] as const;

/** batch key → tutor index (lead tutor) */
export const BATCH_TUTORS: Record<string, number> = {
  "jamb-morning": 0,
  "jamb-evening": 0,
  "waec-weekend": 1,
  "primary-a": 2,
  "primary-b": 2,
};

/** batch key → 1-based student numbers with an ACTIVE enrollment */
export const BATCH_ENROLLMENTS: Record<string, number[]> = {
  "jamb-morning": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  "jamb-evening": [11, 12, 13, 14, 15],
  "waec-weekend": [18, 19, 20, 21, 22],
  "primary-a": [23, 24, 25],
  "primary-b": [21, 22],
};

export const NON_ACTIVE_ENROLLMENTS: { batchKey: string; studentNumber: number; status: "waitlisted" | "dropped" }[] = [
  { batchKey: "jamb-evening", studentNumber: 16, status: "dropped" },
  { batchKey: "jamb-evening", studentNumber: 17, status: "waitlisted" },
];

export const MATERIALS = [
  {
    courseKey: "jamb",
    title: "JAMB Mathematics Past Questions (2015–2024)",
    description: "Ten years of UTME maths questions organised by topic with answers.",
    type: "past_question" as (typeof import("../schema").materialTypeEnum.enumValues)[number],
    tags: ["maths", "past-questions", "cbt"],
  },
  {
    courseKey: "jamb",
    title: "Algebra Formula Sheet",
    description: "One-page summary of every algebra rule used in UTME.",
    type: "note" as (typeof import("../schema").materialTypeEnum.enumValues)[number],
    tags: ["algebra", "revision"],
  },
  {
    courseKey: "jamb",
    title: "How to Tackle Use of English Comprehension",
    description: "Video walkthrough of a full comprehension passage.",
    type: "video" as (typeof import("../schema").materialTypeEnum.enumValues)[number],
    tags: ["english", "video"],
  },
  {
    courseKey: "waec",
    title: "WAEC English Summary Writing Guide",
    description: "Step-by-step method for summary questions with graded samples.",
    type: "note" as (typeof import("../schema").materialTypeEnum.enumValues)[number],
    tags: ["english", "summary"],
  },
  {
    courseKey: "waec",
    title: "WAEC Biology Practical Specimens List",
    description: "Official specimens and what to revise for each.",
    type: "past_question" as (typeof import("../schema").materialTypeEnum.enumValues)[number],
    tags: ["biology", "practical"],
  },
  {
    courseKey: "waec",
    title: "10 Years WAEC Mathematics Past Questions",
    description: "Topic-sorted past questions with worked solutions.",
    type: "past_question" as (typeof import("../schema").materialTypeEnum.enumValues)[number],
    tags: ["maths", "past-questions"],
  },
  {
    courseKey: "primary",
    title: "Times Tables Drills (1–12)",
    description: "Printable drill sheets with answer keys.",
    type: "note" as (typeof import("../schema").materialTypeEnum.enumValues)[number],
    tags: ["mental-maths", "printable"],
  },
  {
    courseKey: "primary",
    title: "Phonics Sound Chart",
    description: "Chart of the 44 sounds with example words.",
    type: "note" as (typeof import("../schema").materialTypeEnum.enumValues)[number],
    tags: ["phonics", "reading"],
  },
  {
    courseKey: "primary",
    title: "Creative Writing Prompts for Primary Pupils",
    description: "50 prompts to build writing fluency at home.",
    type: "other" as (typeof import("../schema").materialTypeEnum.enumValues)[number],
    tags: ["writing"],
  },
] as const;

export type SeedQuestion = {
  courseKey: "jamb" | "waec" | "primary";
  type: (typeof questionTypeEnum.enumValues)[number];
  difficulty: (typeof difficultyEnum.enumValues)[number];
  topic: string;
  stem: string;
  options: { key: string; text: string }[];
  correctAnswer: { key?: string; value?: boolean; accepted?: string[] };
  explanation: string;
};

export const QUESTIONS: SeedQuestion[] = [
  // ── JAMB Maths ──────────────────────────────────────────────
  {
    courseKey: "jamb",
    type: "mcq",
    difficulty: "medium",
    topic: "Algebra",
    stem: "If f(x) = 3x² − 2x + 1, what is f(2)?",
    options: [
      { key: "A", text: "7" },
      { key: "B", text: "9" },
      { key: "C", text: "11" },
      { key: "D", text: "13" },
    ],
    correctAnswer: { key: "B" },
    explanation: "f(2) = 3(4) − 2(2) + 1 = 12 − 4 + 1 = 9.",
  },
  {
    courseKey: "jamb",
    type: "mcq",
    difficulty: "easy",
    topic: "Algebra",
    stem: "Solve for x: 2x + 5 = 17",
    options: [
      { key: "A", text: "x = 5" },
      { key: "B", text: "x = 6" },
      { key: "C", text: "x = 7" },
      { key: "D", text: "x = 11" },
    ],
    correctAnswer: { key: "B" },
    explanation: "2x = 12, so x = 6.",
  },
  {
    courseKey: "jamb",
    type: "mcq",
    difficulty: "easy",
    topic: "Functions & graphs",
    stem: "What is the gradient of the line y = 4x − 7?",
    options: [
      { key: "A", text: "−7" },
      { key: "B", text: "4" },
      { key: "C", text: "7" },
      { key: "D", text: "1/4" },
    ],
    correctAnswer: { key: "B" },
    explanation: "In y = mx + c, m is the gradient, so m = 4.",
  },
  {
    courseKey: "jamb",
    type: "mcq",
    difficulty: "medium",
    topic: "Algebra",
    stem: "Simplify (x² − 9)/(x − 3), x ≠ 3",
    options: [
      { key: "A", text: "x − 3" },
      { key: "B", text: "x + 3" },
      { key: "C", text: "x² + 3" },
      { key: "D", text: "1" },
    ],
    correctAnswer: { key: "B" },
    explanation: "x² − 9 = (x − 3)(x + 3); dividing by (x − 3) leaves x + 3.",
  },
  {
    courseKey: "jamb",
    type: "mcq",
    difficulty: "easy",
    topic: "Word problems",
    stem: "A train travels 180 km in 2.5 hours. What is its average speed?",
    options: [
      { key: "A", text: "60 km/h" },
      { key: "B", text: "65 km/h" },
      { key: "C", text: "72 km/h" },
      { key: "D", text: "80 km/h" },
    ],
    correctAnswer: { key: "C" },
    explanation: "Speed = 180 ÷ 2.5 = 72 km/h.",
  },
  {
    courseKey: "jamb",
    type: "mcq",
    difficulty: "medium",
    topic: "Sequences",
    stem: "Find the 10th term of the arithmetic progression 3, 7, 11, …",
    options: [
      { key: "A", text: "35" },
      { key: "B", text: "39" },
      { key: "C", text: "43" },
      { key: "D", text: "47" },
    ],
    correctAnswer: { key: "B" },
    explanation: "aₙ = a + (n − 1)d = 3 + 9(4) = 39.",
  },
  {
    courseKey: "jamb",
    type: "true_false",
    difficulty: "easy",
    topic: "Geometry",
    stem: "The interior angles of any triangle always add up to 180°.",
    options: [],
    correctAnswer: { value: true },
    explanation: "Angle sum property of triangles (in Euclidean geometry).",
  },
  {
    courseKey: "jamb",
    type: "mcq",
    difficulty: "hard",
    topic: "Logarithms",
    stem: "If log₁₀ x = 2.5, what is x (to 1 decimal place)?",
    options: [
      { key: "A", text: "25.0" },
      { key: "B", text: "100.0" },
      { key: "C", text: "316.2" },
      { key: "D", text: "1000.0" },
    ],
    correctAnswer: { key: "C" },
    explanation: "x = 10^2.5 ≈ 316.2.",
  },
  {
    courseKey: "jamb",
    type: "mcq",
    difficulty: "medium",
    topic: "Probability",
    stem: "A fair coin is tossed 3 times. What is the probability of getting exactly 2 heads?",
    options: [
      { key: "A", text: "1/8" },
      { key: "B", text: "3/8" },
      { key: "C", text: "1/2" },
      { key: "D", text: "5/8" },
    ],
    correctAnswer: { key: "B" },
    explanation: "3 favourable outcomes out of 8 → 3/8.",
  },
  {
    courseKey: "jamb",
    type: "mcq",
    difficulty: "easy",
    topic: "Algebra",
    stem: "Factorise: x² + 7x + 12",
    options: [
      { key: "A", text: "(x + 2)(x + 6)" },
      { key: "B", text: "(x + 3)(x + 4)" },
      { key: "C", text: "(x − 3)(x − 4)" },
      { key: "D", text: "(x + 1)(x + 12)" },
    ],
    correctAnswer: { key: "B" },
    explanation: "3 × 4 = 12 and 3 + 4 = 7.",
  },
  {
    courseKey: "jamb",
    type: "short_answer",
    difficulty: "medium",
    topic: "Statistics",
    stem: "Find the median of the data set: 4, 8, 6, 10, 5, 7",
    options: [],
    correctAnswer: { accepted: ["6.5", "6.50"] },
    explanation: "Ordered: 4, 5, 6, 7, 8, 10 → median = (6 + 7)/2 = 6.5.",
  },
  {
    courseKey: "jamb",
    type: "mcq",
    difficulty: "medium",
    topic: "Mensuration",
    stem: "A circle has area 154 cm². Find its radius (take π = 22/7).",
    options: [
      { key: "A", text: "6 cm" },
      { key: "B", text: "7 cm" },
      { key: "C", text: "8 cm" },
      { key: "D", text: "14 cm" },
    ],
    correctAnswer: { key: "B" },
    explanation: "154 = (22/7)r² → r² = 49 → r = 7 cm.",
  },

  // ── WAEC/NECO ───────────────────────────────────────────────
  {
    courseKey: "waec",
    type: "mcq",
    difficulty: "easy",
    topic: "English Grammar",
    stem: "Choose the word most opposite in meaning to ABUNDANT.",
    options: [
      { key: "A", text: "Plentiful" },
      { key: "B", text: "Scarce" },
      { key: "C", text: "Enough" },
      { key: "D", text: "Rich" },
    ],
    correctAnswer: { key: "B" },
    explanation: "Abundant means plentiful; its opposite is scarce.",
  },
  {
    courseKey: "waec",
    type: "mcq",
    difficulty: "medium",
    topic: "English Grammar",
    stem: "Choose the correct option: “Neither of the boys ___ the prize.”",
    options: [
      { key: "A", text: "have won" },
      { key: "B", text: "has won" },
      { key: "C", text: "won" },
      { key: "D", text: "were winning" },
    ],
    correctAnswer: { key: "B" },
    explanation: "“Neither” is singular, so it takes “has”.",
  },
  {
    courseKey: "waec",
    type: "mcq",
    difficulty: "easy",
    topic: "Lexis & Structure",
    stem: "Choose the word most similar in meaning to METICULOUS.",
    options: [
      { key: "A", text: "careless" },
      { key: "B", text: "careful" },
      { key: "C", text: "quick" },
      { key: "D", text: "quiet" },
    ],
    correctAnswer: { key: "B" },
    explanation: "Meticulous means showing great attention to detail — careful.",
  },
  {
    courseKey: "waec",
    type: "mcq",
    difficulty: "medium",
    topic: "English Grammar",
    stem: "Choose the correct sentence.",
    options: [
      { key: "A", text: "He is one of the students who is always punctual." },
      { key: "B", text: "He is one of the students who are always punctual." },
      { key: "C", text: "He is one of the student who are always punctual." },
      { key: "D", text: "He is one of the students which is always punctual." },
    ],
    correctAnswer: { key: "B" },
    explanation: "“One of the students who…” takes a plural verb referring to the students.",
  },
  {
    courseKey: "waec",
    type: "true_false",
    difficulty: "easy",
    topic: "Figurative language",
    stem: "Onomatopoeia is a word that imitates the sound it describes (e.g. buzz, hiss).",
    options: [],
    correctAnswer: { value: true },
    explanation: "That is the definition of onomatopoeia.",
  },
  {
    courseKey: "waec",
    type: "mcq",
    difficulty: "medium",
    topic: "Lexis & Structure",
    stem: "Choose the correct plural of CRISIS.",
    options: [
      { key: "A", text: "crisises" },
      { key: "B", text: "crises" },
      { key: "C", text: "crisis" },
      { key: "D", text: "crisi" },
    ],
    correctAnswer: { key: "B" },
    explanation: "Words ending in -is often change to -es in the plural: crises.",
  },
  {
    courseKey: "waec",
    type: "mcq",
    difficulty: "easy",
    topic: "Comprehension",
    stem: "In the sentence “Her speech was so lucid that everyone understood it”, LUCID means",
    options: [
      { key: "A", text: "clear" },
      { key: "B", text: "long" },
      { key: "C", text: "loud" },
      { key: "D", text: "late" },
    ],
    correctAnswer: { key: "A" },
    explanation: "Lucid means expressed clearly and easy to understand.",
  },
  {
    courseKey: "waec",
    type: "short_answer",
    difficulty: "easy",
    topic: "English Grammar",
    stem: "Write the past tense of the verb “begin”.",
    options: [],
    correctAnswer: { accepted: ["began"] },
    explanation: "begin → began → begun.",
  },
  {
    courseKey: "waec",
    type: "mcq",
    difficulty: "easy",
    topic: "Mathematics",
    stem: "Evaluate 2/3 + 1/6.",
    options: [
      { key: "A", text: "3/9" },
      { key: "B", text: "5/6" },
      { key: "C", text: "1/2" },
      { key: "D", text: "3/6" },
    ],
    correctAnswer: { key: "B" },
    explanation: "2/3 = 4/6, so 4/6 + 1/6 = 5/6.",
  },
  {
    courseKey: "waec",
    type: "mcq",
    difficulty: "medium",
    topic: "Biology",
    stem: "Which organelle is known as the powerhouse of the cell?",
    options: [
      { key: "A", text: "Nucleus" },
      { key: "B", text: "Ribosome" },
      { key: "C", text: "Mitochondrion" },
      { key: "D", text: "Vacuole" },
    ],
    correctAnswer: { key: "C" },
    explanation: "The mitochondrion releases energy through respiration.",
  },

  // ── Primary ─────────────────────────────────────────────────
  {
    courseKey: "primary",
    type: "mcq",
    difficulty: "easy",
    topic: "Fractions",
    stem: "What is 3/4 of 200?",
    options: [
      { key: "A", text: "100" },
      { key: "B", text: "125" },
      { key: "C", text: "150" },
      { key: "D", text: "175" },
    ],
    correctAnswer: { key: "C" },
    explanation: "200 ÷ 4 = 50; 50 × 3 = 150.",
  },
  {
    courseKey: "primary",
    type: "mcq",
    difficulty: "easy",
    topic: "Decimals",
    stem: "Write 0.75 as a fraction in its lowest terms.",
    options: [
      { key: "A", text: "7/5" },
      { key: "B", text: "3/4" },
      { key: "C", text: "75/10" },
      { key: "D", text: "1/75" },
    ],
    correctAnswer: { key: "B" },
    explanation: "0.75 = 75/100 = 3/4.",
  },
  {
    courseKey: "primary",
    type: "mcq",
    difficulty: "easy",
    topic: "Mensuration",
    stem: "A rectangle measures 12 cm by 8 cm. What is its perimeter?",
    options: [
      { key: "A", text: "20 cm" },
      { key: "B", text: "40 cm" },
      { key: "C", text: "96 cm" },
      { key: "D", text: "48 cm" },
    ],
    correctAnswer: { key: "B" },
    explanation: "Perimeter = 2 × (12 + 8) = 40 cm.",
  },
  {
    courseKey: "primary",
    type: "mcq",
    difficulty: "easy",
    topic: "English",
    stem: "Choose the verb in this sentence: “The dog runs quickly.”",
    options: [
      { key: "A", text: "The" },
      { key: "B", text: "dog" },
      { key: "C", text: "runs" },
      { key: "D", text: "quickly" },
    ],
    correctAnswer: { key: "C" },
    explanation: "“Runs” is the action word, so it is the verb.",
  },
  {
    courseKey: "primary",
    type: "mcq",
    difficulty: "easy",
    topic: "English",
    stem: "Choose the opposite of ANCIENT.",
    options: [
      { key: "A", text: "old" },
      { key: "B", text: "modern" },
      { key: "C", text: "broken" },
      { key: "D", text: "big" },
    ],
    correctAnswer: { key: "B" },
    explanation: "Ancient means very old; its opposite is modern.",
  },
  {
    courseKey: "primary",
    type: "true_false",
    difficulty: "easy",
    topic: "Numbers",
    stem: "9 is a prime number.",
    options: [],
    correctAnswer: { value: false },
    explanation: "9 = 3 × 3, so it has more than two factors.",
  },
  {
    courseKey: "primary",
    type: "mcq",
    difficulty: "medium",
    topic: "Percentages",
    stem: "Find 15% of 240.",
    options: [
      { key: "A", text: "24" },
      { key: "B", text: "30" },
      { key: "C", text: "36" },
      { key: "D", text: "40" },
    ],
    correctAnswer: { key: "C" },
    explanation: "10% = 24, 5% = 12; 24 + 12 = 36.",
  },
  {
    courseKey: "primary",
    type: "mcq",
    difficulty: "easy",
    topic: "Spelling",
    stem: "Choose the correct spelling.",
    options: [
      { key: "A", text: "begining" },
      { key: "B", text: "beginnning" },
      { key: "C", text: "beginning" },
      { key: "D", text: "begginning" },
    ],
    correctAnswer: { key: "C" },
    explanation: "Double the n before -ing: beginning.",
  },
  {
    courseKey: "primary",
    type: "short_answer",
    difficulty: "medium",
    topic: "Numbers",
    stem: "What is the LCM of 4 and 6?",
    options: [],
    correctAnswer: { accepted: ["12"] },
    explanation: "Multiples of 4: 4, 8, 12…; of 6: 6, 12… → LCM = 12.",
  },
  {
    courseKey: "primary",
    type: "mcq",
    difficulty: "easy",
    topic: "Geometry",
    stem: "A triangle with all three sides equal is called",
    options: [
      { key: "A", text: "scalene" },
      { key: "B", text: "isosceles" },
      { key: "C", text: "equilateral" },
      { key: "D", text: "right-angled" },
    ],
    correctAnswer: { key: "C" },
    explanation: "Equal sides → equilateral triangle.",
  },

];

export const ANNOUNCEMENTS = [
  {
    title: "New Term Registration Is Open",
    body: "Registration for the new term is now open at the centre office and on this site. Secure your seat early — batches fill up quickly, especially the JAMB morning class. Priority goes to returning students until Friday.",
    scope: "global" as const,
    pinned: true,
  },
  {
    title: "JAMB Mock Exam Timetable Released",
    body: "The full mock timetable has been published. JAMB Morning and Evening batches will write their first full mock on the last Saturday of this month, 9:00 AM prompt in Hall A. Revise your weak topics using the formula sheet in Materials.",
    scope: "course" as const,
    courseKey: "jamb" as const,
    pinned: false,
  },
  {
    title: "Saturday Classes Start 9:00 AM Prompt",
    body: "Weekend batches, note that the gate closes 15 minutes after class starts. Latecomers will not be admitted into the exam hall during mock week.",
    scope: "batch" as const,
    batchKey: "waec-weekend" as const,
    pinned: false,
  },
];

export const NEWS = [
  {
    title: "Emerald Height Academy Records 92% Success Rate In Latest WAEC Sitting",
    slug: "waec-2026-success-rate",
    excerpt:
      "Of the 148 candidates we prepared last session, 136 credits including English and Mathematics.",
    body: `We are proud to announce that 136 of our 148 WAEC candidates recorded credits in at least five subjects, including the compulsory English Language and Mathematics.

This result reflects months of disciplined weekend classes, continuous assessment and one-on-one remedial support for struggling candidates. We thank the parents and guardians who kept their children consistent, and we congratulate every student who put in the work.

Registration for the next session is open — visit the centre or use the registration form on this website.`,
    published: true,
    imageUrl: "https://picsum.photos/seed/waec-success/1200/630",
  },
  {
    title: "Free JAMB CBT Clinic — Saturday, 10:00 AM",
    slug: "free-jamb-cbt-clinic",
    excerpt:
      "Open to all JAMB candidates (including non-students). Bring your registration number.",
    body: `We are hosting a free computer-based test clinic for every JAMB candidate in the community this Saturday from 10:00 AM to 1:00 PM in Hall A.

You will write a full timed CBT, get an instant score breakdown by topic, and receive a personal revision plan. No payment is required — this is part of our community service.

Seats are limited to 60 candidates. Arrive 15 minutes early with your JAMB registration number.`,
    published: true,
    imageUrl: "https://picsum.photos/seed/cbt-clinic/1200/630",
  },
];

export const EVENTS = [
  {
    title: "Open Day & Campus Tour",
    slug: "open-day-campus-tour",
    description:
      "Tour our classrooms and lab, meet the tutors, and get free advice on the right batch for your child. Walk-ins welcome between 10 AM and 3 PM.",
    location: "Emerald Height Academy, Abeokuta",
    daysFromNow: 10,
    status: "upcoming" as const,
  },
  {
    title: "JAMB Full Mock Examination",
    slug: "jamb-full-mock",
    description:
      "A complete 3-hour CBT mock under exam conditions for all JAMB batches. Results and topic analysis released within 48 hours.",
    location: "Hall A & Computer Lab",
    daysFromNow: 21,
    status: "upcoming" as const,
  },
];

export const GALLERY = [
  { title: "Hall A — JAMB morning class", category: "classrooms", seed: "gallery-hall-a" },
  { title: "Computer lab session", category: "lab", seed: "gallery-lab" },
  { title: "WAEC weekend revision", category: "classrooms", seed: "gallery-waec" },
  { title: "Prize giving day", category: "events", seed: "gallery-prize" },
  { title: "Primary batch reading corner", category: "classrooms", seed: "gallery-primary" },
];

export const TESTIMONIALS = [
  {
    name: "Mrs. Funmi Adeleke",
    program: "Parent — JAMB Morning Batch",
    quote:
      "My son moved from averaging 180 in his practice tests to 268 in the actual UTME. The weekly CBTs and the personal weak-topic plan made the difference.",
    rating: 5,
    featured: true,
    approved: true,
  },
  {
    name: "Ifeoma Nwosu",
    program: "Student — WAEC Weekend Batch",
    quote:
      "The English comprehension technique alone was worth the fees. I passed all my papers with credits on the first sitting.",
    rating: 5,
    featured: true,
    approved: true,
  },
  {
    name: "Alhaji Musa Danjuma",
    program: "Parent — Primary Afternoon Batch",
    quote:
      "My daughter used to cry about maths. Now she does her times tables for fun and her teacher says she is one of the best in class.",
    rating: 5,
    featured: true,
    approved: true,
  },
  {
    name: "Anonymous",
    program: "Student — JAMB Evening Batch",
    quote: "The evening classes fitted around my school schedule perfectly.",
    rating: 4,
    featured: false,
    approved: false,
  },
];

export const FAQS = [
  {
    question: "Do I need to pay online to register?",
    answer:
      "No. There is no online payment on this website. Submit the registration form here, then complete payment at the centre office or by bank transfer confirmed by the office. Your portal access is activated by the office once you are enrolled — never by an online payment.",
    category: "Registration",
  },
  {
    question: "How do classes work?",
    answer:
      "All classes are taught in person at our Abeokuta centre. Batches run in the mornings, evenings and on Saturdays so you can pick what fits your family's schedule; primary groups meet after school.",
    category: "Classes",
  },
  {
    question: "What ages/levels do you accept?",
    answer:
      "Primary pupils (after-school enrichment), junior and senior secondary students (WAEC/NECO/JAMB prep), and adult learners preparing for external exams. Contact the office if you are unsure which batch fits.",
    category: "Classes",
  },
  {
    question: "How often do students take tests?",
    answer:
      "Every batch has continuous assessment: short quizzes after major topics, assignments with deadlines, and full mock exams before the main external exams. All scores appear in the student portal with progress charts.",
    category: "Assessment",
  },
  {
    question: "Can I change batches after enrolling?",
    answer:
      "Yes, subject to space. Speak to the office; they will move your enrolment and update your timetable in the portal.",
    category: "Registration",
  },
  {
    question: "How do I contact my child's tutor?",
    answer:
      "Log in to the student portal and use Messages. You can also call the centre phone or WhatsApp the office to arrange a meeting.",
    category: "Portal",
  },
];

export const SETTINGS_DATA: Record<string, unknown> = {
  center: {
    name: "Emerald Height Academy",
    tagline: "Excellence in every lesson.",
    shortName: "EHA",
    phone: "+234 803 000 0001",
    whatsapp: "+234 803 000 0001",
    email: "hello@emeraldheightacademy.com",
    address: "12 Education Avenue, Abeokuta, Ogun State",
    city: "Abeokuta, Nigeria",
    establishedYear: 2015,
    mapQuery: "Abeokuta, Ogun, Nigeria",
    socials: {
      facebook: "https://facebook.com/mrsamtutorial",
      instagram: "https://instagram.com/mrsamtutorial",
      youtube: "https://youtube.com/@mrsamtutorial",
    },
  },
  fees_info: {
    title: "Fees & How to Pay",
    body: `Fees at Emerald Height Academy are paid offline — there is no online payment on this website.

1. Submit the registration form on this site (or visit the office).
2. The office confirms your batch and seat, then gives you the fee schedule for your course.
3. Pay at the centre office (cash or POS) or by bank transfer to the account details issued by the office.
4. Bring your payment teller/receipt to the office so your enrolment and portal access can be activated.

For the current fee schedule for any course, call or WhatsApp the office, or visit us at 12 Education Avenue, Abeokuta.`,
    lastUpdated: null,
  },
  features: {
    announcementsEmailBlast: false,
  },
  attendance: {
    editWindowDays: 7,
  },
  security: {
    loginMaxAttempts: 5,
    loginLockoutMinutes: 15,
  },
};
