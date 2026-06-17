import { Suspense } from "react";
import { AuthCard } from "@/components/auth-card";

export const dynamic = "force-dynamic";

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <AuthCard mode="signup" />
    </Suspense>
  );
}
