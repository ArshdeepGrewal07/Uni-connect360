"use client";

import { useCollection, useSavedState } from "@/hooks/use-campus-data";
import { useApp } from "@/app/page";
import { useState } from "react";
import {
  IconBuilding,
  IconChat,
  IconCheck,
  IconClock,
  IconSparkles,
  IconUsers,
} from "@/components/icons";

interface FreeSlotOverlap {
  day: string;
  time: string;
  friends: string[];
  recommendation: string;
}

const OVERLAPPING_SLOTS: FreeSlotOverlap[] = [
  {
    day: "Thursday",
    time: "2:00 PM – 4:00 PM",
    friends: ["Ishita", "Dev"],
    recommendation: "Both free for 2 hours · Ideal for cutting chai at Chai Tapri ☕",
  },
  {
    day: "Friday",
    time: "11:00 AM – 1:00 PM",
    friends: ["Aarav", "Rohan"],
    recommendation: "Shared free window · Perfect for gym workout or LeetCode sprint 💻",
  },
  {
    day: "Wednesday",
    time: "3:30 PM – 5:00 PM",
    friends: ["Meera", "Kabir"],
    recommendation: "Free post-lecture slot · Good for Central Library group study 📚",
  },
];

interface LectureChatRoom {
  id: string;
  roomName: string;
  course: string;
  activeStudents: number;
  unlocked: boolean;
  notes: { author: string; text: string; time: string }[];
  questions: { question: string; answers: number }[];
}

const LECTURE_ROOMS: LectureChatRoom[] = [
  {
    id: "lr-204",
    roomName: "Block 34 · Room 204 (Design Studio)",
    course: "DES204: Typography & Interaction Design",
    activeStudents: 28,
    unlocked: true, // User is inside/near
    notes: [
      { author: "Ishita", text: "Prof uploaded the grid layout Figma file to portal folder 4.", time: "10m ago" },
      { author: "Advait", text: "Remember term submission printouts due Monday 10 AM.", time: "25m ago" },
    ],
    questions: [
      { question: "Is the 8pt baseline grid mandatory for the mobile screens?", answers: 3 },
      { question: "Can we use custom Google fonts or system fonts only?", answers: 2 },
    ],
  },
  {
    id: "lr-208",
    roomName: "Block 34 · Room 208 (Lecture Theatre)",
    course: "CSE302: Distributed Operating Systems",
    activeStudents: 45,
    unlocked: true,
    notes: [
      { author: "Rohan", text: "Mid-sem test will cover Raft consensus and deadlock recovery.", time: "15m ago" },
    ],
    questions: [
      { question: "Difference between Lamport logical clock and vector clock?", answers: 4 },
    ],
  },
  {
    id: "lr-102",
    roomName: "Innovation Lab · Hardware Workshop",
    course: "ECE401: Embedded IoT Systems",
    activeStudents: 14,
    unlocked: false, // Locked until physically present
    notes: [],
    questions: [],
  },
];

interface ProjectMatchItem {
  id: string;
  title: string;
  target: string;
  summary: string;
  neededRoles: string[];
  members: string[];
  slotsOpen: number;
}

const PROJECT_MATCHES: ProjectMatchItem[] = [
  {
    id: "pm-1",
    title: "Autonomous Obstacle Drone with Edge AI",
    target: "HackNight 2026 Bounty (₹2L Pool)",
    summary: "Building lightweight drone firmware running YOLO-v8 on Raspberry Pi 5 for warehouse safety.",
    neededRoles: ["Embedded C++ / ROS", "PyTorch / Edge Model Optimization"],
    members: ["Aarav", "Dev"],
    slotsOpen: 2,
  },
  {
    id: "pm-2",
    title: "Campus P2P Textbook & Notes Exchange DApp",
    target: "Web3 Innovation Challenge",
    summary: "Smart contract book lending with student NFT verification to prevent stolen library books.",
    neededRoles: ["Solidity / Smart Contracts", "Next.js UI Designer"],
    members: ["Rohan", "Priya"],
    slotsOpen: 1,
  },
  {
    id: "pm-3",
    title: "NPTEL Deep Learning Exam Study Sprint",
    target: "NPTEL Elite Gold Certification",
    summary: "Intense daily 1-hour problem breakdown solving past assignment questions and tensor math.",
    neededRoles: ["2 Consistent Study Partners (ECE/CSE)"],
    members: ["Meera"],
    slotsOpen: 2,
  },
];

