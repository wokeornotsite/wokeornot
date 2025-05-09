import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth({
  ...authOptions,
  allowDangerousEmailAccountLinking: true,
});

export { handler as GET, handler as POST };
