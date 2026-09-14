"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/app/page";
import { api } from "@/lib/client";
import { Avatar } from "@/components/ui";
import {
  IconCheck,
  IconSparkles,
  IconUserPlus,
  IconUsers,
} from "@/components/icons";

interface SemanticMatch {
  id: string;
  name: string;
  avatarHue: number;
  course: string;
  year: number;
  matchScore: number;
  myRole: string;
  theirRole: string;
  theirSkills: string[];
  rationale: string;
  target: string;
}

export function SemanticMatchmaker({
  onToast,
}: {
  onToast?: (msg: string, tone?: "ok" | "warn") => void;
}) {
  const {me}=useApp();
  const [matches, setMatches] = useState<SemanticMatch[]>([]);
  const [invitedIds, setInvitedIds] = useState<string[]>([]);
  const [filterStack, setFilterStack] = useState<string>("All");

  useEffect(()=>{api<{matches:SemanticMatch[]}>('/api/matches').then(r=>setMatches(r.matches)).catch(()=>onToast?.('Could not load matches.','warn'));},[onToast]);
  const handleInvite=async(id:string,name:string)=>{
    try{await api('/api/chats',{method:'POST',body:JSON.stringify({action:'initiate',receiverId:id,message:`Hi ${name}, would you like to collaborate on a study project?`})});setInvitedIds(prev=>[...prev,id]);onToast?.('Study invitation saved in Chats.','ok');}
    catch(e){onToast?.(e instanceof Error?e.message:'Could not send invitation.','warn');}
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header Info */}
      <div className="rounded-2xl border border-purple-300/60 bg-gradient-to-r from-purple-50 via-cream to-purple-50/40 p-4 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-600 text-white shadow-xs">
            <IconSparkles size={18} />
          </span>
          <div>
            <h3 className="font-display text-sm font-bold text-ink">
              Study Teammate Matchmaker
            </h3>
            <p className="text-[11px] text-ink-faint">
              Matches from saved courses and shared interests
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between bg-white/80 p-2.5 rounded-xl border border-purple-200 text-xs">
          <span className="text-ink-soft">
            Your Profile: <strong className="text-purple-800">{me?.user.course}</strong>
          </span>
          <span className="text-[10px] font-black uppercase text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
            Interest-based
          </span>
        </div>
      </div>

      {/* Match Cards */}
      <div className="space-y-3">
        {matches.map((m) => {
          const isInvited = invitedIds.includes(m.id);
          return (
            <div
              key={m.id}
              className="rounded-2xl border border-line bg-cream p-4 shadow-2xs space-y-3 transition-all hover:border-purple-300 hover:shadow-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <Avatar name={m.name} hue={m.avatarHue} size={38} />
                  <div>
                    <h4 className="font-display text-xs font-bold text-ink">{m.name}</h4>
                    <p className="text-[10.5px] font-semibold text-ink-faint">
                      {m.course} · Year {m.year}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-black text-purple-800 border border-purple-200">
                    <IconSparkles size={12} />
                    {m.matchScore}% Match
                  </span>
                  <span className="block text-[9px] font-bold text-ink-faint uppercase mt-0.5">
                    Complementary
                  </span>
                </div>
              </div>

              {/* Roles paired */}
              <div className="grid grid-cols-2 gap-2 bg-paper/90 p-2.5 rounded-xl border border-line/60 text-xs">
                <div>
                  <span className="text-[9.5px] uppercase font-bold text-ink-faint block">Your Skill</span>
                  <p className="font-semibold text-ink truncate text-[11px]">{m.myRole}</p>
                </div>
                <div className="border-l border-line/60 pl-2">
                  <span className="text-[9.5px] uppercase font-bold text-purple-700 block">Their Skill</span>
                  <p className="font-bold text-purple-900 truncate text-[11px]">{m.theirRole}</p>
                </div>
              </div>

              {/* Rationale */}
              <p className="text-xs text-ink-soft leading-relaxed">
                &quot;{m.rationale}&quot;
              </p>

              {/* Tech Stack Pills */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {m.theirSkills.map((sk, idx) => (
                  <span
                    key={idx}
                    className="rounded-md bg-paper px-2 py-0.5 text-[10px] font-bold text-ink-soft border border-line/60"
                  >
                    ⚡ {sk}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-line/60">
                <span className="text-[10px] font-bold text-ink-faint uppercase truncate max-w-[200px]">
                  🎯 {m.target}
                </span>

                <button
                  onClick={() => handleInvite(m.id, m.name)}
                  disabled={isInvited}
                  className={`cursor-pointer flex items-center gap-1 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95 ${
                    isInvited
                      ? "bg-emerald-600 text-white opacity-90"
                      : "bg-purple-700 hover:bg-purple-800 text-white shadow-xs"
                  }`}
                >
                  {isInvited ? "Invite Sent ✓" : "Invite to Team"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
