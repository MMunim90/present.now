// src/components/layout/SaveStatus.jsx
import React from "react";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";

export default function SaveStatus({ status }) {
  if (status === "saving") {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
        <Loader2 size={13} className="animate-spin" />{" "}
        <span className="hidden md:inline">Saving…</span>
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-red-500">
        <AlertCircle size={13} />{" "}
        <span className="hidden md:inline">Save failed</span>
      </span>
    );
  }
  if (status === "saved") {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
        <CheckCircle2 size={13} className="text-emerald-500" />{" "}
        <span className="hidden md:inline">Saved locally</span>
      </span>
    );
  }
  // Explicit fallback: an unrecognized status must never silently render as
  // "Saved locally" (only the exact 'saved' state does).
  return null;
}
