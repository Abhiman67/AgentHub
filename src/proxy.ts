import { auth } from "@/auth";

export default auth;

export const config = {
  matcher: ["/app/:path*", "/onboarding"],
};
