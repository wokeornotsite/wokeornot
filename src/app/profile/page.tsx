import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import ProfileClient from './ProfileClient';
import { AvatarProvider } from './AvatarContext';
export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return (
      <div className="max-w-2xl mx-auto py-10">
        <h2 className="text-2xl font-bold mb-4">Profile</h2>
        <p className="text-gray-600">You must be logged in to view your profile.</p>
      </div>
    );
  }

  type UserWithReviewsAndComments = {
    id: string;
    name: string | null;
    email: string;
    emailVerified: Date | null;
    image: string | null;
    avatar: string | null;
    password: string | null;
    createdAt: Date;
    updatedAt: Date;
    role: string;
    reviews: any[];
    comments: any[];
  };

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      reviews: {
        include: { content: true },
        orderBy: { createdAt: 'desc' },
      },
      comments: {
        include: { content: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  }) as UserWithReviewsAndComments | null;

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto py-10">
        <h2 className="text-2xl font-bold mb-4">Profile</h2>
        <p className="text-gray-600">User not found.</p>
      </div>
    );
  }

  // Convert all dates to strings for client component
  const reviews = user.reviews.map((r: any) => ({ ...r, createdAt: r.createdAt.toString() }));
  const comments = user.comments.map((c: any) => ({ ...c, createdAt: c.createdAt.toString() }));

  return (
    <AvatarProvider initialAvatar={user.avatar || ""}>
      <ProfileClient user={{
        name: user.name || '',
        email: user.email || '',
        avatar: user.avatar || '',
        image: user.image || '',
        reviews,
        comments,
      }} />
    </AvatarProvider>
  );
}
