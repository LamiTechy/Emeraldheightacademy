import { pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["student", "tutor", "admin"]);

export const userStatusEnum = pgEnum("user_status", ["active", "suspended", "pending"]);

export const genderEnum = pgEnum("gender", ["male", "female", "other"]);

export const educationLevelEnum = pgEnum("education_level", [
  "primary",
  "junior_secondary",
  "senior_secondary",
  "university",
  "adult",
  "other",
]);

export const courseModeEnum = pgEnum("course_mode", ["physical", "online", "hybrid"]);

export const courseCategoryEnum = pgEnum("course_category", [
  "exam_prep",
  "primary",
  "secondary",
  "coding",
  "languages",
  "university",
  "other",
]);

export const courseStatusEnum = pgEnum("course_status", ["active", "inactive", "archived"]);

export const batchStatusEnum = pgEnum("batch_status", ["upcoming", "active", "completed", "cancelled"]);

export const enrollmentStatusEnum = pgEnum("enrollment_status", [
  "pending",
  "active",
  "waitlisted",
  "completed",
  "dropped",
]);

export const attendanceStatusEnum = pgEnum("attendance_status", ["present", "absent", "late", "excused"]);

export const assignmentStatusEnum = pgEnum("assignment_status", ["draft", "published", "closed"]);

export const submissionStatusEnum = pgEnum("submission_status", ["submitted", "late", "graded", "returned"]);

export const materialTypeEnum = pgEnum("material_type", ["note", "past_question", "video", "link", "other"]);

export const questionTypeEnum = pgEnum("question_type", ["mcq", "true_false", "short_answer"]);

export const difficultyEnum = pgEnum("difficulty", ["easy", "medium", "hard"]);

export const testStatusEnum = pgEnum("test_status", ["draft", "published", "closed"]);

export const attemptStatusEnum = pgEnum("attempt_status", ["in_progress", "submitted", "graded"]);

export const announcementScopeEnum = pgEnum("announcement_scope", ["global", "role", "course", "batch"]);

export const registrationStatusEnum = pgEnum("registration_status", ["pending", "approved", "rejected", "waitlisted"]);

export const trialStatusEnum = pgEnum("trial_status", ["new", "contacted", "converted", "closed"]);

export const contactStatusEnum = pgEnum("contact_status", ["new", "read", "replied", "archived"]);

export const eventStatusEnum = pgEnum("event_status", ["upcoming", "ongoing", "completed", "cancelled"]);
