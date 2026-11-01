import { z } from "zod";
import { db } from "@/lib/db";
import type { AgentTool } from "../types";

const dueDateSchema = z
  .string()
  .optional()
  .refine((v) => !v || !Number.isNaN(Date.parse(v)), "Invalid due date");

export const createTaskInputSchema = z.object({
  title: z.string().min(1).max(200),
  projectId: z.string().min(1).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  dueDate: dueDateSchema,
});

export type CreateTaskOutput = { taskId: string; title: string; status: string };

export const createTaskTool: AgentTool<z.infer<typeof createTaskInputSchema>, CreateTaskOutput> = {
  name: "create_task",
  description: "Create a task (approval-gated)",
  risk: "workspace_write",
  inputSchema: createTaskInputSchema,
  execute: async (input, ctx) => {
    if (input.projectId) {
      const p = await db.project.findFirst({ where: { id: input.projectId, ownerId: ctx.ownerId }, select: { id: true } });
      if (!p) throw new Error("Project not found");
    }
    const t = await db.task.create({
      data: {
        ownerId: ctx.ownerId,
        title: input.title.slice(0, 200),
        projectId: input.projectId,
        priority: input.priority ?? "medium",
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        agentId: ctx.agentId,
      },
    });
    return { taskId: t.id, title: t.title, status: t.status };
  },
};

export const updateTaskTool: AgentTool<{ taskId: string; status?: string; title?: string }, { id: string; status: string }> = {
  name: "update_task",
  description: "Update own task (approval-gated)",
  risk: "workspace_write",
  inputSchema: z.object({
    taskId: z.string().min(1),
    status: z.enum(["todo", "in_progress", "completed", "cancelled"]).optional(),
    title: z.string().min(1).max(200).optional(),
  }),
  execute: async (input, ctx) => {
    const existing = await db.task.findFirst({ where: { id: input.taskId, ownerId: ctx.ownerId } });
    if (!existing) throw new Error("Task not found");
    const updated = await db.task.update({
      where: { id: input.taskId },
      data: {
        ...(input.title ? { title: input.title.slice(0, 200) } : {}),
        ...(input.status ? { status: input.status, completedAt: input.status === "completed" ? new Date() : null } : {}),
      },
    });
    return { id: updated.id, status: updated.status };
  },
};
