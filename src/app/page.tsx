import { getAdminSession, isAuthConfigured } from "@/lib/auth";
import AdminLogin from "./AdminLogin";
import MiamSignDashboard from "./MiamSignDashboard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getAdminSession();
  if (!session) {
    return <AdminLogin configured={isAuthConfigured()} />;
  }
  return <MiamSignDashboard userEmail={session.email} />;
}
