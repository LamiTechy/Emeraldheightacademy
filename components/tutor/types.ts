export type BatchOption = {
  id: string;
  label: string;
  courseName: string;
  daysOfWeek: number[];
};

export type RosterStudent = {
  studentId: string;
  studentCode: string;
  name: string;
  email: string;
};

export type ExistingAttendance = {
  studentId: string;
  status: string;
  notes: string | null;
};

export type AttendanceStatusValue = "present" | "absent" | "late" | "excused";

export type AssignmentView = {
  id: string;
  title: string;
  instructions: string;
  batchId: string;
  batchCode: string;
  batchName: string;
  courseName: string;
  dueAt: string;
  points: number;
  status: string;
  attachmentUrl: string | null;
  attachmentName: string | null;
  submittedCount: number;
  gradedCount: number;
  rosterCount: number;
  createdAt: string;
};

export type SubmissionView = {
  id: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  email: string;
  content: string | null;
  fileUrl: string | null;
  fileName: string | null;
  status: string;
  score: number | null;
  feedback: string | null;
  submittedAt: string;
  gradedAt: string | null;
};

export type MaterialView = {
  id: string;
  courseId: string;
  batchId: string | null;
  title: string;
  description: string | null;
  type: string;
  url: string;
  fileName: string | null;
  fileSize: number | null;
  tags: string[];
  courseName: string;
  batchName: string | null;
  createdAt: string;
};

export type CourseTreeNode = {
  id: string;
  name: string;
  batches: { id: string; name: string; code: string }[];
};

export type TutorSlotView = {
  id: string;
  startTime: string;
  endTime: string;
  room: string | null;
  meetingUrl: string | null;
  batchCode: string;
  batchName: string;
  courseName: string;
};

export type TutorStudentView = {
  studentId: string;
  studentCode: string;
  name: string;
  email: string;
  batches: { code: string; name: string }[];
  enrolledAt: string;
  gradedAttempts: number;
  avgScore: number | null;
  assignmentsAvailable: number;
  assignmentsSubmitted: number;
  presentCount: number;
  attendanceTotal: number;
};
