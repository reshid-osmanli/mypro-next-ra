import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getOrCreateAffiliateProfile } from "@/lib/affiliates";

export async function GET() {
  const session = await auth();
  const email = session?.user?.email?.trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await getOrCreateAffiliateProfile(email);
  const commissions = await prisma.affiliateCommission.findMany({
    where: { affiliateId: profile.id },
    orderBy: { createdAt: "desc" },
    take: 50
  });

  return NextResponse.json({
    profile,
    commissions: commissions.map((commission) => ({
      ...commission,
      createdAt: commission.createdAt.toISOString()
    }))
  });
}

export async function POST() {
  return GET();
}
