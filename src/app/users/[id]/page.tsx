// Public User Profile Page
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import { notFound } from "next/navigation";

export default async function UserProfilePage({ params }: { params: { id: string } }) {
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      avatar: true,
      reviews: {
        include: {
          content: true
        }
      },
      // Optionally: favorites, comments, etc.
    }
  });
  if (!user) return notFound();

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="flex items-center gap-4 mb-6">
        <Image src={user.avatar || "/avatars/default.png"} width={80} height={80} className="rounded-full" alt={user.name || "User"} />
        <div>
          <h2 className="text-2xl font-bold">{user.name || "User"}</h2>
          <p className="text-gray-500 text-sm">@{user.id}</p>
        </div>
      </div>
      <h3 className="font-semibold mb-2">Reviews</h3>
      <ul className="space-y-4">
        {user.reviews.map(review => (
          <li key={review.id} className="border rounded-lg p-4 bg-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Image src={user.avatar || "/avatars/default.png"} width={32} height={32} className="rounded-full" alt={user.name || "User"} />
              <span className="font-bold">{user.name || "User"}</span>
            </div>
            <div className="text-sm text-gray-300 mb-1">{review.content?.title || "Title"}</div>
            <div className="text-base">{review.rating}/10</div>
            <div className="text-gray-400 text-sm mt-1">{review.text}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
