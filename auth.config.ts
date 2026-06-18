import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import { resolveSiteUrl } from "@/lib/site-url";

const siteUrl = resolveSiteUrl();
if (siteUrl && !process.env.AUTH_URL) {
  process.env.AUTH_URL = siteUrl;
}

const authSecret = (process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? process.env.ADMIN_SESSION_SECRET ?? "dev-secret-placeholder-change-in-production") as string;
const googleClientId = process.env.AUTH_GOOGLE_ID ?? process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.AUTH_GOOGLE_SECRET ?? process.env.GOOGLE_CLIENT_SECRET;

const providers =
  googleClientId && googleClientSecret
    ? [
        Google({
          clientId: googleClientId,
          clientSecret: googleClientSecret,
          authorization: {
            params: {
              prompt: "select_account",
              response_type: "code"
            }
          }
        })
      ]
    : [];

export const isGoogleAuthConfigured = providers.length > 0;

const authConfig = {
  trustHost: true,
  secret: authSecret,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60
  },
  pages: {
    signIn: "/login",
    error: "/login"
  },
  providers,
  callbacks: {
    authorized() {
      return true;
    },
    jwt({ token, user }) {
      if (user?.email) token.email = user.email.toLowerCase();
      if (user?.name) token.name = user.name;
      if (user?.image) token.picture = user.image;
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.sub ?? "");
        session.user.email = typeof token.email === "string" ? token.email.toLowerCase() : session.user.email;
        session.user.name = typeof token.name === "string" ? token.name : session.user.name;
        session.user.image = typeof token.picture === "string" ? token.picture : session.user.image;
      }
      return session;
    }
  }
} satisfies NextAuthConfig;

export default authConfig;
