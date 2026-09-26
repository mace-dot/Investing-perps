"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Composer } from "@/components/composer";

function CreateInner() {
  const params = useSearchParams();
  const edit = params.get("edit") ?? undefined;
  return <Composer editId={edit} />;
}

export default function CreatePage() {
  return (
    <Suspense fallback={<p role="status">Loading the composer</p>}>
      <CreateInner />
    </Suspense>
  );
}
