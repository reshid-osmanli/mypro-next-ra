"use client";

import { RefreshCw } from "lucide-react";
import { useSitePreferences } from "@/components/site-preferences";
import { Button } from "@/components/ui/button";

export function RetryDownloadButton() {
  const { text } = useSitePreferences();

  return (
    <Button type="button" onClick={() => window.location.reload()} variant="danger" size="md">
      <RefreshCw size={15} aria-hidden="true" />
      {text({ ar: "لم يتم التنزيل اضغط هنا للمحاولة مرة أخرى", en: "Download did not start. Click to retry." })}
    </Button>
  );
}
