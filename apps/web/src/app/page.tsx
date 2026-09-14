import { IntakeChat } from "@/components/intake-chat";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">
          Your grievance won&apos;t get solved until someone <span className="text-[var(--primary)]">ziddi</span> follows up.
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl">
          Ziddi handles the chasing, escalating, and deadline-hitting — for potholes, deposits, RTIs, and refunds.
          You approve the drafts. We do the rest.
        </p>
      </section>

      <IntakeChat />

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8">
        <div className="border border-[var(--border)] rounded-lg p-4">
          <div className="text-2xl mb-2">📸</div>
          <h3 className="font-semibold mb-1">Evidence-First</h3>
          <p className="text-sm text-gray-600">Upload receipts, UPI screenshots, photos. We build your proof vault.</p>
        </div>
        <div className="border border-[var(--border)] rounded-lg p-4">
          <div className="text-2xl mb-2">⏰</div>
          <h3 className="font-semibold mb-1">SLA Tracking</h3>
          <p className="text-sm text-gray-600">Every Indian grievance has a legal deadline. We count down and escalate.</p>
        </div>
        <div className="border border-[var(--border)] rounded-lg p-4">
          <div className="text-2xl mb-2">🔒</div>
          <h3 className="font-semibold mb-1">You Approve</h3>
          <p className="text-sm text-gray-600">Agent drafts, human approves. Never auto-filed without you.</p>
        </div>
      </section>
    </div>
  );
}

