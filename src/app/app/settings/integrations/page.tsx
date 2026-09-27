import { IntegrationsPanel } from "@/components/IntegrationsPanel";

export default function IntegrationsSettingsPage() {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", paddingBottom: 40 }}>
      <div className="page-head">
        <div>
          <h1>Connected integrations</h1>
          <p>Read-only by default. Drafts never send without approval.</p>
        </div>
      </div>
      <IntegrationsPanel />
    </div>
  );
}
