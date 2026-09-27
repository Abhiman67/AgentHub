export const MIN_SCOPES: Record<string, string[]> = {
  drive: ["drive.readonly"],
  classroom: ["classroom.courses.readonly"],
  calendar: ["calendar.readonly", "calendar.events"],
  github: ["repo:read"],
  notion: ["read"],
  gmail: ["gmail.compose"],
};
