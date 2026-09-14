import { CaseList } from "@/components/case-list";
import { EscalationButton } from "@/components/escalation-button";

export default function CasesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Your Cases</h1>
        <p className="text-sm text-gray-500 mt-1">
          Track all your active grievances and their status
        </p>
      </div>

      <EscalationButton />

      <CaseList />
    </div>
  );
}

