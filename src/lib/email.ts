export async function sendPasswordResetEmail(to: string, token: string, origin: string) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) return false;
  const resetUrl = `${origin}/forgot-password?token=${encodeURIComponent(token)}`;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject: "Reset your AgentHub password", text: `Reset your password: ${resetUrl}\n\nThis link expires in 30 minutes.` }),
  });
  return response.ok;
}

export async function sendWorkspaceInviteEmail(to: string, token: string, origin: string, workspaceName: string) {
  const key = process.env.RESEND_API_KEY; const from = process.env.EMAIL_FROM;
  if (!key || !from) return false;
  const inviteUrl = `${origin}/invite/accept?token=${encodeURIComponent(token)}`;
  const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify({ from, to: [to], subject: `Invitation to ${workspaceName}`, text: `You have been invited to join ${workspaceName} on AgentHub. Accept your invitation: ${inviteUrl}\n\nThis invitation expires in 7 days.` }) });
  return response.ok;
}
