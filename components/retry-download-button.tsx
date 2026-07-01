"use client";

import { RefreshCw } from "lucide-react";
import { useSitePreferences } from "./site-preferences";

export function RetryDownloadButton() {
  const { text } = useSitePreferences();

  return (
    <button
      type="button"
      onClick={() => window.location.reload()}
      className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 transition-colors"
    >
      <RefreshCw size={16} />
      {text({ ar: "لم يتم التنزيل اضغط هنا للمحاولة مرة أخرى", en: "Download did not start. Click to retry." })}
    </button>
  );
}
