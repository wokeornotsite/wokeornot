import React from 'react';
import { prisma } from '@/lib/prisma';
import ForumCommentSection from '@/components/forum/forum-comment-section';
import { notFound } from 'next/navigation';

export default async function ForumThreadPage({ params }: { params: { threadId: string } }) {
  // Use params.threadId directly, no await needed
  const thread = await prisma.forumThread.findUnique({
    where: { id: params.threadId },
  });
  if (!thread) return notFound();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 bg-background rounded-xl shadow border border-border mt-6">
      <h1 className="text-2xl font-bold mb-4">{thread.title}</h1>
      <div className="mb-6 text-gray-800 whitespace-pre-line">{thread.content}</div>
      <ForumCommentSection threadId={thread.id} />
    </div>
  );
}
