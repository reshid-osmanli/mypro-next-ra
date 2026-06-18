// ============================================================================
// lib/schema-markup.ts — Schema.org JSON-LD generators
// ----------------------------------------------------------------------------
// New file: /lib/schema-markup.ts
// Centralized generators for Product, Offer, AggregateRating, Review,
// BreadcrumbList, Organization, WebSite.
// ============================================================================

import { resolveSiteUrl } from "@/lib/site-url";

const SITE_NAME = "Kutubi";
const SITE_DESCRIPTION = "متجر رقمي عربي لعروض البوربوينت وأوراق العمل والمحتوى التعليمي الجاهز.";

export function buildOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: resolveSiteUrl() || "https://kutubi.example",
    logo: `${resolveSiteUrl() || ""}/icon.svg`,
    description: SITE_DESCRIPTION,
    sameAs: [
      // Add real social profiles when available
    ],
  };
}

export function buildWebSiteSchema() {
  const url = resolveSiteUrl() || "https://kutubi.example";
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url,
    description: SITE_DESCRIPTION,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${url}/products?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export type ProductSchemaInput = {
  id: string;
  slug: string;
  title: string;
  description: string;
  excerpt?: string;
  price: number;
  compareAt?: number | null;
  currency?: string;
  coverImage?: string | null;
  images?: string[];
  brand?: string;
  averageRating?: number;
  reviewCount?: number;
  inStock?: boolean;
};

export function buildProductSchema(product: ProductSchemaInput) {
  const url = resolveSiteUrl() || "https://kutubi.example";
  const currency = (product.currency ?? process.env.NEXT_PUBLIC_STRIPE_CURRENCY ?? "USD").toUpperCase();
  const productUrl = `${url}/products/${product.slug}`;
  const images = [product.coverImage, ...(product.images ?? [])].filter(Boolean) as string[];

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description ?? product.excerpt,
    image: images.length ? images : undefined,
    url: productUrl,
    sku: product.id,
    brand: {
      "@type": "Brand",
      name: product.brand ?? SITE_NAME,
    },
    offers: {
      "@type": "Offer",
      price: (product.price / 100).toFixed(2),
      priceCurrency: currency,
      availability: (product.inStock ?? true)
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: productUrl,
      seller: { "@type": "Organization", name: SITE_NAME, url },
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    },
    aggregateRating:
      product.reviewCount && product.averageRating
        ? {
            "@type": "AggregateRating",
            ratingValue: product.averageRating,
            reviewCount: product.reviewCount,
            bestRating: 5,
            worstRating: 1,
          }
        : undefined,
  };
}

export type ReviewSchemaInput = {
  productSlug: string;
  reviews: Array<{
    id: string;
    rating: number;
    comment: string;
    author?: string;
    createdAt: string;
  }>;
};

export function buildReviewsSchema(input: ReviewSchemaInput) {
  const url = resolveSiteUrl() || "https://kutubi.example";
  const productUrl = `${url}/products/${input.productSlug}`;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    url: productUrl,
    review: input.reviews.map((review) => ({
      "@type": "Review",
      reviewRating: {
        "@type": "Rating",
        ratingValue: review.rating,
        bestRating: 5,
        worstRating: 1,
      },
      author: {
        "@type": "Person",
        name: review.author ?? "مشتري موثّق",
      },
      datePublished: review.createdAt,
      reviewBody: review.comment,
    })),
  };
}

export type CrumbInput = { label: string; href?: string };

export function buildBreadcrumbSchema(items: CrumbInput[]) {
  const url = resolveSiteUrl() || "https://kutubi.example";
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: item.href ? new URL(item.href, url).toString() : undefined,
    })),
  };
}

export type BlogPostSchemaInput = {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  coverImage: string | null;
  createdAt: string;
  updatedAt: string;
};

export function buildBlogPostSchema(post: BlogPostSchemaInput) {
  const url = resolveSiteUrl() || "https://kutubi.example";
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage ? [post.coverImage] : undefined,
    url: `${url}/blog/${post.slug}`,
    datePublished: post.createdAt,
    dateModified: post.updatedAt,
    author: { "@type": "Organization", name: SITE_NAME, url },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: `${url}/icon.svg` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${url}/blog/${post.slug}` },
    articleBody: post.body.slice(0, 5000),
  };
}

export function buildFAQSchema(qaPairs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: qaPairs.map((pair) => ({
      "@type": "Question",
      name: pair.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: pair.answer,
      },
    })),
  };
}
