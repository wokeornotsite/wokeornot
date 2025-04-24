import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user?.email) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const { avatar } = req.body;
  if (!avatar || typeof avatar !== "string") {
    return res.status(400).json({ error: "Invalid avatar" });
  }
  await prisma.user.update({
    where: { email: session.user.email },
    data: { avatar },
  });
  return res.status(200).json({ image: avatar });
}
