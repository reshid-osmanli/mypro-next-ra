// ============================================================================
// components/seo/seo-head.tsx — Reusable SEO meta + OG + Twitter cards
// ----------------------------------------------------------------------------
// New file: /components/seo/seo-head.tsx
// Use inside layout.tsx with generateMetadata, or as a fallback.
// ============================================================================

import type { Metadata } from "next";
import { resolveSiteUrl } from "@/lib/site-url";

export type SeoInput = {
  title: string;
  description: string;
  canonical?: string;
  image?: string | null;
  type?: "website" | "article" | "product";
  publishedTime?: string;
  modifiedTime?: string;
  locale?: string;
};

export function buildSeoMetadata(input: SeoInput): Metadata {
  const url = resolveSiteUrl() || "https://kutubi.example";
  const canonical = input.canonical ? new URL(input.canonical, url).toString() : undefined;
  const image = input.image ? new URL(input.image, url).toString() : undefined;

  return {
    title: input.title,
    description: input.description,
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      type: input.type === "article" ? "article" : input.type === "product" ? "website" : "website",
      title: input.title,
      description: input.description,
      url: canonical,
      images: image ? [{ url: image }] : undefined,
      siteName: "Kutubi",
      locale: input.locale ?? "ar_SA",
      publishedTime: input.publishedTime,
      modifiedTime: input.modifiedTime,
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: image ? [image] : undefined,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-snippet": -1,
        "max-image-preview": "large",
        "max-video-preview": -1,
      },
    },
  };
}
