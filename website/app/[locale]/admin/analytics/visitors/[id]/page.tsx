"use client";

import { use } from "react";
import { VisitorInspector } from "./_components/visitor-inspector";

export default function AdminVisitorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <VisitorInspector visitorId={id} />;
}
