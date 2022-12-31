import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
// Prisma adapter for NextAuth, optional and can be removed
import { PrismaAdapter } from "@next-auth/prisma-adapter";

import { env } from "../../../env/server.mjs";
import { prisma } from "../../../server/db/client";
import { stripe } from "../../../server/stripe/client";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  // Include user.id on session
  pages: {
    signIn: "/auth/signin",
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
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
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
    // TODO: finish telegram credentials provider
    CredentialsProvider({
      id: "telegram",
      name: "Telegram",
      type: "credentials",
      credentials: {},
      authorize(credentials, req) {
        console.log(credentials);
        console.log(req);
        return null;
      },
    }),
    // ...add more providers here
  ],
  session: {
    strategy: "jwt",
  },
};

export default NextAuth(authOptions);
