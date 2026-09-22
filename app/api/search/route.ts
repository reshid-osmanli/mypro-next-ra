import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currencyLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SearchHit = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  grade: string;
  subject: string;
  category: string;
  format: string;
  price: number;
  compareAt: number | null;
  priceLabel: string;
  coverImage: string | null;
};

/**
 * Lightweight storefront search (read-only).
 * Matches title/excerpt/grade/subject/category with ILIKE.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  if (!q) {
    return NextResponse.json({ results: [] as SearchHit[] });
  }

  const like = `%${q}%`;
  try {
    const products = await prisma.product.findMany({
      where: {
        status: "published",
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { excerpt: { contains: q, mode: "insensitive" } },
          { grade: { contains: q, mode: "insensitive" } },
          { subject: { contains: q, mode: "insensitive" } },
          { category: { contains: q, mode: "insensitive" } }
        ]
      },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: 8
    });

    const results: SearchHit[] = products.map((product) => ({
      id: product.id,
      slug: product.slug,
      title: product.title,
      excerpt: product.excerpt,
      grade: product.grade,
      subject: product.subject,
      category: product.category,
      format: product.format,
      price: product.price,
      compareAt: product.compareAt,
      priceLabel: currencyLabel(product.price),
      coverImage: product.coverImage
    }));

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] as SearchHit[] }, { status: 503 });
  }
}
