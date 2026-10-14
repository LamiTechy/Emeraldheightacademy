/** Plain serializable view models passed from RSC pages to client components. */

export type UserView = {
  id: string;
  role: "student" | "tutor" | "admin";
  name: string;
  email: string;
  phone: string | null;
  status: "active" | "suspended" | "pending";
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  createdAt: string | null;
  studentId: string | null;
  educationLevel: string | null;
  gender: string | null;
  school: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  tutorId: string | null;
  bio: string | null;
  qualifications: string | null;
};

export type CourseView = {
  id: string;
  code: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  longDescription: string | null;
  durationWeeks: number | null;
  scheduleSummary: string | null;
  mode: string;
  status: string;
  featured: boolean;
  sortOrder: number;
  batchCount: number;
};

export type BatchTutorView = {
  tutorRowId: string;
  name: string;
  tutorId: string;
};

export type BatchView = {
  id: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  name: string;
  code: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  mode: string;
  room: string | null;
  capacity: number;
  startDate: string;
  endDate: string;
  status: string;
  tutors: BatchTutorView[];
  enrolledCount: number;
};

export type EnrollmentView = {
  id: string;
  studentUserId: string;
  studentRowId: string;
  studentName: string;
  studentEmail: string;
  studentCode: string;
  batchId: string;
  batchCode: string;
  batchName: string;
  courseName: string;
  status: string;
  enrolledAt: string | null;
  notes: string | null;
};

export type SlotView = {
  id: string;
  batchId: string;
  batchCode: string;
  batchName: string;
  courseName: string;
  tutorRowId: string;
  tutorName: string;
  tutorCode: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string | null;
};

export type FormOptions = {
  students: {
    userId: string;
    studentRowId: string;
    studentId: string;
    name: string;
    email: string;
    status: string;
  }[];
  tutors: { tutorRowId: string; tutorId: string; name: string }[];
  courses: { id: string; code: string; name: string; status: string }[];
  batches: {
    id: string;
    code: string;
    name: string;
    courseId: string;
    capacity: number;
    status: string;
    enrolled: number;
  }[];
};
