import { db } from "@/lib/db";
import { notify } from "@/lib/notifications";
import { decryptToken } from "@/lib/integrations/crypto";
import { listClassroomCourses } from "@/lib/integrations/classroom";

export async function syncClassroomTasks(ownerId: string) {
  const account = await db.integrationAccount.findUnique({ where: { ownerId_provider: { ownerId, provider: "classroom" } } });
  if (!account?.accessTokenEncrypted) return { synced: 0, notified: 0 };
  const courses = await listClassroomCourses(decryptToken(account.accessTokenEncrypted));
  let synced = 0;
  let notified = 0;
  for (const course of courses) {
    for (const item of course.assignments) {
      const title = `${item.title} · ${course.name}`;
      const existing = await db.task.findFirst({ where: { ownerId, externalProvider: "classroom", externalId: item.id } });
      const dueDate = item.dueDate ? new Date(item.dueDate) : null;
      const task = existing
        ? await db.task.update({ where: { id: existing.id }, data: { title, dueDate, externalUrl: item.link, externalStatus: item.status, ...(item.status === "completed" ? { status: "completed", completedAt: existing.completedAt ?? new Date() } : {}) } })
        : await db.task.create({ data: { ownerId, title, dueDate, priority: item.status === "overdue" ? "high" : "medium", status: item.status === "completed" ? "completed" : "todo", completedAt: item.status === "completed" ? new Date() : null, externalProvider: "classroom", externalId: item.id, externalUrl: item.link, externalStatus: item.status } });
      synced += 1;
      if (item.status === "due_soon" || item.status === "overdue" || item.status === "pending") {
        const kind = item.status === "overdue" ? "classroom_overdue" : item.status === "due_soon" ? "classroom_due_soon" : "classroom_pending";
        const result = await notify(ownerId, { kind, title: `${item.status === "overdue" ? "Overdue" : item.status === "due_soon" ? "Due soon" : "Pending"}: ${item.title}`, body: `From ${course.name}. Open it to make a focused plan.`, link: "/app/tasks", groupedKey: `classroom:${item.id}:${item.status}` });
        if (result) notified += 1;
      }
      void task;
    }
  }
  return { synced, notified };
}
