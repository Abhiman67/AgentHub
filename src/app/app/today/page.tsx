import { redirect } from "next/navigation";

/** Canonical Today route (spec §3.2); the Today dashboard lives at /app. */
export default function TodayPage() {
  redirect("/app");
}
