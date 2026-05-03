export default function SuitePage() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold">PayAid Suite</h1>
      <p className="mt-2 text-slate-600">
        Main shell and module switcher. Navigate to CRM, Finance, HR, Marketing, AI Co-Founder, Settings, and other modules via tenant_modules.
      </p>
      <ul className="mt-4 list-disc list-inside space-y-1 text-sm">
        <li>CRM: /crm (or apps/crm)</li>
        <li>Finance: /finance</li>
        <li>HR: /hr</li>
        <li>Settings: /settings</li>
        <li>App Store: /app-store</li>
      </ul>
    </main>
  );
}
