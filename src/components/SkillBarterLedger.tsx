"use client";

import { useCollection, useSavedState } from "@/hooks/use-campus-data";
import { useApp } from "@/app/page";
import { useState } from "react";
import { Avatar } from "@/components/ui";
import {
  IconCheck,
  IconClock,
  IconSparkles,
} from "@/components/icons";

interface SkillBarter {
  id: string;
  creatorName: string;
  avatarHue: number;
  course: string;
  offering: string;
  seeking: string;
  duration: string;
  note: string;
}

const INITIAL_BARTERS: SkillBarter[] = [
  {
    id: "sb-1",
    creatorName: "Aarav Mehta",
    avatarHue: 18,
    course: "B.Tech CSE · 2nd Yr",
    offering: "Calculus I & Differential Equations (Exam prep)",
    seeking: "Beginner Acoustic Guitar Chords & Strumming",
    duration: "45 mins",
    note: "I have top grades in Engineering Math; struggling with barre chords. Let's trade 45 mins at Library Lawn!",
  },
  {
    id: "sb-2",
    creatorName: "Ishita Rao",
    avatarHue: 330,
    course: "B.Des · 3rd Yr",
    offering: "Figma UI Prototyping & Auto-Layout Masterclass",
    seeking: "Blender 3D Asset Modeling & UV Unwrapping",
    duration: "60 mins",
    note: "Can teach you how to build responsive design systems in exchange for game asset modeling tips.",
  },
  {
    id: "sb-3",
    creatorName: "Sana Sheikh",
    avatarHue: 44,
    course: "B.Sc Psychology · 1st Yr",
    offering: "Conversational German & Pronunciation",
    seeking: "Python & Data Structures for Beginners",
    duration: "45 mins",
    note: "Goethe-Zertifikat B2 certified. Want to learn basic Python scripting for psychology research stats.",
  },
];

export function SkillBarterLedger({
  onToast,
}: {
  onToast?: (msg: string, tone?: "ok" | "warn") => void;
}) {
  const {items:barters,mutate}=useCollection<SkillBarter>('barters');
  const [modalOpen, setModalOpen] = useState(false);
  const [offeringInput, setOfferingInput] = useState("");
  const [seekingInput, setSeekingInput] = useState("");
  const proposedIds=barters.filter(i=>i.proposed).map(i=>i.id);

  const handlePropose = async (id:string,_name:string)=>{if(await mutate('propose',{id}))onToast?.('Your proposal is saved.','ok');};
  const handleCreateBarter=async()=>{
    if(!offeringInput.trim()||!seekingInput.trim())return;
    if(!await mutate('create',{data:{offering:offeringInput.trim(),seeking:seekingInput.trim(),duration:'45 mins',note:'Peer learning exchange'}}))return;
    onToast?.('Your skill offer is saved.','ok');setModalOpen(false);setOfferingInput('');setSeekingInput('');
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Ledger Header */}
      <div className="rounded-2xl border border-emerald-300/60 bg-gradient-to-r from-emerald-50 via-cream to-emerald-50/30 p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-xs">
              🔄
            </span>
            <div>
              <h3 className="font-display text-sm font-bold text-ink">
                Peer-to-Peer Skill-Barter Ledger
              </h3>
              <p className="text-[11px] text-ink-faint">
                Swap practical skills directly with classmates — zero money involved
              </p>
            </div>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="cursor-pointer rounded-xl bg-emerald-700 hover:bg-emerald-800 px-3 py-1.5 text-xs font-bold text-white shadow-2xs active:scale-95"
          >
            + Post Barter
          </button>
        </div>
      </div>

      {/* Barter Pair Cards */}
      <div className="space-y-3">
        {barters.map((b) => {
          const isProposed = proposedIds.includes(b.id);
          return (
            <div
              key={b.id}
              className="rounded-2xl border border-line bg-cream p-4 shadow-2xs space-y-3 transition-all hover:border-emerald-400 hover:shadow-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <Avatar name={b.creatorName} hue={b.avatarHue} size={36} />
                  <div>
                    <h4 className="font-display text-xs font-bold text-ink">{b.creatorName}</h4>
                    <p className="text-[10.5px] font-semibold text-ink-faint">{b.course}</p>
                  </div>
                </div>

                <span className="rounded-full bg-paper px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                  ⏱️ {b.duration} swap
                </span>
              </div>

              {/* Offer vs Seek Matrix */}
              <div className="space-y-1.5 bg-paper/90 p-3 rounded-xl border border-line/60 text-xs">
                <div className="flex items-start gap-2">
                  <span className="shrink-0 rounded-md bg-emerald-100 px-1.5 py-0.2 text-[9px] font-black uppercase text-emerald-800 border border-emerald-200">
                    Offers
                  </span>
                  <span className="font-bold text-ink">{b.offering}</span>
                </div>
                <div className="flex items-start gap-2 pt-1 border-t border-line/40">
                  <span className="shrink-0 rounded-md bg-amber-100 px-1.5 py-0.2 text-[9px] font-black uppercase text-amber-800 border border-amber-200">
                    Seeks
                  </span>
                  <span className="font-bold text-ink">{b.seeking}</span>
                </div>
              </div>

              <p className="text-xs text-ink-soft leading-relaxed italic">
                &quot;{b.note}&quot;
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-line/60">
                <span className="text-[10px] text-ink-faint font-semibold">
                  Zero money · Mutual learning
                </span>

                <button
                  onClick={() => handlePropose(b.id, b.creatorName)}
                  disabled={isProposed}
                  className={`cursor-pointer rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95 ${
                    isProposed
                      ? "bg-emerald-600 text-white opacity-90"
                      : "bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs"
                  }`}
                >
                  {isProposed ? "Proposal Sent ✓" : "Propose Barter Swap"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Post Barter Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-line bg-paper p-4 shadow-2xl animate-sheet-in space-y-3">
            <h3 className="font-display text-sm font-bold text-ink">
              List a Skill Barter Swap
            </h3>
            <p className="text-xs text-ink-faint">
              Offer what you&apos;re good at, request what you want to learn.
            </p>

            <div>
              <label className="text-[10px] font-bold text-ink-faint uppercase">
                What Can You Teach / Offer?
              </label>
              <input
                value={offeringInput}
                onChange={(e) => setOfferingInput(e.target.value)}
                placeholder="e.g. Figma wireframing / Chemistry tutoring"
                className="mt-1 w-full rounded-xl border border-line bg-cream px-3 py-2 text-xs font-bold text-ink outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-ink-faint uppercase">
                What Skill Are You Seeking in Return?
              </label>
              <input
                value={seekingInput}
                onChange={(e) => setSeekingInput(e.target.value)}
                placeholder="e.g. Guitar fingerpicking / Python recursion"
                className="mt-1 w-full rounded-xl border border-line bg-cream px-3 py-2 text-xs font-bold text-ink outline-none focus:border-emerald-600"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 cursor-pointer rounded-xl bg-cream py-2 text-xs font-bold text-ink-soft border border-line"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBarter}
                className="flex-1 cursor-pointer rounded-xl bg-emerald-700 hover:bg-emerald-800 py-2 text-xs font-bold text-white shadow-xs"
              >
                Publish Swap 🔄
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
