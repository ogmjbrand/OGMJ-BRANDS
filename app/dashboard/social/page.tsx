'use client';

import React, { useState } from 'react';
import { CalendarDays, MessageCircle, Plus, Share2, Clock3 } from 'lucide-react';

const initialPosts = [
  {
    id: '1',
    channel: 'Instagram',
    content: 'Launch your next campaign with VIP offers and exclusive storytelling.',
    publishDate: '2026-05-22',
    status: 'Scheduled',
  },
  {
    id: '2',
    channel: 'LinkedIn',
    content: 'Showcase your growth strategy with analytics insights and authority.',
    publishDate: '2026-05-24',
    status: 'Draft',
  },
];

export default function SocialPage() {
  const [posts, setPosts] = useState(initialPosts);
  const [newMessage, setNewMessage] = useState('');
  const [newChannel, setNewChannel] = useState('Instagram');
  const [newDate, setNewDate] = useState('2026-05-29');

  const handleSchedulePost = () => {
    if (!newMessage.trim()) return;
    setPosts((prev) => [
      {
        id: String(Date.now()),
        channel: newChannel,
        content: newMessage.trim(),
        publishDate: newDate,
        status: 'Scheduled',
      },
      ...prev,
    ]);
    setNewMessage('');
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-[#D4AF37]/10 px-4 py-2 text-sm text-[#D4AF37]">
          <CalendarDays className="w-4 h-4" /> Social Scheduling
        </div>
        <h1 className="text-4xl font-bold text-white mt-4">Social Planner</h1>
        <p className="text-[#D4AF37]/70 mt-2 max-w-2xl">
          Build and schedule social content directly from your dashboard.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
        <div className="rounded-3xl border border-[#D4AF37]/10 bg-[#0E1116] p-6">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-sm text-[#D4AF37]/70 uppercase tracking-[0.2em]">Composer</p>
              <h2 className="text-2xl font-semibold text-white mt-2">Create a new post</h2>
            </div>
            <Share2 className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <div className="space-y-4">
            <textarea
              rows={5}
              value={newMessage}
              onChange={(event) => setNewMessage(event.target.value)}
              className="w-full rounded-3xl border border-[#D4AF37]/10 bg-[#07070A] p-4 text-white outline-none focus:border-[#D4AF37]"
              placeholder="Write the message for your next social post..."
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="space-y-2 text-sm text-[#D4AF37]/70">
                Channel
                <select
                  value={newChannel}
                  onChange={(event) => setNewChannel(event.target.value)}
                  className="w-full rounded-3xl border border-[#D4AF37]/10 bg-[#07070A] px-4 py-3 text-white outline-none"
                >
                  <option>Instagram</option>
                  <option>LinkedIn</option>
                  <option>Facebook</option>
                  <option>Twitter</option>
                </select>
              </label>
              <label className="space-y-2 text-sm text-[#D4AF37]/70">
                Publish date
                <input
                  type="date"
                  value={newDate}
                  onChange={(event) => setNewDate(event.target.value)}
                  className="w-full rounded-3xl border border-[#D4AF37]/10 bg-[#07070A] px-4 py-3 text-white outline-none"
                />
              </label>
              <button
                onClick={handleSchedulePost}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-6 py-3 text-sm font-semibold text-[#07070A] hover:bg-[#D4AF37]/90 transition"
              >
                <Plus className="w-4 h-4" /> Schedule Post
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-[#D4AF37]/10 bg-[#0E1116] p-6">
          <div className="flex items-center gap-3 mb-4">
            <Clock3 className="w-5 h-5 text-[#D4AF37]" />
            <p className="text-sm font-medium text-white">Upcoming schedule</p>
          </div>
          <div className="space-y-4">
            {posts.slice(0, 3).map((post) => (
              <div key={post.id} className="rounded-3xl border border-[#D4AF37]/10 bg-[#07070A] p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-white font-semibold">{post.channel}</h3>
                    <p className="text-sm text-[#D4AF37]/70">{post.publishDate}</p>
                  </div>
                  <span className="rounded-full bg-[#D4AF37]/10 px-3 py-1 text-xs font-medium text-[#D4AF37]">
                    {post.status}
                  </span>
                </div>
                <p className="mt-3 text-sm text-[#D4AF37]/70">{post.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-[#D4AF37]/10 bg-[#0E1116] p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-white">All Scheduled Posts</h2>
            <p className="text-[#D4AF37]/70 text-sm">Manage your content calendar and stay on brand.</p>
          </div>
          <MessageCircle className="w-5 h-5 text-[#D4AF37]" />
        </div>
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="rounded-3xl border border-[#D4AF37]/10 bg-[#07070A] p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm text-[#D4AF37]/70">{post.channel}</p>
                  <p className="text-white font-medium">{post.content}</p>
                </div>
                <span className="rounded-full bg-[#D4AF37]/10 px-3 py-1 text-xs font-semibold text-[#D4AF37]">
                  {post.publishDate}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
