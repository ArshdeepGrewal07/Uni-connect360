'use client';

import { useCollection, useSavedState } from "@/hooks/use-campus-data";
import { useApp } from "@/app/page";
import React, { useState, useEffect } from 'react';

interface LocalPost {
  id: string;
  author: string;
  authorRoom: string;
  avatarSeed: number;
  tag: 'lost_found' | 'urgent_borrow' | 'dorm_meme' | 'impromptu_study' | 'food_drop';
  content: string;
  createdMinsAgo: number;
  expiresInMinutes: number;
  upvotes: number;
  hasUpvoted?: boolean;
  replyCount: number;
  distanceMetres: number;
}

const INITIAL_POSTS: LocalPost[] = [
  {
    id: 'ephem-1',
    author: 'Kabir V.',
    authorRoom: 'Block B - 302',
    avatarSeed: 210,
    tag: 'urgent_borrow',
    content: 'Does anyone on Floor 3 have an HDMI-to-Type-C dongle for 1 hour? Mid-term demo presentation prep! Can trade cold RedBull.',
    createdMinsAgo: 32,
    expiresInMinutes: 328, // ~5.5 hours remaining
    upvotes: 7,
    replyCount: 3,
    distanceMetres: 24,
  },
  {
    id: 'ephem-2',
    author: 'Pooja M.',
    authorRoom: 'Girls Wing - 114',
    avatarSeed: 145,
    tag: 'lost_found',
    content: 'Left black Boat Airdopes case on table 4 at Central Canteen ~40 mins ago. Has a cat sticker on it. Please Ping if found!',
    createdMinsAgo: 45,
    expiresInMinutes: 315,
    upvotes: 14,
    replyCount: 5,
    distanceMetres: 110,
  },
  {
    id: 'ephem-3',
    author: 'Rohan & Team',
    authorRoom: 'Library Common Room',
    avatarSeed: 88,
    tag: 'impromptu_study',
    content: 'Calculus III cram session kicking off right now at Ground Floor Glass Cubicle 2. We have complete past 5 year question answer sheets.',
    createdMinsAgo: 12,
    expiresInMinutes: 348,
    upvotes: 19,
    replyCount: 8,
    distanceMetres: 75,
  },
  {
    id: 'ephem-4',
    author: 'Anonymous Cat Enthusiast',
    authorRoom: 'Block D Quad',
    avatarSeed: 40,
    tag: 'dorm_meme',
    content: 'The orange campus cat has officially occupied the Dean office doorstep and is demanding biscuits for entry clearance.',
    createdMinsAgo: 85,
    expiresInMinutes: 275,
    upvotes: 42,
    replyCount: 11,
    distanceMetres: 190,
  },
];

const TAG_CONFIG = {
  urgent_borrow: { label: 'Urgent Borrow', color: 'bg-amber-100 text-amber-800 border-amber-300', icon: '⚡' },
  lost_found: { label: 'Lost & Found', color: 'bg-rose-100 text-rose-800 border-rose-300', icon: '🔍' },
  impromptu_study: { label: 'Flash Study', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: '📖' },
  dorm_meme: { label: 'Campus Buzz', color: 'bg-purple-100 text-purple-800 border-purple-300', icon: '😹' },
  food_drop: { label: 'Food Drop', color: 'bg-orange-100 text-orange-800 border-orange-300', icon: '🍕' },
};

