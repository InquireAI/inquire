import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { env } from "@/env/server.mjs";
import { prisma } from "@/server/db/client";
import { stripe } from "@/server/stripe/client";
import { sendVerificationRequest } from "@/server/api/auth/send-verification-request";

export const authOptions: NextAuthOptions = {
  // Include user.id on session
  pages: {
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify-request",
  },
  events: {
    async signIn({ user, isNewUser }) {
      if (isNewUser) {
        const customer = await stripe.customers.create({
          email: user.email ?? undefined,
          name: user.name ?? undefined,
          metadata: {
            inquire_user_id: user.id,
          },
        });

        await prisma.customer.create({
          data: {
            id: customer.id,
            userId: user.id,
          },
        });
      }
    },
  },
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  // Configure one or more authentication providers
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
    GitHubProvider({
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    }),
    EmailProvider({
      sendVerificationRequest(params) {
        const { identifier, url } = params;
        const { host } = new URL(url);
        return sendVerificationRequest({
          from: "no-reply@inquire.run",
          host,
          magicLink: url,
          server: `smtp://${env.SES_SMTP_USERNAME}:${env.SES_SMTP_PASSWORD}@email-smtp.us-east-1.amazonaws.com:587`,
          to: identifier,
        });
      },
    }),
  ],
};

export default NextAuth(authOptions);
