import { MIN_SCOPES } from "./scopes";

export type ClassroomCourse = {
  id: string;
  name: string;
  section?: string;
  descriptionHeading?: string;
  instructor: string;
  room?: string;
  colorScheme: "purple" | "blue" | "teal" | "orange";
  assignments: ClassroomItem[];
};

export type ClassroomItem = {
  id: string;
  title: string;
  type: "assignment" | "quiz" | "project" | "reading" | "material";
  dueText?: string;
  dueDate?: string;
  status: "pending" | "completed" | "due_soon" | "overdue";
  link?: string;
};

export function mockClassroomCourses(): ClassroomCourse[] {
  return [
    {
      id: "course-cs301",
      name: "Data Structures & Algorithms",
      section: "CS-301",
      instructor: "Prof. Mehta",
      colorScheme: "purple",
      assignments: [
        {
          id: "cs301-a4",
          title: "Assignment 4",
          type: "assignment",
          dueText: "Due Tomorrow",
          status: "due_soon",
        },
        {
          id: "cs301-q2",
          title: "Quiz 2",
          type: "quiz",
          dueText: "Due Sep 12",
          status: "pending",
        },
      ],
    },
    {
      id: "course-cs302",
      name: "Operating Systems",
      section: "CS-302",
      instructor: "Prof. Rao",
      colorScheme: "blue",
      assignments: [
        {
          id: "cs302-proj",
          title: "Project Proposal",
          type: "project",
          dueText: "Due Sep 15",
          status: "pending",
        },
        {
          id: "cs302-read",
          title: "Reading: Chapter 3",
          type: "reading",
          dueText: "No due date",
          status: "pending",
        },
      ],
    },
    {
      id: "course-cs303",
      name: "Database Management",
      section: "CS-303",
      instructor: "Prof. Sharma",
      colorScheme: "teal",
      assignments: [
        {
          id: "cs303-a2",
          title: "Assignment 2",
          type: "assignment",
          dueText: "Due Friday",
          status: "due_soon",
        },
        {
          id: "cs303-rev",
          title: "Midterm Revision",
          type: "reading",
          dueText: "Due Sep 18",
          status: "pending",
        },
      ],
    },
    {
      id: "course-cs304",
      name: "Artificial Intelligence",
      section: "CS-304",
      instructor: "Prof. Khan",
      colorScheme: "orange",
      assignments: [
        {
          id: "cs304-a1",
          title: "Assignment 1",
          type: "assignment",
          dueText: "Completed",
          status: "completed",
        },
        {
          id: "cs304-mat",
          title: "New Material",
          type: "material",
          dueText: "Added yesterday",
          status: "pending",
        },
      ],
    },
  ];
}

export function getClassroomUpcomingList(courses: ClassroomCourse[]) {
  const all: { courseName: string; courseSection?: string; item: ClassroomItem }[] = [];
  for (const c of courses) {
    for (const a of c.assignments) {
      all.push({
        courseName: c.name,
        courseSection: c.section,
        item: a,
      });
    }
  }
  return all;
}

export function isMockToken(token: string): boolean {
  return token.startsWith("mock_");
}

export async function listClassroomCourses(accessToken: string): Promise<ClassroomCourse[]> {
  if (!accessToken || isMockToken(accessToken)) {
    return mockClassroomCourses();
  }

  try {
    const res = await fetch("https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return mockClassroomCourses();
    const data = await res.json();
    if (!Array.isArray(data.courses) || data.courses.length === 0) {
      return mockClassroomCourses();
    }
    const colors: ("purple" | "blue" | "teal" | "orange")[] = ["purple", "blue", "teal", "orange"];
    const courses = await Promise.all(data.courses.slice(0, 8).map(async (c: { id: string; name: string; section?: string }, idx: number) => {
      const workRes = await fetch(`https://classroom.googleapis.com/v1/courses/${c.id}/courseWork?courseWorkStates=ACTIVE&pageSize=100`, { headers: { Authorization: `Bearer ${accessToken}` } });
      const workData = workRes.ok ? await workRes.json() : {};
      const assignments = Array.isArray(workData.courseWork) ? workData.courseWork.map((w: { id: string; title: string; workType?: string; dueDate?: { year: number; month: number; day: number }; dueTime?: { hours?: number; minutes?: number }; alternateLink?: string; state?: string }) => {
        const dueDate = w.dueDate ? new Date(Date.UTC(w.dueDate.year, w.dueDate.month - 1, w.dueDate.day, w.dueTime?.hours ?? 23, w.dueTime?.minutes ?? 59)) : undefined;
        const status = w.state === "DELETED" ? "completed" : dueDate && dueDate.getTime() < Date.now() ? "overdue" : dueDate && dueDate.getTime() < Date.now() + 3 * 86400000 ? "due_soon" : "pending";
        return { id: w.id, title: w.title, type: w.workType === "QUIZ" ? "quiz" : w.workType === "PROJECT" ? "project" : "assignment", dueDate: dueDate?.toISOString(), dueText: dueDate ? `Due ${dueDate.toLocaleDateString()}` : "No due date", status, link: w.alternateLink } as ClassroomItem;
      }) : [];
      return { id: c.id, name: c.name, section: c.section ?? `SEC-${idx + 1}`, instructor: "Faculty Instructor", colorScheme: colors[idx % colors.length], assignments };
    }));
    return courses;
  } catch {
    return mockClassroomCourses();
  }
}
