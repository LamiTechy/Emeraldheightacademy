CREATE TYPE "public"."announcement_scope" AS ENUM('global', 'role', 'course', 'batch');--> statement-breakpoint
CREATE TYPE "public"."assignment_status" AS ENUM('draft', 'published', 'closed');--> statement-breakpoint
CREATE TYPE "public"."attempt_status" AS ENUM('in_progress', 'submitted', 'graded');--> statement-breakpoint
CREATE TYPE "public"."attendance_status" AS ENUM('present', 'absent', 'late', 'excused');--> statement-breakpoint
CREATE TYPE "public"."batch_status" AS ENUM('upcoming', 'active', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."contact_status" AS ENUM('new', 'read', 'replied', 'archived');--> statement-breakpoint
CREATE TYPE "public"."course_category" AS ENUM('exam_prep', 'primary', 'secondary', 'coding', 'languages', 'university', 'other');--> statement-breakpoint
CREATE TYPE "public"."course_mode" AS ENUM('physical', 'online', 'hybrid');--> statement-breakpoint
CREATE TYPE "public"."course_status" AS ENUM('active', 'inactive', 'archived');--> statement-breakpoint
CREATE TYPE "public"."difficulty" AS ENUM('easy', 'medium', 'hard');--> statement-breakpoint
CREATE TYPE "public"."education_level" AS ENUM('primary', 'junior_secondary', 'senior_secondary', 'university', 'adult', 'other');--> statement-breakpoint
CREATE TYPE "public"."enrollment_status" AS ENUM('pending', 'active', 'waitlisted', 'completed', 'dropped');--> statement-breakpoint
CREATE TYPE "public"."event_status" AS ENUM('upcoming', 'ongoing', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('male', 'female', 'other');--> statement-breakpoint
CREATE TYPE "public"."material_type" AS ENUM('note', 'past_question', 'video', 'link', 'other');--> statement-breakpoint
CREATE TYPE "public"."question_type" AS ENUM('mcq', 'true_false', 'short_answer');--> statement-breakpoint
CREATE TYPE "public"."registration_status" AS ENUM('pending', 'approved', 'rejected', 'waitlisted');--> statement-breakpoint
CREATE TYPE "public"."submission_status" AS ENUM('submitted', 'late', 'graded', 'returned');--> statement-breakpoint
CREATE TYPE "public"."test_status" AS ENUM('draft', 'published', 'closed');--> statement-breakpoint
CREATE TYPE "public"."trial_status" AS ENUM('new', 'contacted', 'converted', 'closed');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('student', 'tutor', 'admin');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'suspended', 'pending');--> statement-breakpoint
CREATE TABLE "admins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admins_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "password_resets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"student_id" text NOT NULL,
	"education_level" "education_level",
	"gender" "gender",
	"date_of_birth" date,
	"school" text,
	"address" text,
	"guardian_name" text,
	"guardian_phone" text,
	"guardian_relationship" text,
	"is_minor" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "students_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "students_student_id_unique" UNIQUE("student_id")
);
--> statement-breakpoint
CREATE TABLE "tutors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tutor_id" text NOT NULL,
	"bio" text,
	"qualifications" text,
	"specialties" text[],
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tutors_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "tutors_tutor_id_unique" UNIQUE("tutor_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role" "user_role" NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"password_hash" text NOT NULL,
	"token_version" integer DEFAULT 0 NOT NULL,
	"status" "user_status" DEFAULT 'active' NOT NULL,
	"must_change_password" boolean DEFAULT false NOT NULL,
	"avatar_url" text,
	"last_login_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"days_of_week" integer[] NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"mode" "course_mode" DEFAULT 'physical' NOT NULL,
	"room" text,
	"meeting_url" text,
	"capacity" integer DEFAULT 30 NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"status" "batch_status" DEFAULT 'upcoming' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "batches_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"category" "course_category" DEFAULT 'other' NOT NULL,
	"description" text NOT NULL,
	"long_description" text,
	"duration_weeks" integer,
	"schedule_summary" text,
	"mode" "course_mode" DEFAULT 'hybrid' NOT NULL,
	"syllabus" text[],
	"image_url" text,
	"status" "course_status" DEFAULT 'active' NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "courses_code_unique" UNIQUE("code"),
	CONSTRAINT "courses_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"batch_id" uuid NOT NULL,
	"status" "enrollment_status" DEFAULT 'active' NOT NULL,
	"enrolled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"dropped_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "timetable_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL,
	"tutor_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"room" text,
	"meeting_url" text,
	"valid_from" date,
	"valid_to" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tutor_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tutor_id" uuid NOT NULL,
	"batch_id" uuid NOT NULL,
	"role" text DEFAULT 'lead' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL,
	"tutor_id" uuid NOT NULL,
	"title" text NOT NULL,
	"instructions" text NOT NULL,
	"due_at" timestamp with time zone NOT NULL,
	"attachment_url" text,
	"attachment_name" text,
	"points" integer DEFAULT 100 NOT NULL,
	"status" "assignment_status" DEFAULT 'published' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"batch_id" uuid NOT NULL,
	"slot_id" uuid,
	"day" date NOT NULL,
	"status" "attendance_status" NOT NULL,
	"notes" text,
	"marked_by" uuid,
	"marked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "materials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"batch_id" uuid,
	"tutor_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"type" "material_type" DEFAULT 'note' NOT NULL,
	"url" text NOT NULL,
	"file_name" text,
	"file_size" integer,
	"tags" text[],
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assignment_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"content" text,
	"file_url" text,
	"file_name" text,
	"status" "submission_status" DEFAULT 'submitted' NOT NULL,
	"score" numeric(7, 2),
	"feedback" text,
	"graded_by" uuid,
	"graded_at" timestamp with time zone,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attempt_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attempt_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"answer" jsonb,
	"is_correct" boolean,
	"awarded_marks" numeric(7, 2) DEFAULT '0' NOT NULL,
	"feedback" text,
	"graded_by" uuid,
	"graded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"tutor_id" uuid,
	"type" "question_type" NOT NULL,
	"difficulty" "difficulty" DEFAULT 'medium' NOT NULL,
	"topic" text NOT NULL,
	"stem" text NOT NULL,
	"options" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"correct_answer" jsonb NOT NULL,
	"explanation" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "test_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"test_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"attempt_number" integer DEFAULT 1 NOT NULL,
	"status" "attempt_status" DEFAULT 'in_progress' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"submitted_at" timestamp with time zone,
	"auto_submitted" boolean DEFAULT false NOT NULL,
	"total_score" numeric(7, 2),
	"max_score" numeric(7, 2),
	"tab_switch_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "test_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"test_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"marks" numeric(5, 2) DEFAULT '1' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"batch_id" uuid,
	"tutor_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"duration_minutes" integer DEFAULT 30 NOT NULL,
	"attempts_allowed" integer DEFAULT 1 NOT NULL,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"shuffle_questions" boolean DEFAULT true NOT NULL,
	"shuffle_options" boolean DEFAULT true NOT NULL,
	"show_answers_after" boolean DEFAULT true NOT NULL,
	"status" "test_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"author_id" uuid,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"scope" "announcement_scope" DEFAULT 'global' NOT NULL,
	"audience_role" "user_role",
	"course_id" uuid,
	"batch_id" uuid,
	"pinned" boolean DEFAULT false NOT NULL,
	"publish_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"subject" text NOT NULL,
	"message" text NOT NULL,
	"status" "contact_status" DEFAULT 'new' NOT NULL,
	"replied_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sender_id" uuid NOT NULL,
	"recipient_id" uuid NOT NULL,
	"parent_id" uuid,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "registration_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" text NOT NULL,
	"email" text,
	"phone" text NOT NULL,
	"course_ids" uuid[] DEFAULT '{}' NOT NULL,
	"preferred_schedule" text,
	"education_level" "education_level",
	"guardian_name" text,
	"guardian_phone" text,
	"guardian_relationship" text,
	"message" text,
	"status" "registration_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"rejection_reason" text,
	"student_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trial_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"course_interest" text NOT NULL,
	"preferred_date" date,
	"message" text,
	"status" "trial_status" DEFAULT 'new' NOT NULL,
	"handled_by" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text NOT NULL,
	"cover_image_url" text,
	"location" text,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone,
	"status" "event_status" DEFAULT 'upcoming' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "faqs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"category" text DEFAULT 'General' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gallery_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"caption" text,
	"image_url" text NOT NULL,
	"category" text DEFAULT 'general' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "news" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"excerpt" text,
	"body" text NOT NULL,
	"cover_image_url" text,
	"author_id" uuid,
	"published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "news_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "testimonials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"program" text,
	"quote" text NOT NULL,
	"photo_url" text,
	"rating" smallint,
	"featured" boolean DEFAULT false NOT NULL,
	"approved" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"actor_role" "user_role",
	"action" text NOT NULL,
	"entity_type" text,
	"entity_id" text,
	"summary" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"ip" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admins" ADD CONSTRAINT "admins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tutors" ADD CONSTRAINT "tutors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable_slots" ADD CONSTRAINT "timetable_slots_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable_slots" ADD CONSTRAINT "timetable_slots_tutor_id_tutors_id_fk" FOREIGN KEY ("tutor_id") REFERENCES "public"."tutors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tutor_assignments" ADD CONSTRAINT "tutor_assignments_tutor_id_tutors_id_fk" FOREIGN KEY ("tutor_id") REFERENCES "public"."tutors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tutor_assignments" ADD CONSTRAINT "tutor_assignments_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_tutor_id_tutors_id_fk" FOREIGN KEY ("tutor_id") REFERENCES "public"."tutors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_slot_id_timetable_slots_id_fk" FOREIGN KEY ("slot_id") REFERENCES "public"."timetable_slots"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_marked_by_users_id_fk" FOREIGN KEY ("marked_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_tutor_id_tutors_id_fk" FOREIGN KEY ("tutor_id") REFERENCES "public"."tutors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_assignment_id_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."assignments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_graded_by_users_id_fk" FOREIGN KEY ("graded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempt_answers" ADD CONSTRAINT "attempt_answers_attempt_id_test_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."test_attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempt_answers" ADD CONSTRAINT "attempt_answers_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempt_answers" ADD CONSTRAINT "attempt_answers_graded_by_users_id_fk" FOREIGN KEY ("graded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_tutor_id_tutors_id_fk" FOREIGN KEY ("tutor_id") REFERENCES "public"."tutors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_attempts" ADD CONSTRAINT "test_attempts_test_id_tests_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."tests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_attempts" ADD CONSTRAINT "test_attempts_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_questions" ADD CONSTRAINT "test_questions_test_id_tests_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."tests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_questions" ADD CONSTRAINT "test_questions_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tests" ADD CONSTRAINT "tests_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tests" ADD CONSTRAINT "tests_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tests" ADD CONSTRAINT "tests_tutor_id_tutors_id_fk" FOREIGN KEY ("tutor_id") REFERENCES "public"."tutors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_parent_id_messages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_requests" ADD CONSTRAINT "registration_requests_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_requests" ADD CONSTRAINT "registration_requests_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trial_requests" ADD CONSTRAINT "trial_requests_handled_by_users_id_fk" FOREIGN KEY ("handled_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news" ADD CONSTRAINT "news_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "password_resets_user_idx" ON "password_resets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "students_student_id_idx" ON "students" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "tutors_tutor_id_idx" ON "tutors" USING btree ("tutor_id");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "users_status_idx" ON "users" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "users_phone_key" ON "users" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "batches_course_idx" ON "batches" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "batches_status_idx" ON "batches" USING btree ("status");--> statement-breakpoint
CREATE INDEX "courses_status_idx" ON "courses" USING btree ("status");--> statement-breakpoint
CREATE INDEX "courses_category_idx" ON "courses" USING btree ("category");--> statement-breakpoint
CREATE UNIQUE INDEX "enrollments_student_batch_key" ON "enrollments" USING btree ("student_id","batch_id");--> statement-breakpoint
CREATE INDEX "enrollments_batch_status_idx" ON "enrollments" USING btree ("batch_id","status");--> statement-breakpoint
CREATE INDEX "timetable_slots_tutor_day_idx" ON "timetable_slots" USING btree ("tutor_id","day_of_week");--> statement-breakpoint
CREATE INDEX "timetable_slots_batch_day_idx" ON "timetable_slots" USING btree ("batch_id","day_of_week");--> statement-breakpoint
CREATE UNIQUE INDEX "tutor_assignments_tutor_batch_key" ON "tutor_assignments" USING btree ("tutor_id","batch_id");--> statement-breakpoint
CREATE INDEX "tutor_assignments_batch_idx" ON "tutor_assignments" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "assignments_batch_status_idx" ON "assignments" USING btree ("batch_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "attendance_student_batch_day_key" ON "attendance" USING btree ("student_id","batch_id","day");--> statement-breakpoint
CREATE INDEX "attendance_batch_day_idx" ON "attendance" USING btree ("batch_id","day");--> statement-breakpoint
CREATE INDEX "attendance_student_day_idx" ON "attendance" USING btree ("student_id","day");--> statement-breakpoint
CREATE INDEX "materials_course_idx" ON "materials" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "materials_batch_idx" ON "materials" USING btree ("batch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "submissions_assignment_student_key" ON "submissions" USING btree ("assignment_id","student_id");--> statement-breakpoint
CREATE INDEX "submissions_student_idx" ON "submissions" USING btree ("student_id");--> statement-breakpoint
CREATE UNIQUE INDEX "attempt_answers_attempt_question_key" ON "attempt_answers" USING btree ("attempt_id","question_id");--> statement-breakpoint
CREATE INDEX "attempt_answers_question_idx" ON "attempt_answers" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "questions_course_topic_idx" ON "questions" USING btree ("course_id","topic");--> statement-breakpoint
CREATE UNIQUE INDEX "test_attempts_test_student_number_key" ON "test_attempts" USING btree ("test_id","student_id","attempt_number");--> statement-breakpoint
CREATE UNIQUE INDEX "test_attempts_one_active_key" ON "test_attempts" USING btree ("test_id","student_id") WHERE "test_attempts"."status" = 'in_progress';--> statement-breakpoint
CREATE INDEX "test_attempts_student_idx" ON "test_attempts" USING btree ("student_id");--> statement-breakpoint
CREATE UNIQUE INDEX "test_questions_test_question_key" ON "test_questions" USING btree ("test_id","question_id");--> statement-breakpoint
CREATE INDEX "test_questions_test_idx" ON "test_questions" USING btree ("test_id");--> statement-breakpoint
CREATE INDEX "tests_course_status_idx" ON "tests" USING btree ("course_id","status");--> statement-breakpoint
CREATE INDEX "tests_batch_idx" ON "tests" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "announcements_scope_publish_idx" ON "announcements" USING btree ("scope","publish_at");--> statement-breakpoint
CREATE INDEX "contact_messages_status_idx" ON "contact_messages" USING btree ("status");--> statement-breakpoint
CREATE INDEX "messages_recipient_read_idx" ON "messages" USING btree ("recipient_id","read_at");--> statement-breakpoint
CREATE INDEX "messages_sender_idx" ON "messages" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "messages_parent_idx" ON "messages" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "registration_requests_status_idx" ON "registration_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "trial_requests_status_idx" ON "trial_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "events_starts_at_idx" ON "events" USING btree ("starts_at");--> statement-breakpoint
CREATE INDEX "faqs_active_idx" ON "faqs" USING btree ("active");--> statement-breakpoint
CREATE INDEX "news_published_idx" ON "news" USING btree ("published","published_at");--> statement-breakpoint
CREATE INDEX "testimonials_approved_idx" ON "testimonials" USING btree ("approved","featured");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_idx" ON "audit_logs" USING btree ("actor_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_logs_created_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_action_idx" ON "audit_logs" USING btree ("action");