export function AcademicCollabHub({
  onToast,
}: {
  onToast?: (msg: string, tone?: "ok" | "warn") => void;
}) {
  const [subTab, setSubTab] = useState<"schedules" | "lecture" | "projects">("schedules");
  const {items:lectureRooms,mutate:lectureAction}=useCollection<LectureChatRoom>('lectures');
  const {items:projects,mutate:projectAction}=useCollection<ProjectMatchItem>('projects');
  const {items:schedules,mutate:scheduleAction}=useCollection<FreeSlotOverlap>('schedules');
  const [selectedRoomId,setSelectedRoomId]=useState('');
  const selectedLectureRoom=lectureRooms.find(r=>r.id===selectedRoomId)||lectureRooms[0]||{...LECTURE_ROOMS[0],notes:[],questions:[]};
  const [newNoteInput, setNewNoteInput] = useState("");
  const appliedProjects=projects.filter(p=>p.proposed).map(p=>p.id);

  const handlePostNote=async()=>{if(!newNoteInput.trim())return;if(!await lectureAction('note',{id:selectedLectureRoom.id,text:newNoteInput.trim()}))return;setNewNoteInput('');onToast?.('Lecture note saved.','ok');};
  const handleApplyProject=async(id:string,_title:string)=>{if(await projectAction('propose',{id}))onToast?.('Project application saved.','ok');};

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Sub Navigation Bar */}
      <div className="flex rounded-2xl border border-line bg-cream p-1 shadow-2xs">
        {[
          { key: "schedules", label: "📅 Squad Schedules" },
          { key: "lecture", label: "📍 Geo-Lecture Chats" },
          { key: "projects", label: "🚀 Project Matchmaker" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setSubTab(t.key as any)}
            className={`flex-1 cursor-pointer rounded-xl py-2 text-xs font-bold transition-all ${
              subTab === t.key
                ? "bg-pine text-cream shadow-xs"
                : "text-ink-soft hover:text-ink hover:bg-paper"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 1. SQUAD SCHEDULE OVERLAYS */}
      {subTab === "schedules" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="font-display text-xs font-bold text-ink flex items-center gap-1.5">
                <span>⚡</span> Automated Timetable Free Period Overlays
              </h3>
              <p className="text-[11px] text-ink-faint">
                Eliminates the &quot;where are you?&quot; text by detecting shared free slots
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {schedules.map((slot, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-pine/30 bg-gradient-to-r from-cream via-paper to-cream p-4 shadow-xs space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-pine px-2 py-0.5 text-[10px] font-black text-cream">
                      {slot.day}
                    </span>
                    <span className="font-mono text-xs font-bold text-ink">
                      {slot.time}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-pine">
                    <IconUsers size={13} />
                    <span>{slot.friends.join(" & ")}</span>
                  </div>
                </div>

                <p className="text-xs font-medium text-ink-soft bg-pine-soft/40 p-2.5 rounded-xl border border-pine/20 leading-relaxed">
                  💡 {slot.recommendation}
                </p>

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="text-ink-faint">Synced with Student Portal Timetable</span>
                  <button
                    onClick={async()=>{if(await scheduleAction("join",{id:slot.id}))onToast?.("Interest in this schedule saved.","ok");}}
                    className="cursor-pointer rounded-xl bg-paper px-3 py-1 text-[11px] font-bold text-pine border border-pine/40 shadow-2xs hover:bg-pine/5 active:scale-95"
                  >
                    Suggest Meetup ☕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. GEO-FENCED LECTURE CHATS */}
      {subTab === "lecture" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="font-display text-xs font-bold text-ink">
                Geo-Fenced Lecture Hall Threads
              </h3>
              <p className="text-[11px] text-ink-faint">
                Auto-unlocks when physically inside the room · Pool notes & questions
              </p>
            </div>
          </div>

          {/* Hall Selector */}
          <div className="grid grid-cols-3 gap-2">
            {lectureRooms.map((room) => {
              const isSelected = selectedLectureRoom.id === room.id;
              return (
                <button
                  key={room.id}
                  onClick={() => setSelectedRoomId(room.id)}
                  className={`cursor-pointer rounded-xl p-2.5 text-left border transition-all ${
                    isSelected
                      ? "border-pine bg-pine-soft/70 shadow-xs"
                      : "border-line bg-cream hover:bg-paper"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display text-xs font-bold text-ink truncate">
                      {room.roomName.split("·")[1]?.trim() || room.roomName}
                    </span>
                    {room.unlocked ? (
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    ) : (
                      <span className="text-[9px]">🔒</span>
                    )}
                  </div>
                  <p className="mt-1 text-[10px] text-ink-faint truncate">{room.course}</p>
                </button>
              );
            })}
          </div>

          {/* Active Hall Card */}
          {selectedLectureRoom.unlocked ? (
            <div className="rounded-2xl border border-line bg-cream p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-line pb-2">
                <div>
                  <h4 className="font-display text-sm font-bold text-ink">
                    {selectedLectureRoom.roomName}
                  </h4>
                  <p className="text-[11px] font-semibold text-pine">
                    {selectedLectureRoom.course}
                  </p>
                </div>
                <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  {selectedLectureRoom.activeStudents} inside
                </span>
              </div>

              {/* Shared Notes Snippets */}
              <div>
                <p className="text-[10.5px] font-bold uppercase tracking-wider text-ink-faint mb-1.5">
                  Live Shared Notes & Slides
                </p>
                <div className="space-y-1.5">
                  {selectedLectureRoom.notes.map((n, i) => (
                    <div
                      key={i}
                      className="rounded-xl bg-paper p-2.5 text-xs text-ink-soft border border-line/60"
                    >
                      <div className="flex items-center justify-between text-[10px] text-ink-faint font-semibold mb-0.5">
                        <span className="font-bold text-ink">{n.author}</span>
                        <span>{n.time}</span>
                      </div>
                      <p>{n.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Input to share note */}
              <div className="flex gap-2">
                <input
                  value={newNoteInput}
                  onChange={(e) => setNewNoteInput(e.target.value)}
                  placeholder="Share a formula, note snippet or slide #..."
                  className="flex-1 rounded-xl border border-line bg-paper px-3 py-2 text-xs text-ink outline-none focus:border-pine"
                />
                <button
                  onClick={handlePostNote}
                  className="cursor-pointer rounded-xl bg-pine px-3 py-2 text-xs font-bold text-cream shadow-xs active:scale-95"
                >
                  Post
                </button>
              </div>

              {/* Missed Questions Board */}
              <div className="pt-1">
                <p className="text-[10.5px] font-bold uppercase tracking-wider text-ink-faint mb-1">
                  Anonymous Questions to Lecturer
                </p>
                <div className="space-y-1.5">
                  {selectedLectureRoom.questions.map((q, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl bg-paper px-3 py-2 text-xs border border-line/60"
                    >
                      <span className="font-medium text-ink-soft">{q.question}</span>
                      <span className="rounded-md bg-amber-soft px-1.5 py-0.5 text-[10px] font-bold text-amber">
                        {q.answers} replies
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-line bg-cream/60 p-8 text-center space-y-2">
              <span className="text-2xl">🔒</span>
              <p className="font-display text-sm font-bold text-ink">
                Geo-Fenced: Walk to {selectedLectureRoom.roomName} to Unlock
              </p>
              <p className="text-xs text-ink-faint max-w-xs mx-auto">
                This live thread protects academic privacy and unlocks automatically when your campus pin enters the building.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 3. PROJECT MATCHMAKER */}
      {subTab === "projects" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="font-display text-xs font-bold text-ink">
                Hackathon & Research Team Matchmaker
              </h3>
              <p className="text-[11px] text-ink-faint">
                Find co-founders, hardware hackers, and NPTEL study partners
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {projects.map((pm) => {
              const hasApplied = appliedProjects.includes(pm.id);
              return (
                <div
                  key={pm.id}
                  className="rounded-2xl border border-line bg-cream p-4 shadow-2xs space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="rounded-md bg-purple-100 px-2 py-0.5 text-[9.5px] font-black text-purple-800 border border-purple-200 uppercase">
                        {pm.target}
                      </span>
                      <h4 className="mt-1 font-display text-sm font-bold text-ink">
                        {pm.title}
                      </h4>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 shrink-0">
                      {pm.slotsOpen} slots left
                    </span>
                  </div>

                  <p className="text-xs text-ink-soft leading-relaxed">
                    {pm.summary}
                  </p>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-ink-faint">
                      Needed Skills / Roles:
                    </span>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {pm.neededRoles.map((r, i) => (
                        <span
                          key={i}
                          className="rounded-lg bg-paper px-2 py-1 text-[10.5px] font-bold text-pine border border-pine/25 shadow-2xs"
                        >
                          ⚡ {r}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-line/60">
                    <span className="text-[11px] font-semibold text-ink-faint">
                      Led by: <strong>{pm.members.join(", ")}</strong>
                    </span>

                    <button
                      onClick={() => handleApplyProject(pm.id, pm.title)}
                      disabled={hasApplied}
                      className={`cursor-pointer rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95 ${
                        hasApplied
                          ? "bg-emerald-600 text-cream opacity-90"
                          : "bg-pine text-cream shadow-xs"
                      }`}
                    >
                      {hasApplied ? "Applied ✓" : "Apply to Team"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
