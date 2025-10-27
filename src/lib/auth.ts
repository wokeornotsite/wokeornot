
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcrypt";

import type { AuthOptions, SessionStrategy } from "next-auth";

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        });

        if (!user || !user.password) {
          throw new Error("Invalid credentials");
        }

        const isPasswordValid = await compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Invalid credentials");
        }

        if (!user.emailVerified) {
          throw new Error("Please verify your email address before logging in.");
        }
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role
        };
      }
    })
  ],
  pages: {
    signIn: "/login",
  },
  debug: process.env.NODE_ENV === "development",
  session: {
    strategy: "jwt" as SessionStrategy,
    maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
    updateAge: 24 * 60 * 60, // Update session every 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
  },
  callbacks: {
    async jwt({ token, user }: { token: Record<string, unknown>; user?: { id?: string; role?: string } }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }: { session: any; token?: Record<string, unknown> }) {
      if (token) {
        session.user = session.user || {};
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      // Session expiry is now handled by session.maxAge configuration
      // No need to manually set expires - NextAuth handles it automatically
      return session;
    }
  }
};
