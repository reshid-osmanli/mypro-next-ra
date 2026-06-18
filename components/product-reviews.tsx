"use client";

import { type FormEvent, useState } from "react";
import { Loader2, Star } from "lucide-react";
import { useSession } from "next-auth/react";
import { useSitePreferences } from "./site-preferences";
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
          className={interactive ? "text-amber-500 transition hover:scale-110" : "cursor-default text-amber-500"}
          aria-label={`${star} stars`}
        >
          <Star size={18} className={star <= value ? "fill-current" : ""} />
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
  const [loading, setLoading] = useState(false);

  const currentAverage = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : averageRating;
  const currentCount = reviews.length || reviewCount;

  async function submitReview(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
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
    } catch (error) {
      setMessage(error instanceof Error ? error.message : text({ ar: "حدث خطأ", en: "An error occurred" }));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="border-t border-pearl-200 p-6 md:p-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-zinc-950">{text({ ar: "تقييمات المشترين", en: "Buyer reviews" })}</h2>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Stars value={Math.round(currentAverage)} />
            <span className="text-sm font-bold text-zinc-700">
              {currentCount ? `${currentAverage.toFixed(1)} / 5 · ${currentCount} ${text({ ar: "تقييم", en: "reviews" })}` : text({ ar: "لا توجد تقييمات بعد", en: "No reviews yet" })}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-lg border border-pearl-200 bg-pearl-50 p-5">
          <h3 className="font-black text-zinc-950">{text({ ar: "اكتب تقييمك", en: "Write a review" })}</h3>
          {canReview ? (
            <form onSubmit={submitReview} className="mt-4 space-y-4">
              <Stars value={rating} interactive onChange={setRating} />
              <textarea
                className="textarea bg-white"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                minLength={4}
                maxLength={1000}
                required
                placeholder={text({ ar: "اكتب رأيك في جودة الملف والتصميم...", en: "Share your opinion about the file and design quality..." })}
              />
              <button type="submit" disabled={loading} className="btn-primary disabled:opacity-60">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Star size={16} />}
                {text({ ar: "حفظ التقييم", en: "Save review" })}
              </button>
            </form>
          ) : (
            <p className="mt-3 text-sm leading-7 text-zinc-600">
              {session?.user?.email
                ? text({ ar: "يمكن فقط للمستخدمين الذين اشتروا هذا المنتج كتابة تقييم.", en: "Only users who purchased this product can write a review." })
                : text({ ar: "سجّل الدخول بالحساب الذي اشتريت منه حتى تتمكن من التقييم.", en: "Sign in with the account used for purchase to review." })}
            </p>
          )}
          {message ? <p className="mt-3 text-sm font-bold text-qatar-800">{message}</p> : null}
        </div>

        <div className="space-y-3">
          {reviews.map((review) => (
            <article key={review.id} className="rounded-lg border border-pearl-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-black text-zinc-950">{review.customerName || text({ ar: "مشتري موثّق", en: "Verified buyer" })}</p>
                  <p className="text-xs text-zinc-500">{dateLabel(review.createdAt)}</p>
                </div>
                <Stars value={review.rating} />
              </div>
              <p className="mt-3 leading-8 text-zinc-700">{review.comment}</p>
            </article>
          ))}
          {!reviews.length ? <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500">{text({ ar: "كن أول من يضع تقييمًا بعد الشراء.", en: "Be the first to review after purchase." })}</div> : null}
        </div>
      </div>
    </section>
  );
}
