"use client";

import { Suspense } from "react";
import ProtectedPageInner from "./ProtectedPageInner";

export default function ProtectedPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <ProtectedPageInner />
    </Suspense>
  );
}
