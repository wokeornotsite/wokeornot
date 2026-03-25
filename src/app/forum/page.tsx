import React from 'react';
import Link from 'next/link';
import ForumThreadForm from '@/components/forum/forum-thread-form';
import { prisma } from '@/lib/prisma';

type Thread = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
};

export default async function ForumPage() {
  let threads: Thread[] = [];
  let fetchError = false;

  try {
    threads = await prisma.forumThread.findMany({
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
  } catch {
    fetchError = true;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Forum</h1>
      <ForumThreadForm />
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Recent Threads</h2>
        {fetchError ? (
          <div className="text-center py-8 text-red-400">
            Could not load discussions. Please try again later.
          </div>
        ) : threads.length === 0 ? (
          <div className="text-center py-8 text-gray-400 italic">
            No discussions yet. Start one!
          </div>
        ) : (
          <ul className="space-y-4">
            {threads.map((thread: Thread) => (
              <li key={thread.id} className="border p-4 rounded bg-white">
                <Link href={`/forum/${thread.id}`} className="font-bold text-blue-600 hover:underline text-lg">
                  {thread.title}
                </Link>
                <div className="text-gray-700 mt-1 line-clamp-2">{thread.content}</div>
                <div className="text-xs text-gray-400 mt-1">{new Date(thread.createdAt).toLocaleString()}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
