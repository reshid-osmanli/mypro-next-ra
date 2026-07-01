import { prisma } from "./db";

export type BlogPostCard = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string | null;
  createdAt: string;
  relatedProduct?: {
    slug: string;
    title: string;
    price: number;
  } | null;
};

export type BlogPostDetails = BlogPostCard & {
  body: string;
};

function toCard(post: {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string | null;
  createdAt: Date;
  relatedProduct?: { slug: string; title: string; price: number } | null;
}): BlogPostCard {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    coverImage: post.coverImage,
    createdAt: post.createdAt.toISOString(),
    relatedProduct: post.relatedProduct ?? null
  };
}

export async function getBlogPosts(): Promise<BlogPostCard[]> {
  try {
    const posts = await prisma.blogPost.findMany({
      where: { published: true },
      include: { relatedProduct: { select: { slug: true, title: true, price: true } } },
      orderBy: [{ sortOrder: "desc" }, { createdAt: "desc" }]
    });
    return posts.map(toCard);
  } catch (error) {
    console.warn("[blog] Database unavailable for posts", error);
    return [];
  }
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPostDetails | null> {
  try {
    const post = await prisma.blogPost.findFirst({
      where: { slug, published: true },
      include: { relatedProduct: { select: { slug: true, title: true, price: true } } }
    });
    if (!post) return null;
    return { ...toCard(post), body: post.body };
  } catch (error) {
    console.warn("[blog] Database unavailable for post", error);
    return null;
  }
}
