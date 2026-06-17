"use client";

import { BarChart3, CheckCircle2, Paperclip, Send } from "lucide-react";
import { useSitePreferences } from "./site-preferences";

type KutubiLogoMotionProps = {
  compact?: boolean;
  className?: string;
};

export function KutubiLogoMotion({ compact = false, className = "" }: KutubiLogoMotionProps) {
  const { text } = useSitePreferences();

  return (
    <div className={`kutubi-logo-motion ${compact ? "kutubi-logo-compact" : ""} ${className}`} aria-label={text({ ar: "شعار كُتبي المتحرك", en: "Animated Kutubi logo" })}>
      <div className="kutubi-ambient kutubi-ambient-a" aria-hidden="true" />
      <div className="kutubi-ambient kutubi-ambient-b" aria-hidden="true" />
      <div className="kutubi-glass-disc" aria-hidden="true" />
      <div className="kutubi-orbit kutubi-orbit-a" />
      <div className="kutubi-orbit kutubi-orbit-b" />
      <span className="kutubi-arc kutubi-arc-a" />
      <span className="kutubi-arc kutubi-arc-b" />
      <span className="kutubi-arc kutubi-arc-c" />
      <span className="kutubi-glint kutubi-glint-a" />
      <span className="kutubi-glint kutubi-glint-b" />
      <span className="kutubi-glint kutubi-glint-c" />
      <span className="kutubi-dot kutubi-dot-a" />
      <span className="kutubi-dot kutubi-dot-b" />
      <span className="kutubi-dot kutubi-dot-c" />
      <span className="kutubi-dot kutubi-dot-d" />
      <span className="kutubi-dot kutubi-dot-e" />
      <span className="kutubi-dot kutubi-dot-f" />

      <div className="kutubi-float-card kutubi-chart-card" aria-hidden="true">
        <BarChart3 size={compact ? 12 : 18} />
      </div>
      <div className="kutubi-float-card kutubi-check-card" aria-hidden="true">
        <CheckCircle2 size={compact ? 12 : 18} />
      </div>
      <div className="kutubi-plane" aria-hidden="true">
        <Send size={compact ? 12 : 22} />
      </div>
      <div className="kutubi-plane-trail" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="kutubi-paper" aria-hidden="true">
        <Paperclip size={compact ? 8 : 13} />
      </div>
      <div className="kutubi-flying-page kutubi-page-a" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="kutubi-flying-page kutubi-page-b" aria-hidden="true">
        <span />
        <span />
      </div>

      <div className="kutubi-mark">
        <div className="kutubi-file">
          <span className="kutubi-file-dot" />
          <span className="kutubi-file-dot" />
          <span className="kutubi-file-dot" />
          <i className="kutubi-file-line kutubi-file-line-a" />
          <i className="kutubi-file-line kutubi-file-line-b" />
          <i className="kutubi-file-line kutubi-file-line-c" />
        </div>
        <div className="kutubi-book">
          <span className="kutubi-book-spine" />
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
      </div>

      {!compact ? (
        <div className="kutubi-name">
          <strong>كُتبي</strong>
          <small>{text({ ar: "عروض بوربوينت وأوراق عمل", en: "PowerPoint decks and worksheets" })}</small>
        </div>
      ) : null}
    </div>
  );
}
