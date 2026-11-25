import { getClientSession } from "@/lib/client-auth";
import { getClientPortalData } from "@/lib/agency-db";
import ClientLoginView from "./ClientLoginView";
import ClientPortalDashboard from "./ClientPortalDashboard";

export const dynamic = "force-dynamic";

export default async function ClientPortalPage() {
  const session = await getClientSession();
  if (!session) {
    return <ClientLoginView />;
  }

  const data = await getClientPortalData(session.email);

  return (
    <ClientPortalDashboard
      clientEmail={session.email}
      clientName={session.name}
      mustChangePassword={session.mustChangePassword}
      orders={data.orders}
      stages={data.stages}
      files={data.files}
      surveys={data.surveys}
    />
  );
}
