import { z } from "zod";
import { db } from "@/lib/db";
import type { AgentTool, ToolContext } from "./types";
import { createTaskTool, updateTaskTool } from "./internal/tasks";

const getProfileTool: AgentTool<Record<string, never>, Record<string, unknown>> = {
  name: "get_profile",
  description: "Read own student profile",
  risk: "read_only",
  inputSchema: z.object({}),
  execute: async (_input, ctx) => {
    const p = await db.profile.findUnique({ where: { userId: ctx.ownerId } });
    return { institution: p?.institution ?? null, degree: p?.degree ?? null, careerTarget: p?.careerTarget ?? null };
  },
};

const searchFilesTool: AgentTool<{ query: string }, { id: string; name: string }[]> = {
  name: "search_files",
  description: "Search own ready files by name",
  risk: "read_only",
  inputSchema: z.object({ query: z.string().min(1).max(200) }),
  execute: async (input, ctx) => {
    const files = await db.file.findMany({ where: { ownerId: ctx.ownerId, status: "ready" }, take: 20 });
    const q = input.query.toLowerCase();
    return files
      .filter((f) => f.name.toLowerCase().includes(q) || f.textContent.toLowerCase().includes(q))
      .slice(0, 5)
      .map((f) => ({ id: f.id, name: f.name }));
  },
};

const getFileMetadataTool: AgentTool<{ fileId: string }, { id: string; name: string; status: string }> = {
  name: "get_file_metadata",
  description: "Read own file metadata",
  risk: "read_only",
  inputSchema: z.object({ fileId: z.string().min(1) }),
  execute: async (input, ctx) => {
    const f = await db.file.findFirst({ where: { id: input.fileId, ownerId: ctx.ownerId } });
    if (!f) throw new Error("File not found");
    return { id: f.id, name: f.name, status: f.status };
  },
};

const getProjectTool: AgentTool<{ projectId: string }, Record<string, unknown>> = {
  name: "get_project",
  description: "Read own project",
  risk: "read_only",
  inputSchema: z.object({ projectId: z.string().min(1) }),
  execute: async (input, ctx) => {
    const p = await db.project.findFirst({ where: { id: input.projectId, ownerId: ctx.ownerId } });
    if (!p) throw new Error("Project not found");
    return { id: p.id, name: p.name, status: p.status, description: p.description.slice(0, 500) };
  },
};

const getProjectTasksTool: AgentTool<{ projectId: string }, { id: string; title: string; status: string }[]> = {
  name: "get_project_tasks",
  description: "List own project tasks",
  risk: "read_only",
  inputSchema: z.object({ projectId: z.string().min(1) }),
  execute: async (input, ctx) => {
    const p = await db.project.findFirst({ where: { id: input.projectId, ownerId: ctx.ownerId }, select: { id: true } });
    if (!p) throw new Error("Project not found");
    const tasks = await db.task.findMany({ where: { projectId: input.projectId, ownerId: ctx.ownerId }, take: 20 });
    return tasks.map((t) => ({ id: t.id, title: t.title, status: t.status }));
  },
};

const createProjectTool: AgentTool<{ name: string; description?: string }, { id: string; name: string }> = {
  name: "create_project",
  description: "Create a project (approval-gated)",
  risk: "workspace_write",
  inputSchema: z.object({ name: z.string().min(1).max(100), description: z.string().max(2000).optional() }),
  execute: async (input, ctx) => {
    const p = await db.project.create({ data: { ownerId: ctx.ownerId, name: input.name.slice(0, 100), description: input.description?.slice(0, 2000) ?? "" } });
    return { id: p.id, name: p.name };
  },
};

const updateProjectTool: AgentTool<{ projectId: string; name?: string; status?: string }, { id: string }> = {
  name: "update_project",
  description: "Update own project (approval-gated)",
  risk: "workspace_write",
  inputSchema: z.object({
    projectId: z.string().min(1),
    name: z.string().min(1).max(100).optional(),
    status: z.enum(["active", "completed", "archived", "paused"]).optional(),
  }),
  execute: async (input, ctx) => {
    const existing = await db.project.findFirst({ where: { id: input.projectId, ownerId: ctx.ownerId }, select: { id: true } });
    if (!existing) throw new Error("Project not found");
    const updated = await db.project.update({ where: { id: input.projectId }, data: { ...(input.name ? { name: input.name } : {}), ...(input.status ? { status: input.status } : {}) } });
    return { id: updated.id };
  },
};

const attachFileTool: AgentTool<{ projectId: string; fileId: string }, { ok: boolean }> = {
  name: "attach_file_to_project",
  description: "Link own file to own project (approval-gated)",
  risk: "workspace_write",
  inputSchema: z.object({ projectId: z.string().min(1), fileId: z.string().min(1) }),
  execute: async (input, ctx) => {
    const [p, f] = await Promise.all([
      db.project.findFirst({ where: { id: input.projectId, ownerId: ctx.ownerId } }),
      db.file.findFirst({ where: { id: input.fileId, ownerId: ctx.ownerId } }),
    ]);
    if (!p || !f) throw new Error("Project or file not found");
    return { ok: true };
  },
};

const createDraftTool: AgentTool<{ title: string; body: string }, { draft: string }> = {
  name: "create_draft",
  description: "Create a text draft, never send",
  risk: "draft_only",
  inputSchema: z.object({ title: z.string().min(1).max(160), body: z.string().min(1).max(4000) }),
  execute: async (input) => ({ draft: `${input.title}\n\n${input.body.slice(0, 2000)}` }),
};

const createApprovalTool: AgentTool<{ title: string; description?: string }, { id: string }> = {
  name: "create_approval",
  description: "Request human approval",
  risk: "read_only",
  inputSchema: z.object({ title: z.string().min(1).max(160), description: z.string().max(2000).optional() }),
  execute: async (input, ctx) => {
    const a = await db.approval.create({
      data: { ownerId: ctx.ownerId, agentId: ctx.agentId, title: input.title, description: input.description ?? "", runId: ctx.runId },
    });
    return { id: a.id };
  },
};

export const INTERNAL_TOOLS = [
  getProfileTool,
  searchFilesTool,
  getFileMetadataTool,
  getProjectTool,
  getProjectTasksTool,
  createTaskTool,
  updateTaskTool,
  createProjectTool,
  updateProjectTool,
  attachFileTool,
  createDraftTool,
  createApprovalTool,
];

export const TOOL_MAP = new Map(INTERNAL_TOOLS.map((t) => [t.name, t]));
