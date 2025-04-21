"use client";
import { useEffect, useState } from "react";

export default function DateClient({ iso, className }: { iso: string; className?: string }) {
  const [dateStr, setDateStr] = useState("");
  useEffect(() => {
    const date = new Date(iso);
    setDateStr(date.toLocaleString());
  }, [iso]);
  return <div className={className}>{dateStr}</div>;
}