export const EphemeralLocalBoard: React.FC = () => {
  const {items:posts,mutate}=useCollection<LocalPost>('posts');
  const [filterTag, setFilterTag] = useState<string>('all');
  const [isPostingModalOpen, setIsPostingModalOpen] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newTag, setNewTag] = useState<LocalPost['tag']>('urgent_borrow');
  const [newRoom, setNewRoom] = useState('Block C - 204');
  const [wifiRouter, setWifiRouter] = useState('LPU-Hostel-Mesh-B3');
  const [rssiSignal, setRssiSignal] = useState(-58);

  // Expiry is computed from server timestamps.
  const formatExpiry = (mins: number) => {
    const hrs = Math.floor(mins / 60);
    const m = mins % 60;
    if (hrs > 0) return `${hrs}h ${m}m`;
    return `${m}m left`;
  };

  const handleUpvote=async(id:string)=>{await mutate('vote',{id});};
  const handleCreatePost=async(e:React.FormEvent)=>{
    e.preventDefault();if(!newContent.trim())return;
    if(!await mutate('create',{data:{content:newContent.trim(),tag:newTag,authorRoom:newRoom}}))return;
    setNewContent('');setIsPostingModalOpen(false);
  };

  const filteredPosts = filterTag === 'all' ? posts : posts.filter((p) => p.tag === filterTag);

  return (
    <div className="space-y-4">
      {/* Subnet / Wi-Fi Geofence Banner */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white shadow-md border border-emerald-500/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="w-3 h-3 rounded-full bg-emerald-400 block animate-ping" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute inset-0 m-auto" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold tracking-wider uppercase text-emerald-300">
                Proximity-Locked Wi-Fi Mesh
              </p>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                {rssiSignal} dBm (Optimal)
              </span>
            </div>
            <p className="text-sm font-semibold text-emerald-100 flex items-center gap-1.5 mt-0.5">
              <span>📶</span> {wifiRouter} <span className="text-xs text-emerald-400/80">• ~250m Local Radius</span>
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsPostingModalOpen(true)}
          className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold text-xs shadow-sm transition active:scale-95 flex items-center gap-1.5"
        >
          <span>✍️</span> Drop Note
        </button>
      </div>

      {/* Geofence notice */}
      <div className="flex items-center justify-between px-1 text-xs text-stone-600 dark:text-stone-300">
        <span className="flex items-center gap-1">
          ⏳ <strong>6-Hour Auto-Vanish:</strong> Posts destroy automatically to avoid campus clutter.
        </span>
        <span className="font-mono text-[11px] text-stone-500">
          {posts.length} ephemeral drops
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        <button
          onClick={() => setFilterTag('all')}
          className={`px-3 py-1.5 rounded-full font-medium transition ${
            filterTag === 'all'
              ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-semibold'
              : 'bg-stone-200/80 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
          }`}
        >
          All Drops
        </button>
        {Object.entries(TAG_CONFIG).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => setFilterTag(key)}
            className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition flex items-center gap-1 ${
              filterTag === key
                ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-semibold'
                : 'bg-stone-200/80 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
            }`}
          >
            <span>{cfg.icon}</span> {cfg.label}
          </button>
        ))}
      </div>

      {/* Posts Feed */}
      <div className="space-y-3">
        {filteredPosts.map((post) => {
          const cfg = TAG_CONFIG[post.tag];
          const expiryRatio = Math.max(0, post.expiresInMinutes / 360);
          return (
            <div
              key={post.id}
              className="p-4 rounded-2xl bg-white dark:bg-stone-900/90 border border-stone-200 dark:border-stone-800 shadow-sm hover:shadow-md transition relative overflow-hidden"
            >
              {/* Vanish countdown bar */}
              <div
                className="absolute top-0 left-0 h-1 bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 transition-all duration-1000"
                style={{ width: `${Math.round(expiryRatio * 100)}%` }}
              />

              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-sm"
                    style={{ backgroundColor: `hsl(${post.avatarSeed}, 65%, 45%)` }}
                  >
                    {post.author[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                        {post.author}
                      </span>
                      <span className="text-[10px] text-stone-500 dark:text-stone-400">
                        • {post.authorRoom}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-stone-500">
                      <span>📍 ~{post.distanceMetres}m away</span>
                      <span>•</span>
                      <span>{post.createdMinsAgo === 0 ? 'Just now' : `${post.createdMinsAgo}m ago`}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${cfg.color}`}
                  >
                    {cfg.icon} {cfg.label}
                  </span>
                </div>
              </div>

              {/* Content */}
              <p className="text-xs text-stone-800 dark:text-stone-200 leading-relaxed my-2.5 font-normal">
                {post.content}
              </p>

              {/* Card Footer: Expiry Timer & Interactivity */}
              <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800/80 text-xs">
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-amber-700 dark:text-amber-400 font-medium">
                  <span className="animate-spin text-xs">⏳</span>
                  <span>Vanish: {formatExpiry(post.expiresInMinutes)}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpvote(post.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                      post.hasUpvoted
                        ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900'
                        : 'bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    <span>{post.hasUpvoted ? '❤️' : '🤍'}</span>
                    <span>{post.upvotes}</span>
                  </button>

                  <button className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center gap-1.5 transition">
                    <span>💬</span>
                    <span>{post.replyCount}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal for Creating Ephemeral Post */}
      {isPostingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 w-full max-w-md rounded-2xl p-5 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">📡</span>
                <div>
                  <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                    Drop Ephemeral Beacon
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Visible only to students on current subnet ({wifiRouter})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPostingModalOpen(false)}
                className="w-7 h-7 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-500 hover:text-stone-900"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-stone-500 mb-1">
                  Beacon Category
                </label>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  {Object.entries(TAG_CONFIG).map(([key, cfg]) => (
                    <button
                      type="button"
                      key={key}
                      onClick={() => setNewTag(key as LocalPost['tag'])}
                      className={`p-2 rounded-xl border text-left transition font-medium flex items-center gap-2 ${
                        newTag === key
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 font-bold'
                          : 'border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/50 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      <span>{cfg.icon}</span>
                      <span>{cfg.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-stone-500 mb-1">
                  Location / Room
                </label>
                <input
                  type="text"
                  value={newRoom}
                  onChange={(e) => setNewRoom(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. Block C - 204 or Central Library"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-stone-500 mb-1">
                  Message (Auto-expires in 6 hours)
                </label>
                <textarea
                  rows={3}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="What's happening? Need a charger, lost an ID card, or hosting quick study?"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPostingModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newContent.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white shadow-md transition"
                >
                  Broadcast to Wi-Fi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
