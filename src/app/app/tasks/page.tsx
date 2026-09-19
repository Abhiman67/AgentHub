"use client";
import { useEffect, useMemo, useState } from "react";
import { ConfirmDialog, Dialog } from "@/components/Dialog";

type Task = {
  id: string;
  title: string;
  status: string;
  dueDate: string | null;
  priority: string;
  projectId: string | null;
};

type Project = { id: string; name: string };

const PRI_STYLE: Record<string, React.CSSProperties> = {
  high: { background: "#ffe0d6", color: "#c95938" },
  medium: { background: "#f0ece2", color: "#6f777f" },
  low: { background: "#e4f0df", color: "#2d6325" },
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function toLocalDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getTaskDateKey(dueDate: string | null): string | null {
  if (!dueDate) return null;
  const d = new Date(dueDate);
  if (isNaN(d.getTime())) return null;
  return toLocalDateString(d);
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  
  // Navigation & View Mode
  const [mode, setMode] = useState<"calendar" | "list">("calendar");
  const [listView, setListView] = useState<"today" | "week" | "all">("all");
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(() => new Date());

  // Filters
  const [activeCourseFilter, setActiveCourseFilter] = useState<string>("all");
  const [hideCompleted, setHideCompleted] = useState<boolean>(false);

  // Quick Add Bar Form
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [selectedProject, setSelectedProject] = useState("");

  // Modals
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [scheduleForDate, setScheduleForDate] = useState<string | null>(null);
  const [scheduleTaskTitle, setScheduleTaskTitle] = useState("");
  const [schedulePriority, setSchedulePriority] = useState<"low" | "medium" | "high">("medium");
  const [scheduleProjectId, setScheduleProjectId] = useState("");
  const [isSubmittingSchedule, setIsSubmittingSchedule] = useState(false);

  // AI Study Plan Generator Modal
  const [showStudyPlanModal, setShowStudyPlanModal] = useState(false);
  const [studyTopic, setStudyTopic] = useState("");
  const [studyExamDate, setStudyExamDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return toLocalDateString(d);
  });
  const [studyDays, setStudyDays] = useState<number>(5);
  const [studyProjectId, setStudyProjectId] = useState("");
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  const load = () => {
    fetch("/api/tasks").then((r) => r.json()).then((d) => setTasks(d.tasks ?? []));
    fetch("/api/projects").then((r) => r.json()).then((d) => setProjects(d.projects ?? []));
  };

  useEffect(() => { load(); }, []);

  const projectMap = useMemo(() => new Map(projects.map((p) => [p.id, p.name])), [projects]);

  // Senior Product Designer: Academic Velocity Metrics
  const metrics = useMemo(() => {
    const todayStr = toLocalDateString(new Date());
    let dueTodayCount = 0;
    let overdueCount = 0;
    let totalCompleted = 0;
    const upcomingHighPriority: Array<{ task: Task; daysAway: number }> = [];

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    for (const t of tasks) {
      if (t.status === "completed") {
        totalCompleted++;
      } else if (t.dueDate) {
        const taskDate = new Date(t.dueDate);
        taskDate.setHours(0, 0, 0, 0);
        const diffDays = Math.round((taskDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
          dueTodayCount++;
        } else if (diffDays < 0) {
          overdueCount++;
        }

        if (diffDays >= 0 && (t.priority === "high" || /exam|midterm|final|quiz|draft|project/i.test(t.title))) {
          upcomingHighPriority.push({ task: t, daysAway: diffDays });
        }
      }
    }

    upcomingHighPriority.sort((a, b) => a.daysAway - b.daysAway);
    const nextMilestone = upcomingHighPriority[0] ?? null;
    const totalTracked = tasks.length;
    const completionRate = totalTracked > 0 ? Math.round((totalCompleted / totalTracked) * 100) : 100;

    return {
      dueTodayCount,
      overdueCount,
      totalCompleted,
      totalTracked,
      completionRate,
      nextMilestone,
    };
  }, [tasks]);

  // Filter tasks by activeCourseFilter and hideCompleted
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (hideCompleted && t.status === "completed") return false;
      if (activeCourseFilter !== "all" && t.projectId !== activeCourseFilter) return false;
      return true;
    });
  }, [tasks, activeCourseFilter, hideCompleted]);

  // Group filtered tasks by Local Date Key
  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of filteredTasks) {
      const key = getTaskDateKey(t.dueDate);
      if (!key) continue;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    return map;
  }, [filteredTasks]);

  // Create Task from Quick Bar
  async function create() {
    if (!title.trim()) return;
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        dueDate: due || undefined,
        priority,
        projectId: selectedProject || undefined,
      }),
    });
    setTitle("");
    setDue("");
    setPriority("medium");
    setSelectedProject("");
    load();
  }

  // Create Task for a Specific Day (Calendar day click or +)
  async function handleCreateForDate(e: React.FormEvent) {
    e.preventDefault();
    if (!scheduleTaskTitle.trim() || !scheduleForDate) return;
    setIsSubmittingSchedule(true);
    try {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: scheduleTaskTitle.trim(),
          dueDate: scheduleForDate,
          priority: schedulePriority,
          projectId: scheduleProjectId || undefined,
        }),
      });
      setScheduleForDate(null);
      setScheduleTaskTitle("");
      setSchedulePriority("medium");
      setScheduleProjectId("");
      load();
    } finally {
      setIsSubmittingSchedule(false);
    }
  }

  // Toggle Task Completion
  async function toggle(t: Task) {
    const nextStatus = t.status === "completed" ? "todo" : "completed";
    setTasks((prev) =>
      prev.map((item) => (item.id === t.id ? { ...item, status: nextStatus } : item))
    );
    if (selectedTask && selectedTask.id === t.id) {
      setSelectedTask({ ...selectedTask, status: nextStatus });
    }
    await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: t.id, status: nextStatus }),
    });
    load();
  }

  // Update Task Properties (Reschedule, Priority, Project)
  async function updateTask(t: Task, updates: { dueDate?: string | null; priority?: "low" | "medium" | "high"; projectId?: string | null }) {
    await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: t.id, ...updates }),
    });
    setSelectedTask(null);
    load();
  }

  // Delete Task
  async function handleConfirmDelete() {
    if (!taskToDelete) return;
    setDeleting(true);
    try {
      await fetch(`/api/tasks?id=${taskToDelete.id}`, { method: "DELETE" });
      setTaskToDelete(null);
      if (selectedTask?.id === taskToDelete.id) {
        setSelectedTask(null);
      }
      load();
    } finally {
      setDeleting(false);
    }
  }

  // AI Study Plan Generator Action
  async function handleGenerateStudyPlan(e: React.FormEvent) {
    e.preventDefault();
    if (!studyTopic.trim() || !studyExamDate) return;
    setIsGeneratingPlan(true);

    try {
      const examDateObj = new Date(studyExamDate);
      const planItems: Array<{ title: string; date: string; priority: "low" | "medium" | "high" }> = [];

      if (studyDays === 3) {
        const d1 = new Date(examDateObj);
        d1.setDate(d1.getDate() - 2);
        const d2 = new Date(examDateObj);
        d2.setDate(d2.getDate() - 1);

        planItems.push(
          { title: `📖 Review core concepts & slides: ${studyTopic}`, date: toLocalDateString(d1), priority: "medium" },
          { title: `✍️ Solve past exam sets & exercises: ${studyTopic}`, date: toLocalDateString(d2), priority: "high" },
          { title: `🎯 Exam Day: ${studyTopic}`, date: toLocalDateString(examDateObj), priority: "high" }
        );
      } else if (studyDays === 7) {
        for (let i = 6; i >= 0; i--) {
          const d = new Date(examDateObj);
          d.setDate(d.getDate() - i);
          const dateStr = toLocalDateString(d);
          if (i === 6) planItems.push({ title: `📑 Syllabus breakdown & summary: ${studyTopic}`, date: dateStr, priority: "low" });
          else if (i === 5) planItems.push({ title: `🔍 Module 1 & 2 in-depth review: ${studyTopic}`, date: dateStr, priority: "medium" });
          else if (i === 4) planItems.push({ title: `🔍 Module 3 & 4 in-depth review: ${studyTopic}`, date: dateStr, priority: "medium" });
          else if (i === 3) planItems.push({ title: `📝 Formula sheet & flashcards drill: ${studyTopic}`, date: dateStr, priority: "medium" });
          else if (i === 2) planItems.push({ title: `⏱️ Full timed practice test: ${studyTopic}`, date: dateStr, priority: "high" });
          else if (i === 1) planItems.push({ title: `💡 Fix weak areas & light review: ${studyTopic}`, date: dateStr, priority: "high" });
          else planItems.push({ title: `🎓 Exam Day: ${studyTopic}`, date: dateStr, priority: "high" });
        }
      } else {
        for (let i = 4; i >= 0; i--) {
          const d = new Date(examDateObj);
          d.setDate(d.getDate() - i);
          const dateStr = toLocalDateString(d);
          if (i === 4) planItems.push({ title: `📖 Chapter summary & lecture notes: ${studyTopic}`, date: dateStr, priority: "medium" });
          else if (i === 3) planItems.push({ title: `🧩 Practice assignments & quiz drill: ${studyTopic}`, date: dateStr, priority: "medium" });
          else if (i === 2) planItems.push({ title: `📝 Formula sheet & memorization: ${studyTopic}`, date: dateStr, priority: "medium" });
          else if (i === 1) planItems.push({ title: `⚡ Full timed mock exam: ${studyTopic}`, date: dateStr, priority: "high" });
          else planItems.push({ title: `🎯 Exam Day: ${studyTopic}`, date: dateStr, priority: "high" });
        }
      }

      await Promise.all(
        planItems.map((item) =>
          fetch("/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: item.title,
              dueDate: item.date,
              priority: item.priority,
              projectId: studyProjectId || undefined,
            }),
          })
        )
      );

      setShowStudyPlanModal(false);
      setStudyTopic("");
      load();
    } finally {
      setIsGeneratingPlan(false);
    }
  }

  // Calendar Grid Days Calculation
  const calendarDays = useMemo(() => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();
    const todayStr = toLocalDateString(new Date());

    const firstDayOfMonth = new Date(year, month, 1);
    const startDayIndex = (firstDayOfMonth.getDay() + 6) % 7;
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const cells: Array<{
      dateKey: string;
      dayNum: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isWeekend: boolean;
      tasks: Task[];
    }> = [];

    // 1. Previous month trailing days
    for (let i = startDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const d = new Date(year, month - 1, dayNum);
      const dateKey = toLocalDateString(d);
      const dayOfWeek = (d.getDay() + 6) % 7;
      cells.push({
        dateKey,
        dayNum,
        isCurrentMonth: false,
        isToday: dateKey === todayStr,
        isWeekend: dayOfWeek >= 5,
        tasks: tasksByDate.get(dateKey) || [],
      });
    }

    // 2. Current month days
    for (let dayNum = 1; dayNum <= daysInCurrentMonth; dayNum++) {
      const d = new Date(year, month, dayNum);
      const dateKey = toLocalDateString(d);
      const dayOfWeek = (d.getDay() + 6) % 7;
      cells.push({
        dateKey,
        dayNum,
        isCurrentMonth: true,
        isToday: dateKey === todayStr,
        isWeekend: dayOfWeek >= 5,
        tasks: tasksByDate.get(dateKey) || [],
      });
    }

    // 3. Next month leading days to complete grid
    const remainingCells = (7 - (cells.length % 7)) % 7;
    const totalTarget = cells.length + remainingCells < 35 ? 35 : cells.length + remainingCells;
    const daysToAdd = totalTarget - cells.length;

    for (let dayNum = 1; dayNum <= daysToAdd; dayNum++) {
      const d = new Date(year, month + 1, dayNum);
      const dateKey = toLocalDateString(d);
      const dayOfWeek = (d.getDay() + 6) % 7;
      cells.push({
        dateKey,
        dayNum,
        isCurrentMonth: false,
        isToday: dateKey === todayStr,
        isWeekend: dayOfWeek >= 5,
        tasks: tasksByDate.get(dateKey) || [],
      });
    }

    return cells;
  }, [currentMonthDate, tasksByDate]);

  // List view filtered tasks
  const shownInList = useMemo(() => {
    const now = new Date();
    const startDay = new Date(now);
    startDay.setHours(0, 0, 0, 0);
    const endWeek = new Date(now);
    endWeek.setDate(endWeek.getDate() + 7);

    return filteredTasks.filter((t) => {
      if (listView === "all") return true;
      if (!t.dueDate) return listView === "today";
      const d = new Date(t.dueDate);
      if (listView === "today") return d.toDateString() === now.toDateString();
      return d >= startDay && d <= endWeek;
    });
  }, [filteredTasks, listView]);

  const monthLabel = currentMonthDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const remaining = tasks.filter((t) => t.status !== "completed").length;
  const monthDeadlinesCount = calendarDays
    .filter((c) => c.isCurrentMonth)
    .reduce((acc, c) => acc + c.tasks.length, 0);

  function prevMonth() {
    setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, 1));
  }
  function nextMonth() {
    setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1));
  }
  function goToToday() {
    setCurrentMonthDate(new Date());
  }

  return (
    <>
      {/* Top Header */}
      <div className="page-head">
        <div>
          <h1>Tasks & planner</h1>
          <p>Schedule academic deadlines, study blocks, and milestones with Notion-grade calendar intelligence.</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            type="button"
            onClick={() => setShowStudyPlanModal(true)}
            className="button"
            style={{
              background: "#fff4f0",
              color: "var(--color-brand)",
              borderColor: "#ffdcd0",
              fontSize: 13,
              padding: "9px 16px",
            }}
          >
            ✦ AI Study Plan
          </button>
          
          <div className="notion-view-switch" role="tablist" aria-label="Planner views">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "calendar"}
              onClick={() => setMode("calendar")}
              className={`notion-view-tab ${mode === "calendar" ? "active" : ""}`}
            >
              📅 Calendar
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "list"}
              onClick={() => setMode("list")}
              className={`notion-view-tab ${mode === "list" ? "active" : ""}`}
            >
              ☰ List
            </button>
          </div>
        </div>
      </div>

      {/* Senior Designer Pulse Strip: 3 Academic Velocity Cards */}
      <div className="academic-pulse-grid">
        <div className="pulse-card">
          <div className="pulse-card-label">
            <span>⚡</span> Today&apos;s Focus
          </div>
          <div className="pulse-card-value">
            {metrics.dueTodayCount > 0 ? (
              <span>{metrics.dueTodayCount} due today</span>
            ) : (
              <span style={{ color: "#2d6325", fontSize: 16 }}>All clear today ✓</span>
            )}
            {metrics.overdueCount > 0 && (
              <span className="tag" style={{ background: "#fee2e2", color: "#dc2626", fontSize: 11, padding: "2px 6px" }}>
                ⚠️ {metrics.overdueCount} overdue
              </span>
            )}
          </div>
          <span className="pulse-card-sub">{remaining} remaining tasks overall</span>
        </div>

        <div className="pulse-card">
          <div className="pulse-card-label">
            <span>🎯</span> Next Major Deadline
          </div>
          <div className="pulse-card-value" style={{ fontSize: 15, lineHeight: 1.3 }}>
            {metrics.nextMilestone ? (
              <div>
                <b style={{ color: "var(--color-brand)" }}>
                  {metrics.nextMilestone.daysAway === 0
                    ? "Due Today!"
                    : metrics.nextMilestone.daysAway === 1
                    ? "Due Tomorrow!"
                    : `In ${metrics.nextMilestone.daysAway} days`}
                </b>
                <div style={{ fontSize: 12.5, color: "var(--color-ink)", fontWeight: 650, marginTop: 2 }}>
                  {metrics.nextMilestone.task.title}
                </div>
              </div>
            ) : (
              <span style={{ color: "var(--color-muted)", fontSize: 14 }}>No upcoming exams tracked</span>
            )}
          </div>
          <span className="pulse-card-sub">AI monitors high-priority dates</span>
        </div>

        <div className="pulse-card">
          <div className="pulse-card-label">
            <span>📈</span> Weekly Momentum
          </div>
          <div className="pulse-card-value">
            {metrics.completionRate}%
            <span style={{ fontSize: 12, color: "var(--color-muted)", fontWeight: 600 }}>
              ({metrics.totalCompleted}/{metrics.totalTracked} done)
            </span>
          </div>
          <div className="pulse-progress-track">
            <div className="pulse-progress-fill" style={{ width: `${metrics.completionRate}%` }} />
          </div>
        </div>
      </div>

      {/* Quick Add Bar with Smart Presets */}
      <div className="panel" style={{ padding: 14, marginBottom: 14 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <label htmlFor="task-title" className="sr-only">Task title</label>
          <input
            id="task-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && create()}
            placeholder="Add task or assignment (e.g., Read Lecture 4 by Friday)…"
            aria-label="Task title"
            style={{ flex: "2 1 200px", height: 40, padding: "0 14px", border: "1px solid var(--color-line)", borderRadius: 10, background: "var(--color-card)" }}
          />

          <label htmlFor="task-due" className="sr-only">Due date</label>
          <input
            id="task-due"
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            aria-label="Due date"
            style={{ flex: "1 1 120px", height: 40, padding: "0 10px", border: "1px solid var(--color-line)", borderRadius: 10, background: "var(--color-card)", fontSize: 12 }}
          />

          <label htmlFor="task-priority" className="sr-only">Priority</label>
          <select
            id="task-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as "low" | "medium" | "high")}
            aria-label="Task priority"
            style={{ flex: "1 1 110px", height: 40, padding: "0 10px", border: "1px solid var(--color-line)", borderRadius: 10, background: "var(--color-card)", fontSize: 12 }}
          >
            <option value="low">🟢 Low</option>
            <option value="medium">🟡 Medium</option>
            <option value="high">🔴 High (Exam)</option>
          </select>

          <label htmlFor="task-project" className="sr-only">Project</label>
          <select
            id="task-project"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            aria-label="Link to project"
            style={{ flex: "1 1 120px", height: 40, padding: "0 10px", border: "1px solid var(--color-line)", borderRadius: 10, background: "var(--color-card)", fontSize: 12 }}
          >
            <option value="">No Course</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <button className="button" onClick={create} style={{ height: 40, padding: "0 18px", fontSize: 13 }}>
            + Add task
          </button>
        </div>
      </div>

      {/* Course & Visibility Filter Strip */}
      <div className="subject-filter-strip">
        <span style={{ fontSize: 11, fontWeight: 750, color: "var(--color-muted)", textTransform: "uppercase", marginRight: 4 }}>
          Filter:
        </span>
        <button
          type="button"
          onClick={() => setActiveCourseFilter("all")}
          className={`subject-chip ${activeCourseFilter === "all" ? "active" : ""}`}
        >
          All Subjects ({tasks.length})
        </button>
        {projects.map((p) => {
          const count = tasks.filter((t) => t.projectId === p.id).length;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setActiveCourseFilter(p.id)}
              className={`subject-chip ${activeCourseFilter === p.id ? "active" : ""}`}
            >
              📁 {p.name} ({count})
            </button>
          );
        })}

        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          <button
            type="button"
            onClick={() => setHideCompleted(!hideCompleted)}
            className={`subject-chip ${hideCompleted ? "active" : ""}`}
            title="Toggle completed items visibility"
          >
            {hideCompleted ? "✓ Showing Active Only" : "👁 Include Completed"}
          </button>
        </div>
      </div>

      {/* Mode: CALENDAR VIEW */}
      {mode === "calendar" ? (
        <section className="calendar-card">
          {/* Calendar Toolbar */}
          <div className="calendar-header">
            <div className="calendar-nav-group">
              <h2 className="calendar-month-title">{monthLabel}</h2>
              <button
                type="button"
                onClick={prevMonth}
                className="calendar-nav-btn"
                aria-label="Previous month"
                title="Previous month"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={goToToday}
                className="calendar-today-btn"
              >
                Today
              </button>
              <button
                type="button"
                onClick={nextMonth}
                className="calendar-nav-btn"
                aria-label="Next month"
                title="Next month"
              >
                ›
              </button>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span className="tag" style={{ fontSize: 11 }}>
                📅 {monthDeadlinesCount} deadlines this month
              </span>
              <span className="tag" style={{ fontSize: 11, background: "#f0ece2" }}>
                ◈ {remaining} open tasks
              </span>
            </div>
          </div>

          {/* Weekdays Header */}
          <div className="calendar-weekdays">
            {WEEKDAYS.map((w, idx) => (
              <div key={w} className={`calendar-weekday ${idx >= 5 ? "is-weekend" : ""}`}>
                {w}
              </div>
            ))}
          </div>

          {/* Calendar Day Grid */}
          <div className="calendar-grid">
            {calendarDays.map((cell) => (
              <div
                key={cell.dateKey}
                className={`calendar-cell ${!cell.isCurrentMonth ? "other-month" : ""} ${cell.isToday ? "today" : ""} ${cell.isWeekend ? "is-weekend" : ""}`}
                onClick={() => {
                  setScheduleForDate(cell.dateKey);
                  setScheduleTaskTitle("");
                }}
              >
                <div className="calendar-cell-top">
                  <span className={`calendar-day-num ${cell.isToday ? "is-today" : ""}`}>
                    {cell.dayNum}
                  </span>
                  <button
                    type="button"
                    className="calendar-add-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setScheduleForDate(cell.dateKey);
                      setScheduleTaskTitle("");
                    }}
                    title={`Schedule task on ${cell.dateKey}`}
                    aria-label={`Schedule task on ${cell.dateKey}`}
                  >
                    +
                  </button>
                </div>

                <div className="calendar-tasks-list">
                  {cell.tasks.slice(0, 3).map((t) => {
                    const isDone = t.status === "completed";
                    return (
                      <div
                        key={t.id}
                        className={`calendar-task-chip ${t.priority} ${isDone ? "completed" : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTask(t);
                        }}
                        title={`${t.title} (${t.priority} priority)`}
                      >
                        {/* Instant Checkbox */}
                        <span
                          className="calendar-task-check"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggle(t);
                          }}
                          title={isDone ? "Mark as Incomplete" : "Mark as Completed"}
                        >
                          {isDone ? "✓" : ""}
                        </span>

                        {/* Priority Dot */}
                        <span className={`priority-indicator-dot ${t.priority}`} />

                        {/* Task Title */}
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{t.title}</span>
                      </div>
                    );
                  })}
                  {cell.tasks.length > 3 && (
                    <div
                      className="calendar-more-chip"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMode("list");
                        setListView("all");
                      }}
                    >
                      +{cell.tasks.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        /* Mode: LIST VIEW */
        <>
          <div className="filter-pills" role="tablist" aria-label="Planner filters">
            {(["today", "week", "all"] as const).map((v) => (
              <button
                key={v}
                role="tab"
                aria-selected={listView === v}
                onClick={() => setListView(v)}
                className={listView === v ? "on" : ""}
              >
                {v === "all" ? "All tasks" : v[0].toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>

          <section className="panel">
            <div className="panel-head">
              <h2>{listView === "today" ? "Today" : listView === "week" ? "This week" : "All tasks"} · {remaining} tasks remaining</h2>
              <span className="tag">{shownInList.length} shown</span>
            </div>

            {shownInList.length === 0 && (
              <p style={{ fontSize: 13, color: "var(--color-muted)", padding: 12 }}>
                Nothing here. Add tasks above, switch to the Calendar view, or generate an AI Study Plan.
              </p>
            )}

            {shownInList.map((t) => {
              const projectName = t.projectId ? projectMap.get(t.projectId) : null;
              return (
                <div key={t.id} className="list-row" style={{ alignItems: "center" }}>
                  <button
                    onClick={() => toggle(t)}
                    aria-label={t.status === "completed" ? `Reopen ${t.title}` : `Complete ${t.title}`}
                    className={`check${t.status === "completed" ? " done" : ""}`}
                    style={{ cursor: "pointer", background: "none" }}
                  >
                    {t.status === "completed" ? "✓" : ""}
                  </button>

                  <div className="grow" style={{ cursor: "pointer" }} onClick={() => setSelectedTask(t)}>
                    <b style={t.status === "completed" ? { textDecoration: "line-through", color: "var(--color-muted)" } : {}}>
                      {t.title}
                    </b>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 2 }}>
                      <small>{t.dueDate ? `Due ${new Date(t.dueDate).toLocaleDateString()}` : "No due date"}{t.status === "completed" ? " · Done" : ""}</small>
                      {projectName && (
                        <span className="tag" style={{ fontSize: 10, padding: "2px 6px" }}>
                          📁 {projectName}
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="tag" style={PRI_STYLE[t.priority] ?? {}}>
                    {t.status === "completed" ? "Done" : t.priority}
                  </span>

                  <button
                    type="button"
                    onClick={() => setTaskToDelete(t)}
                    aria-label={`Delete ${t.title}`}
                    style={{
                      background: "none",
                      border: 0,
                      cursor: "pointer",
                      color: "var(--color-muted)",
                      padding: "4px 8px",
                      fontSize: 14,
                      fontWeight: 700,
                      borderRadius: 6,
                    }}
                    title="Delete task"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </section>
        </>
      )}

      {/* Task Details & Reschedule Modal */}
      <Dialog
        isOpen={Boolean(selectedTask)}
        onClose={() => setSelectedTask(null)}
        title="Task details"
        description="Inspect, reschedule, or update this task in your study calendar."
        maxWidth={460}
      >
        {selectedTask && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--color-muted)", marginBottom: 4 }}>
                Task Title
              </label>
              <p style={{
                fontSize: 15,
                fontWeight: 650,
                color: "var(--color-ink)",
                margin: 0,
                textDecoration: selectedTask.status === "completed" ? "line-through" : "none",
              }}>
                {selectedTask.title}
              </p>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button
                type="button"
                onClick={() => toggle(selectedTask)}
                className="button"
                style={{
                  padding: "8px 14px",
                  fontSize: 12,
                  background: selectedTask.status === "completed" ? "#f0ece2" : "var(--color-ink)",
                  color: selectedTask.status === "completed" ? "var(--color-ink)" : "#ffffff",
                }}
              >
                {selectedTask.status === "completed" ? "↺ Mark as Incomplete" : "✓ Mark as Completed"}
              </button>
              <span className="tag" style={PRI_STYLE[selectedTask.priority] ?? {}}>
                {selectedTask.priority.toUpperCase()} priority
              </span>
              {selectedTask.projectId && (
                <span className="tag" style={{ fontSize: 11 }}>
                  📁 {projectMap.get(selectedTask.projectId) ?? "Project"}
                </span>
              )}
            </div>

            <hr style={{ border: 0, borderTop: "1px solid var(--color-line)", margin: "4px 0" }} />

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--color-ink)", marginBottom: 6 }}>
                Reschedule Date
              </label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                <button
                  type="button"
                  onClick={() => updateTask(selectedTask, { dueDate: toLocalDateString(new Date()) })}
                  className="tag"
                  style={{ cursor: "pointer" }}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const tmrw = new Date();
                    tmrw.setDate(tmrw.getDate() + 1);
                    updateTask(selectedTask, { dueDate: toLocalDateString(tmrw) });
                  }}
                  className="tag"
                  style={{ cursor: "pointer" }}
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const nextWk = new Date();
                    nextWk.setDate(nextWk.getDate() + 7);
                    updateTask(selectedTask, { dueDate: toLocalDateString(nextWk) });
                  }}
                  className="tag"
                  style={{ cursor: "pointer" }}
                >
                  Next Week
                </button>
              </div>

              <input
                type="date"
                defaultValue={selectedTask.dueDate ? toLocalDateString(new Date(selectedTask.dueDate)) : ""}
                onChange={(e) => updateTask(selectedTask, { dueDate: e.target.value || null })}
                className="dialog-input"
                style={{ marginBottom: 0 }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
              <button
                type="button"
                onClick={() => {
                  setTaskToDelete(selectedTask);
                  setSelectedTask(null);
                }}
                style={{
                  background: "none",
                  border: 0,
                  color: "#d93829",
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  padding: 4,
                }}
              >
                Delete task
              </button>

              <button
                type="button"
                onClick={() => setSelectedTask(null)}
                className="button secondary"
                style={{ padding: "8px 16px", fontSize: 12.5 }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Quick Schedule for Date Modal */}
      <Dialog
        isOpen={Boolean(scheduleForDate)}
        onClose={() => setScheduleForDate(null)}
        title="Schedule task"
        description={scheduleForDate ? `Add a task for ${new Date(scheduleForDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}` : "Add a task"}
        maxWidth={440}
      >
        <form onSubmit={handleCreateForDate}>
          <label htmlFor="schedule-task-title" style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
            Task title
          </label>
          <input
            id="schedule-task-title"
            value={scheduleTaskTitle}
            onChange={(e) => setScheduleTaskTitle(e.target.value)}
            placeholder="e.g., Read Lecture 4 notes, Submit Lab 2…"
            autoFocus
            className="dialog-input"
            required
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            <div>
              <label htmlFor="schedule-priority" style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                Priority
              </label>
              <select
                id="schedule-priority"
                value={schedulePriority}
                onChange={(e) => setSchedulePriority(e.target.value as "low" | "medium" | "high")}
                className="dialog-input"
                style={{ marginBottom: 0 }}
              >
                <option value="low">Low priority</option>
                <option value="medium">Medium priority</option>
                <option value="high">High priority</option>
              </select>
            </div>

            <div>
              <label htmlFor="schedule-project" style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                Project / Course
              </label>
              <select
                id="schedule-project"
                value={scheduleProjectId}
                onChange={(e) => setScheduleProjectId(e.target.value)}
                className="dialog-input"
                style={{ marginBottom: 0 }}
              >
                <option value="">No project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="dialog-actions">
            <button
              type="button"
              onClick={() => setScheduleForDate(null)}
              className="dialog-btn-cancel"
              disabled={isSubmittingSchedule}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="dialog-btn-confirm brand"
              disabled={isSubmittingSchedule || !scheduleTaskTitle.trim()}
            >
              {isSubmittingSchedule ? "Scheduling…" : "Schedule task"}
            </button>
          </div>
        </form>
      </Dialog>

      {/* AI Study Plan Generator Modal */}
      <Dialog
        isOpen={showStudyPlanModal}
        onClose={() => setShowStudyPlanModal(false)}
        title="✦ AI Study Plan Generator"
        description="Let Study Coach automatically break down and schedule revision sessions across your calendar."
        maxWidth={480}
      >
        <form onSubmit={handleGenerateStudyPlan}>
          <label htmlFor="study-topic" style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
            Exam, Course or Subject Topic
          </label>
          <input
            id="study-topic"
            value={studyTopic}
            onChange={(e) => setStudyTopic(e.target.value)}
            placeholder="e.g. Operating Systems Finals, Organic Chemistry Quiz…"
            autoFocus
            className="dialog-input"
            required
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            <div>
              <label htmlFor="study-exam-date" style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                Target Exam / Due Date
              </label>
              <input
                id="study-exam-date"
                type="date"
                value={studyExamDate}
                onChange={(e) => setStudyExamDate(e.target.value)}
                className="dialog-input"
                style={{ marginBottom: 0 }}
                required
              />
            </div>

            <div>
              <label htmlFor="study-days" style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                Prep Duration
              </label>
              <select
                id="study-days"
                value={studyDays}
                onChange={(e) => setStudyDays(Number(e.target.value))}
                className="dialog-input"
                style={{ marginBottom: 0 }}
              >
                <option value={3}>3-Day Sprint</option>
                <option value={5}>5-Day Balanced</option>
                <option value={7}>7-Day Deep Dive</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <label htmlFor="study-project" style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
              Link to Project / Course (optional)
            </label>
            <select
              id="study-project"
              value={studyProjectId}
              onChange={(e) => setStudyProjectId(e.target.value)}
              className="dialog-input"
              style={{ marginBottom: 0 }}
            >
              <option value="">None</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="dialog-actions">
            <button
              type="button"
              onClick={() => setShowStudyPlanModal(false)}
              className="dialog-btn-cancel"
              disabled={isGeneratingPlan}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="dialog-btn-confirm brand"
              disabled={isGeneratingPlan || !studyTopic.trim() || !studyExamDate}
            >
              {isGeneratingPlan ? "Generating Schedule…" : "✦ Generate & Schedule"}
            </button>
          </div>
        </form>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={Boolean(taskToDelete)}
        onClose={() => setTaskToDelete(null)}
        onConfirm={handleConfirmDelete}
        title={`Delete "${taskToDelete?.title}"?`}
        description="Are you sure you want to delete this task from your workspace planner? This action cannot be undone."
        confirmText="Delete Task"
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
      />
    </>
  );
}
