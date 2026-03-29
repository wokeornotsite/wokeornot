
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
      allowDangerousEmailAccountLinking: true,
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
  // Explicit session/JWT expiry configuration
  // 30 days in seconds
  session: {
    strategy: "jwt" as SessionStrategy,
    maxAge: 60 * 60 * 24 * 30,
  },
  jwt: {
    maxAge: 60 * 60 * 24 * 30,
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user, trigger, session: sessionUpdate }: { token: Record<string, unknown>; user?: { id?: string; role?: string; avatar?: string }; trigger?: string; session?: Record<string, unknown> }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        // Fetch avatar from DB on initial sign-in
        if (user.id) {
          const dbUser = await prisma.user.findUnique({ where: { id: user.id as string }, select: { avatar: true } });
          token.avatar = dbUser?.avatar || '';
        }
      }
      // Allow client-side session.update({ avatar }) to refresh the token
      if (trigger === 'update' && sessionUpdate?.avatar !== undefined) {
        token.avatar = sessionUpdate.avatar as string;
      }
      return token;
    },
    async session({ session, token }: { session: { user?: Record<string, unknown>; expires: string }; token?: Record<string, unknown> }) {
      if (token) {
        session.user = session.user || {};
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.avatar = (token.avatar as string) || '';
      }
      return session;
    }
  }
};
