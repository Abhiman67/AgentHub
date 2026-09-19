import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const profileSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  institution: z.string().max(160).optional(),
  degree: z.string().max(160).optional(),
  semester: z.string().max(40).optional(),
  goals: z.array(z.string().max(80)).max(20).optional(),
  subjects: z.array(z.string().max(80)).max(30).optional(),
  skills: z.array(z.string().max(80)).max(30).optional(),
  interests: z.array(z.string().max(80)).max(30).optional(),
  studyHours: z.coerce.number().int().min(0).max(24).optional(),
  careerTarget: z.string().max(160).optional(),
  onboardingDone: z.boolean().optional(),
});

export const projectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(2000).optional(),
  type: z.string().max(40).optional(),
  targetDate: z.string().optional().refine((value) => !value || !Number.isNaN(Date.parse(value)), "Invalid target date"),
});

export const projectUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(2000).optional(),
  status: z.enum(["active", "completed", "archived", "paused"]).optional(),
  linkedAgentIds: z.array(z.string().min(1)).max(20).optional(),
  members: z.array(z.string().min(1).max(160)).max(50).optional(),
});

export const taskCreateSchema = z.object({
  title: z.string().min(1).max(200),
  projectId: z.string().optional(),
  dueDate: z.string().optional().refine((value) => !value || !Number.isNaN(Date.parse(value)), "Invalid due date"),
  priority: z.enum(["low", "medium", "high"]).optional(),
  agentId: z.string().optional(),
});

export const taskUpdateSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["todo", "in_progress", "completed", "cancelled"]).optional(),
  title: z.string().min(1).max(200).optional(),
  dueDate: z.string().nullable().optional().refine((value) => !value || !Number.isNaN(Date.parse(value)), "Invalid due date"),
  priority: z.enum(["low", "medium", "high"]).optional(),
  projectId: z.string().nullable().optional(),
});

export const applicationCreateSchema = z.object({
  company: z.string().min(1).max(120),
  role: z.string().min(1).max(120),
  url: z.string().max(500).optional().refine((value) => !value || /^https?:\/\//i.test(value), "URL must use http or https"),
  status: z.enum(["saved", "preparing", "applied", "interviewing", "offer", "rejected"]).optional(),
  notes: z.string().max(2000).optional(),
});

export const applicationUpdateSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["saved", "preparing", "applied", "interviewing", "offer", "rejected"]).optional(),
  notes: z.string().max(2000).optional(),
});

export const approvalCreateSchema = z.object({
  agentId: z.string().max(100).optional(),
  title: z.string().min(1).max(160),
  description: z.string().max(2000).optional(),
});

export const agentCreateSchema = z.object({
  template: z.string().min(1).max(60),
  name: z.string().min(1).max(80).optional(),
  role: z.string().max(120).optional(),
  description: z.string().max(500).optional(),
  category: z.string().max(40).optional(),
  systemPrompt: z.string().max(4000).optional(),
});
