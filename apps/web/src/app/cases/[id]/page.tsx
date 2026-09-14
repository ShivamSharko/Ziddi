import { CaseDetailView } from "@/components/case-detail";

export default async function CasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CaseDetailView caseId={id} />;
}

