import { CaseList } from "@/components/case-list";
import { EscalationButton } from "@/components/escalation-button";

export default function CasesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-black">Your Cases</h1>
        <p className="mt-1 font-mono-data text-[10px] uppercase tracking-[0.2em] text-[var(--text-2)]">
          Track all your active grievances and their status
        </p>
      </div>

      <EscalationButton />

      <CaseList />
    </div>
  );
}

