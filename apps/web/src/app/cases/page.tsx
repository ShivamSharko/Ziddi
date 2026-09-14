import { CaseList } from "@/components/case-list";

export default function CasesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Cases</h1>
        <a
          href="/"
          className="px-4 py-2 bg-[var(--primary)] text-white rounded-md hover:opacity-90 text-sm"
        >
          + New Case
        </a>
      </div>
      <CaseList />
    </div>
  );
}

