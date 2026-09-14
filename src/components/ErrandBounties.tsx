"use client";

import { useCollection, useSavedState } from "@/hooks/use-campus-data";
import { useApp } from "@/app/page";
import { useState } from "react";
import { Avatar } from "@/components/ui";

interface BountyTask {
  id: string;
  creatorName: string;
  avatarHue: number;
  dormCluster: string;
  title: string;
  deadline: string;
  reward: number; // in INR
  status: "open" | "claimed";
  claimedBy?: string;
}

const INITIAL_BOUNTIES: BountyTask[] = [
  {
    id: "eb-1",
    creatorName: "Dev Sharma",
    avatarHue: 96,
    dormCluster: "Hostel B → Block 34",
    title: "Need 8-page color architectural printout delivered to Room 204 desk before 9:30 AM",
    deadline: "Before 9:30 AM",
    reward: 40,
    status: "open",
  },
  {
    id: "eb-2",
    creatorName: "Aarav Mehta",
    avatarHue: 18,
    dormCluster: "Hostel A Cluster",
    title: "Borrow Casio fx-991EX Scientific Calculator for 2h mid-sem examination slot",
    deadline: "By 1:30 PM",
    reward: 25,
    status: "open",
  },
  {
    id: "eb-3",
    creatorName: "Ishita Rao",
    avatarHue: 330,
    dormCluster: "Main Campus Gate → Hostel C",
    title: "Pick up small Amazon parcel from Main Gate Hub locker on your walk back to hostels",
    deadline: "Today before 7 PM",
    reward: 35,
    status: "open",
  },
];

export function ErrandBounties({
  onToast,
}: {
  onToast?: (msg: string, tone?: "ok" | "warn") => void;
}) {
  const {items:bounties,mutate}=useCollection<BountyTask>('bounties');
  const {me}=useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [cluster, setCluster] = useState("Hostel A Cluster");
  const [rewardAmount, setRewardAmount] = useState(30);
  const [deadlineInput, setDeadlineInput] = useState("In 1 hour");

  const handleAccept = async (id:string,_title:string,_reward:number) => { if(await mutate('claim',{id}))onToast?.('Errand claimed. Arrange delivery and payment directly.','ok'); };
  const handlePostBounty = async () => {
    if(!taskTitle.trim())return;
    if(!await mutate('create',{data:{title:taskTitle.trim(),dormCluster:cluster,reward:rewardAmount,deadline:deadlineInput}}))return;
    onToast?.('Your errand is saved for campus members.','ok');setModalOpen(false);setTaskTitle('');
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="rounded-2xl border border-amber-300/60 bg-gradient-to-r from-amber-50 via-cream to-amber-50/40 p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-600 text-white shadow-xs">
              ⚡
            </span>
            <div>
              <h3 className="font-display text-sm font-bold text-ink">
                Campus Errand Bounties
              </h3>
              <p className="text-[11px] text-ink-faint">
                Quick peer favors & deliveries within hostel clusters
              </p>
            </div>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="cursor-pointer rounded-xl bg-amber-600 hover:bg-amber-700 px-3 py-1.5 text-xs font-bold text-white shadow-2xs active:scale-95"
          >
            + Post Bounty
          </button>
        </div>
      </div>

      {/* Bounty Cards */}
      <div className="space-y-3">
        {bounties.map((b) => {
          const isOpen = b.status === "open";
          const isMine = b.claimedBy === me?.user.firstName;

          return (
            <div
              key={b.id}
              className="rounded-2xl border border-line bg-cream p-4 shadow-2xs space-y-2.5 transition-all hover:border-amber-300 hover:shadow-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <Avatar name={b.creatorName} hue={b.avatarHue} size={36} />
                  <div>
                    <h4 className="font-display text-xs font-bold text-ink">{b.creatorName}</h4>
                    <p className="text-[10px] font-semibold text-ink-faint">📍 {b.dormCluster}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono text-base font-extrabold text-pine">
                    ₹{b.reward}
                  </span>
                  <span className="block text-[9px] font-bold text-ink-faint uppercase">
                    Bounty
                  </span>
                </div>
              </div>

              <p className="text-xs text-ink font-medium leading-relaxed">
                {b.title}
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-line/60">
                <span className="text-[10.5px] font-semibold text-amber-800">
                  ⏰ Deadline: {b.deadline}
                </span>

                {isOpen ? (
                  <button
                    onClick={() => handleAccept(b.id, b.title, b.reward)}
                    className="cursor-pointer rounded-xl bg-pine hover:bg-pine-deep px-3.5 py-1.5 text-xs font-bold text-cream shadow-xs active:scale-95"
                  >
                    Accept Bounty
                  </button>
                ) : (
                  <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    {isMine ? "You Accepted ✓" : "In Progress"}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Post Bounty Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-line bg-paper p-4 shadow-2xl animate-sheet-in space-y-3">
            <h3 className="font-display text-sm font-bold text-ink">
              Create Errand Bounty
            </h3>
            <p className="text-xs text-ink-faint">
              Drop a favor request for peers in your hostel or department cluster.
            </p>

            <div>
              <label className="text-[10px] font-bold text-ink-faint uppercase">
                Task Description
              </label>
              <textarea
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="e.g. Need 4 A4 printouts delivered to Hostel C lobby before 9 AM"
                rows={2}
                className="mt-1 w-full resize-none rounded-xl border border-line bg-cream px-3 py-2 text-xs text-ink outline-none focus:border-amber-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-ink-faint uppercase">
                  Location / Route
                </label>
                <input
                  value={cluster}
                  onChange={(e) => setCluster(e.target.value)}
                  placeholder="e.g. Hostel A Cluster"
                  className="mt-1 w-full rounded-xl border border-line bg-cream px-3 py-2 text-xs font-semibold text-ink outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-ink-faint uppercase">
                  Bounty Reward (₹)
                </label>
                <input
                  type="number"
                  value={rewardAmount}
                  onChange={(e) => setRewardAmount(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-line bg-cream px-3 py-2 text-xs font-mono font-bold text-ink outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 cursor-pointer rounded-xl bg-cream py-2 text-xs font-bold text-ink-soft border border-line"
              >
                Cancel
              </button>
              <button
                onClick={handlePostBounty}
                className="flex-1 cursor-pointer rounded-xl bg-amber-600 hover:bg-amber-700 py-2 text-xs font-bold text-white shadow-xs"
              >
                Post Bounty ⚡
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
