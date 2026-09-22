"use client";

import { type FormEvent, useState } from "react";
import { Loader2, Star } from "lucide-react";
import { useSession } from "next-auth/react";
import { useSitePreferences } from "@/components/site-preferences";
import { Button } from "@/components/ui/button";
import { dateLabel } from "@/lib/utils";

type Review = {
  id: string;
  rating: number;
  comment: string;
  customerName: string | null;
  createdAt: string;
};

type Props = {
  productId: string;
  initialReviews: Review[];
  canReview: boolean;
  averageRating: number;
  reviewCount: number;
};

function Stars({ value, interactive = false, onChange }: { value: number; interactive?: boolean; onChange?: (value: number) => void }) {
  return (
    <div className="inline-flex items-center gap-1" dir="ltr">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(star)}
          className={interactive ? "text-accent-gold transition-transform duration-fast hover:scale-110" : "cursor-default text-accent-gold"}
          aria-label={`${star} ${star === 1 ? "star" : "stars"}`}
        >
          <Star size={18} className={star <= value ? "fill-current" : "text-line-strong"} />
        </button>
      ))}
    </div>
  );
}

export function ProductReviews({ productId, initialReviews, canReview, averageRating, reviewCount }: Props) {
  const { data: session } = useSession();
  const { text } = useSitePreferences();
  const [reviews, setReviews] = useState(initialReviews);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const currentAverage = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : averageRating;
  const currentCount = reviews.length || reviewCount;

  async function submitReview(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || text({ ar: "تعذر حفظ التقييم", en: "Unable to save review" }));
      if (Array.isArray(data.reviews)) setReviews(data.reviews);
      setComment("");
      setMessage(text({ ar: "تم حفظ تقييمك بنجاح", en: "Your review was saved" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : text({ ar: "حدث خطأ", en: "An error occurred" }));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="border-t border-line p-6 md:p-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-h2 font-bold text-ink">{text({ ar: "تقييمات المشترين", en: "Buyer reviews" })}</h2>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Stars value={Math.round(currentAverage)} />
            <span className="text-body-sm font-semibold text-ink-soft">
              {currentCount
                ? `${currentAverage.toFixed(1)} / 5 · ${currentCount} ${text({ ar: "تقييم", en: "reviews" })}`
                : text({ ar: "لا توجد تقييمات بعد", en: "No reviews yet" })}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="card h-fit p-5 md:p-6">
          <h3 className="text-h4 font-bold text-ink">{text({ ar: "اكتب تقييمك", en: "Write a review" })}</h3>
          {canReview ? (
            <form onSubmit={submitReview} className="mt-4 space-y-4">
              <Stars value={rating} interactive onChange={setRating} />
              <textarea
                className="w-full rounded-sm border border-line bg-surface p-3.5 text-body leading-8 text-ink outline-none transition-colors duration-instant placeholder:text-ink-faint focus:border-brand focus:ring-2 focus:ring-brand/25"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                minLength={4}
                maxLength={1000}
                required
                rows={4}
                placeholder={text({ ar: "اكتب رأيك في جودة الملف والتصميم...", en: "Share your opinion about the file and design quality..." })}
              />
              <Button type="submit" variant="primary" size="md" disabled={loading}>
                {loading ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Star size={16} aria-hidden="true" />}
                {text({ ar: "حفظ التقييم", en: "Save review" })}
              </Button>
            </form>
          ) : (
            <p className="mt-3 text-body-sm leading-8 text-ink-soft">
              {session?.user?.email
                ? text({ ar: "يمكن فقط للمستخدمين الذين اشتروا هذا المنتج كتابة تقييم.", en: "Only users who purchased this product can write a review." })
                : text({ ar: "سجّل الدخول بالحساب الذي اشتريت منه حتى تتمكن من التقييم.", en: "Sign in with the account used for purchase to review." })}
            </p>
          )}
          {message ? <p className="mt-3 text-body-sm font-semibold text-teal-700">{message}</p> : null}
          {error ? <p className="mt-3 text-body-sm font-semibold text-accent-danger">{error}</p> : null}
        </div>

        <div className="space-y-3">
          {reviews.map((review) => (
            <article key={review.id} className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-ink">{review.customerName || text({ ar: "مشتري موثّق", en: "Verified buyer" })}</p>
                  <p className="mt-0.5 text-caption text-ink-faint">{dateLabel(review.createdAt)}</p>
                </div>
                <Stars value={review.rating} />
              </div>
              <p className="mt-3 text-body-sm leading-8 text-ink-soft">{review.comment}</p>
            </article>
          ))}
          {!reviews.length ? (
            <div className="rounded-sm border border-dashed border-line-strong p-8 text-center text-body-sm text-ink-faint">
              {text({ ar: "كن أول من يضع تقييمًا بعد الشراء.", en: "Be the first to review after purchase." })}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
