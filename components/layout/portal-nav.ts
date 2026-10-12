import type { Role } from "@/lib/auth/jwt";
import {
  ArchiveIcon,
  AwardIcon,
  BookOpenIcon,
  CalendarCheckIcon,
  CalendarIcon,
  ClipboardListIcon,
  GraduationCapIcon,
  InboxIcon,
  LayoutDashboardIcon,
  LibraryBigIcon,
  ListChecksIcon,
  MegaphoneIcon,
  MessageSquareIcon,
  PaletteIcon,
  SettingsIcon,
  ShieldAlertIcon,
  UsersIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

export type NavSection = {
  /** Optional group label rendered above the items. */
  label?: string;
  items: NavItem[];
};

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Super Admin",
  tutor: "Tutor Portal",
  student: "Student Portal",
};

/**
 * Sidebar navigation per role.
 * Every href maps to a real page (placeholders exist where features land
 * in later phases), so no nav link ever 404s.
 */
export const portalNav: Record<Role, NavSection[]> = {
  admin: [
    {
      items: [{ title: "Dashboard", href: "/admin", icon: LayoutDashboardIcon }],
    },
    {
      label: "People",
      items: [
        { title: "Users", href: "/admin/users", icon: UsersIcon },
        { title: "Enrollments", href: "/admin/enrollments", icon: GraduationCapIcon },
      ],
    },
    {
      label: "Academics",
      items: [
        { title: "Courses", href: "/admin/courses", icon: BookOpenIcon },
        { title: "Batches", href: "/admin/batches", icon: ArchiveIcon },
        { title: "Timetable", href: "/admin/timetable", icon: CalendarIcon },
      ],
    },
    {
      label: "Learning",
      items: [
        { title: "Tests & Quizzes", href: "/admin/tests", icon: ListChecksIcon },
        { title: "Announcements", href: "/admin/announcements", icon: MegaphoneIcon },
        { title: "Messages", href: "/admin/messages", icon: MessageSquareIcon },
      ],
    },
    {
      label: "System",
      items: [
        { title: "Site Content", href: "/admin/content", icon: PaletteIcon },
        { title: "Public Requests", href: "/admin/requests", icon: InboxIcon },
        { title: "Settings", href: "/admin/settings", icon: SettingsIcon },
        { title: "Audit Log", href: "/admin/audit", icon: ShieldAlertIcon },
      ],
    },
  ],
  tutor: [
    {
      items: [{ title: "Dashboard", href: "/tutor", icon: LayoutDashboardIcon }],
    },
    {
      label: "Teaching",
      items: [
        { title: "Attendance", href: "/tutor/attendance", icon: CalendarCheckIcon },
        { title: "Assignments", href: "/tutor/assignments", icon: ClipboardListIcon },
        { title: "Materials", href: "/tutor/materials", icon: LibraryBigIcon },
        { title: "Tests & Quizzes", href: "/tutor/tests", icon: ListChecksIcon },
        { title: "Question Bank", href: "/tutor/questions", icon: BookOpenIcon },
      ],
    },
    {
      label: "Class",
      items: [
        { title: "My Students", href: "/tutor/students", icon: UsersIcon },
        { title: "Timetable", href: "/tutor/timetable", icon: CalendarIcon },
      ],
    },
    {
      label: "Communication",
      items: [
        { title: "Announcements", href: "/tutor/announcements", icon: MegaphoneIcon },
        { title: "Messages", href: "/tutor/messages", icon: MessageSquareIcon },
      ],
    },
  ],
  student: [
    {
      items: [{ title: "Dashboard", href: "/student", icon: LayoutDashboardIcon }],
    },
    {
      label: "Learning",
      items: [
        { title: "My Courses", href: "/student/courses", icon: BookOpenIcon },
        { title: "Tests & Quizzes", href: "/student/tests", icon: ListChecksIcon },
        { title: "Assignments", href: "/student/assignments", icon: ClipboardListIcon },
        { title: "Materials", href: "/student/materials", icon: LibraryBigIcon },
      ],
    },
    {
      label: "Progress",
      items: [
        { title: "Attendance", href: "/student/attendance", icon: CalendarCheckIcon },
        { title: "Timetable", href: "/student/timetable", icon: CalendarIcon },
        { title: "Results", href: "/student/results", icon: AwardIcon },
      ],
    },
    {
      label: "Communication",
      items: [
        { title: "Announcements", href: "/student/announcements", icon: MegaphoneIcon },
        { title: "Messages", href: "/student/messages", icon: MessageSquareIcon },
      ],
    },
  ],
};
