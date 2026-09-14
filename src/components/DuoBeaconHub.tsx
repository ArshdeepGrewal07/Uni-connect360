'use client';

import { useFocus } from "@/hooks/use-focus";
import { useCollection,useSavedState } from "@/hooks/use-campus-data";
import { useState, useEffect } from 'react';
import { useCampusMode } from '@/context/AppModeContext';
import { Avatar } from '@/components/ui';
import {
  IconCheck,
  IconClock,
  IconPause,
  IconPlay,
  IconRadar,
  IconSparkles,
  IconUserPlus,
} from '@/components/icons';

interface ChaiPing {
  id: string;
  creatorName: string;
  avatarHue: number;
  location: string;
  activity: string;
  expiresInMinutes: number;
  acceptedCount: number;
}

const INITIAL_PINGS: ChaiPing[] = [
  {
    id: 'ping-1',
    creatorName: 'Rohan Mehta',
    avatarHue: 44,
    location: 'Chai Tapri (Central Quad)',
    activity: 'Grabbing fresh ginger chai + bun maska before 11 AM lecture! ☕',
    expiresInMinutes: 9,
    acceptedCount: 1,
  },
  {
    id: 'ping-2',
    creatorName: 'Simran Kaur',
    avatarHue: 210,
    location: 'Central Lawn Gazebo',
    activity: '15-min open-air break between studio design critiques 🌿',
    expiresInMinutes: 14,
    acceptedCount: 2,
  },
];

const SEED_DUEL_QUESTIONS = [
  {
    q: 'In relational databases, which normal form eliminates transitive dependencies?',
    options: ['1NF', '2NF', '3NF', 'BCNF'],
    answer: 2,
    topic: 'Database Engineering',
  },
  {
    q: 'Which protocol operates at the Transport Layer of the OSI stack?',
    options: ['IP', 'TCP', 'HTTP', 'Ethernet'],
    answer: 1,
    topic: 'Computer Networks',
  },
  {
    q: 'In UX architecture, what does the term "Affordance" refer to?',
    options: ['Software cost', 'Visual cue indicating function', 'Server latency', 'Screen density'],
    answer: 1,
    topic: 'Design Systems',
  },
];

export function DuoBeaconHub({
  onConnect,
  onToast,
}: {
  onConnect?: (studentName: string, subject: string) => void;
  onToast?: (msg: string, tone?: 'ok' | 'warn') => void;

}) {

  const {items:stored_DUEL_QUESTIONS}=useCollection<(typeof SEED_DUEL_QUESTIONS)[number]>('duel_questions');
  const DUEL_QUESTIONS=stored_DUEL_QUESTIONS.length?stored_DUEL_QUESTIONS:SEED_DUEL_QUESTIONS;
  const { duoBeacons, broadcastDuoBeacon, clearMyDuoBeacon } = useCampusMode();

  const [activeTab, setActiveTab] = useState<'beacons' | 'sprint' | 'chai' | 'duel'>('beacons');

  // Broadcast modal state
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [subjectInput, setSubjectInput] = useState('');
  const [goalInput, setGoalInput] = useState('');

  // Pair Sprint state
  const focus=useFocus('duo',25);
  const pairTimer=focus.seconds,pairRunning=focus.running;
  const [partnerName] = useState('Kabir V. (B.Tech ECE)');
  const [pairTasks, setPairTasks] = useSavedState('pairTasks',[
    { id: 'pt-1', text: 'Solve Kinematics Equation Set A', done: true },
    { id: 'pt-2', text: 'Cross-check circuit schematic diagram', done: false },
    { id: 'pt-3', text: '5-minute rapid recap discussion', done: false },
  ]);

  // Chai Pings state
  const {items:pings,mutate:pingAction}=useCollection<ChaiPing>('chai');
  const [pingInput, setPingInput] = useState('');
  const [showPingModal, setShowPingModal] = useState(false);

  // Peer Duel state
  const [duelIndex, setDuelIndex] = useState(0);
  const [myScore, setMyScore] = useSavedState('myScore',0);
  const [partnerScore, setPartnerScore] = useSavedState('partnerScore',0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [duelAnswered, setDuelAnswered] = useState(false);

  // Pair Pomodoro timer countdown
  const pMins = Math.floor(pairTimer / 60);
  const pSecs = pairTimer % 60;
  const pairTimeFormatted = `${String(pMins).padStart(2, '0')}:${String(pSecs).padStart(2, '0')}`;

  const myBeacon = duoBeacons.find((b) => b.isMine);

  const handleBroadcast = async () => {
    if (!subjectInput.trim() || !goalInput.trim()) return;
    if(!await broadcastDuoBeacon({
      subject: subjectInput.trim(),
      goal: goalInput.trim(),
    }))return;
    onToast?.('Duo Matchmaking Beacon is live on campus! Classmates can find you.', 'ok');
    setBroadcastOpen(false);
    setSubjectInput('');
    setGoalInput('');
  };

  const handleConnect = (name: string, subject: string) => {
    onConnect?.(name, subject);

  };

  const handleCreatePing=async(e:React.FormEvent)=>{
    e.preventDefault();if(!pingInput.trim())return;
    if(!await pingAction('create',{data:{activity:pingInput.trim(),location:'Central Canteen Patio'}}))return;
    setPingInput('');setShowPingModal(false);onToast?.('Meetup saved for campus members.','ok');
  };

  const handleAnswerDuel = (optIdx: number) => {
    if (duelAnswered) return;
    setSelectedOption(optIdx);
    setDuelAnswered(true);
    const isCorrect = optIdx === DUEL_QUESTIONS[duelIndex].answer;
    if (isCorrect) {
      setMyScore((s) => s + 1);
      onToast?.('Correct! +1 point in Peer Duel 🎯', 'ok');
    } else {
      setPartnerScore((s) => s + 1);
      onToast?.('Close one! Correct answer revealed.', 'warn');
    }
  };

  const handleNextDuelQuestion = () => {
    setSelectedOption(null);
    setDuelAnswered(false);
    setDuelIndex((i) => (i + 1) % DUEL_QUESTIONS.length);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Duo Status Hub */}
      <div className="rounded-3xl border border-amber-300/60 bg-gradient-to-r from-[#fef3c7] via-[#fef9c3] to-[#fffbeb] p-4 text-ink shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-xs">
              <IconRadar size={19} />
            </span>
            <div>
              <h3 className="font-display text-sm font-bold text-ink">Duo Buddy Radar</h3>
              <p className="text-[11px] text-ink-soft">
                Low-pressure 1-on-1 study sprints, tea meetups & duels
              </p>
            </div>
          </div>

          {myBeacon ? (
            <button
              onClick={() => {
                clearMyDuoBeacon();
                onToast?.('Beacon stopped.', 'ok');
              }}
              className="cursor-pointer rounded-xl bg-amber-800 px-3 py-1.5 text-xs font-bold text-white shadow-2xs active:scale-95"
            >
              Stop Beacon
            </button>
          ) : (
            <button
              onClick={() => setBroadcastOpen(true)}
              className="cursor-pointer rounded-xl bg-amber-600 hover:bg-amber-700 px-3 py-1.5 text-xs font-bold text-white shadow-2xs active:scale-95"
            >
              + Broadcast
            </button>
          )}
        </div>

        {/* Duo Activity Tabs */}
        <div className="mt-3.5 grid grid-cols-4 gap-1 p-1 rounded-2xl bg-amber-200/50 border border-amber-300/50">
          {[
            { key: 'beacons', label: 'Radar', icon: '📡' },
            { key: 'sprint', label: 'Pair Sprint', icon: '⏱️' },
            { key: 'chai', label: 'Chai Ping', icon: '☕' },
            { key: 'duel', label: 'Peer Duel', icon: '⚔️' },
          ].map((t) => {
            const active = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key as any)}
                className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all active:scale-95 flex items-center justify-center gap-1 ${
                  active
                    ? 'bg-amber-800 text-white shadow-xs'
                    : 'text-amber-900 hover:bg-amber-200/60'
                }`}
              >
                <span>{t.icon}</span>
                <span className="truncate">{t.label}</span>
              </button>
            );
          })}
        </div>

        {myBeacon && activeTab === 'beacons' && (
          <div className="mt-3 flex items-center justify-between bg-white/80 p-2.5 rounded-xl border border-amber-300 text-xs">
            <div className="min-w-0 flex-1 pr-2">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                <strong className="font-bold text-ink truncate">
                  Active: {myBeacon.subject}
                </strong>
              </div>
              <p className="text-[11px] text-ink-soft truncate">{myBeacon.goal}</p>
            </div>
            <span className="shrink-0 text-[10px] font-bold text-amber-800">
              60m Live
            </span>
          </div>
        )}
      </div>

      {/* 1. BEACONS RADAR TAB */}
      {activeTab === 'beacons' && (
        <div className="space-y-3 animate-fade-in">
          <div className="flex items-center justify-between px-1">
            <h4 className="font-display text-xs font-bold text-ink">
              Live Study & Project Partner Beacons
            </h4>
            <span className="text-[10px] font-bold text-ink-faint">
              {duoBeacons.length} beacons live
            </span>
          </div>

          <div className="space-y-2.5">
            {duoBeacons.map((beacon) => (
              <div
                key={beacon.id}
                className={`rounded-2xl border p-4 shadow-2xs space-y-2.5 transition-all ${
                  beacon.isMine
                    ? 'border-amber-400 bg-amber-50/70'
                    : 'border-line bg-cream hover:border-amber-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={beacon.creatorName} hue={beacon.avatarHue} size={36} />
                    <div>
                      <h5 className="font-display text-xs font-bold text-ink">
                        {beacon.creatorName} {beacon.isMine && '(You)'}
                      </h5>
                      <p className="text-[10.5px] font-semibold text-ink-faint">
                        {beacon.course} · Year {beacon.year}
                      </p>
                    </div>
                  </div>

                  <span className="rounded-full bg-paper px-2 py-0.5 text-[9.5px] font-bold text-amber-800 border border-amber-200/60 shrink-0">
                    ⏳ {beacon.expiresInMinutes}m left
                  </span>
                </div>

                <div>
                  <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-800 border border-amber-200 uppercase">
                    {beacon.subject}
                  </span>
                  <p className="mt-1.5 text-xs text-ink-soft leading-relaxed">
                    &ldquo;{beacon.goal}&rdquo;
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-line/60">
                  <span className="text-[10px] text-ink-faint">
                    ✨ Instant 1-on-1 text channel
                  </span>

                  {!beacon.isMine && (
                    <button
                      onClick={() => handleConnect(beacon.creatorName, beacon.subject)}
                      className="cursor-pointer flex items-center gap-1.5 rounded-xl bg-pine px-3 py-1.5 text-xs font-bold text-cream shadow-xs active:scale-95"
                    >
                      <IconUserPlus size={13} />
                      <span>Partner Up</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. PAIR STUDY SPRINT TAB */}
      {activeTab === 'sprint' && (
        <div className="p-4 rounded-2xl border border-line bg-cream shadow-sm space-y-3.5 animate-fade-in text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-line">
            <div className="flex items-center gap-2">
              <Avatar name="Kabir" hue={210} size={32} />
              <div>
                <h4 className="font-bold text-ink text-xs">Pair Sprint: You & {partnerName}</h4>
                <p className="text-[10px] text-pine font-semibold">● Both in Synchronized Focus Room</p>
              </div>
            </div>
            <button
              onClick={() => onToast?.('Keep going! This is your saved practice session. ✋', 'ok')}
              className="px-2.5 py-1 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[10px] border border-amber-300 transition active:scale-95"
            >
              ✋ Nudge
            </button>
          </div>

          <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-paper border border-line">
            <span className="text-[10px] font-bold text-ink-faint tracking-widest uppercase">
              Dual Pomodoro Countdown
            </span>
            <div className="font-mono text-3xl font-black text-ink my-1 tracking-tight">
              {pairTimeFormatted}
            </div>
            <div className="flex gap-2 mt-1">
              <button
                onClick={focus.toggle}
                className={`px-4 py-1.5 rounded-xl font-bold text-xs text-white shadow-xs transition active:scale-95 flex items-center gap-1 ${
                  pairRunning ? 'bg-amber-700' : 'bg-pine'
                }`}
              >
                {pairRunning ? 'Pause Sprint' : 'Start Dual Sprint'}
              </button>
              <button
                onClick={() => {
                  void focus.reset();
                }}
                className="px-3 py-1.5 rounded-xl border border-line bg-cream text-ink font-semibold text-xs"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Shared Sprint Agenda */}
          <div>
            <p className="text-[11px] font-bold text-ink mb-1.5">Shared Session Deliverables:</p>
            <div className="space-y-1.5">
              {pairTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() =>
                    setPairTasks((prev) =>
                      prev.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t))
                    )
                  }
                  className={`w-full p-2 rounded-xl border text-left flex items-center gap-2 transition ${
                    task.done
                      ? 'bg-pine/10 border-pine/30 text-pine line-through opacity-80'
                      : 'bg-paper border-line text-ink'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold border ${
                      task.done ? 'bg-pine text-cream border-pine' : 'border-line bg-cream'
                    }`}
                  >
                    {task.done && '✓'}
                  </span>
                  <span>{task.text}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. CHAI MEETUP PINGS TAB */}
      {activeTab === 'chai' && (
        <div className="space-y-3 animate-fade-in text-xs">
          <div className="flex items-center justify-between px-1">
            <div>
              <h4 className="font-bold text-ink text-xs">Spontaneous 15-Min Meetup Pings</h4>
              <p className="text-[10px] text-ink-faint">Chai, coffee or quick quad strolls right now</p>
            </div>
            <button
              onClick={() => setShowPingModal(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-xs active:scale-95"
            >
              + Drop Ping
            </button>
          </div>

          <div className="space-y-2">
            {pings.map((p) => (
              <div
                key={p.id}
                className="p-3.5 rounded-2xl border border-line bg-cream shadow-2xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar name={p.creatorName} hue={p.avatarHue} size={30} />
                    <div>
                      <span className="font-bold text-ink">{p.creatorName}</span>
                      <p className="text-[10px] text-amber-800 font-semibold">📍 {p.location}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                    ⏳ {p.expiresInMinutes}m left
                  </span>
                </div>

                <p className="text-xs text-ink-soft bg-paper p-2 rounded-xl border border-line/60">
                  {p.activity}
                </p>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-pine font-semibold">
                    👥 {p.acceptedCount} classmates joining
                  </span>
                  <button
                    onClick={async()=>{if(await pingAction('join',{id:p.id}))onToast?.('Meetup joined.','ok');}}
                    className="px-3 py-1 rounded-xl bg-pine hover:bg-pine-deep text-cream font-bold text-[11px] shadow-xs active:scale-95"
                  >
                    Join Up ☕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. PEER STUDY DUEL TAB */}
      {activeTab === 'duel' && (
        <div className="p-4 rounded-2xl border border-line bg-cream shadow-sm space-y-3 animate-fade-in text-xs">
          {/* Scoreboard */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-paper border border-line">
            <div className="flex items-center gap-2">
              <Avatar name="Anya" hue={155} size={28} />
              <div>
                <span className="font-bold text-ink">You</span>
                <p className="font-mono text-xs font-black text-pine">{myScore} pts</p>
              </div>
            </div>

            <div className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-black text-[10px] border border-amber-300">
              VS
            </div>

            <div className="flex items-center gap-2 text-right">
              <div>
                <span className="font-bold text-ink">Kabir</span>
                <p className="font-mono text-xs font-black text-amber-800">{partnerScore} pts</p>
              </div>
              <Avatar name="Kabir" hue={210} size={28} />
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-bold text-pine uppercase tracking-wider">
              Question {duelIndex + 1} of {DUEL_QUESTIONS.length} · {DUEL_QUESTIONS[duelIndex].topic}
            </span>
            <p className="font-bold text-ink text-xs leading-relaxed">
              &ldquo;{DUEL_QUESTIONS[duelIndex].q}&rdquo;
            </p>

            <div className="space-y-1.5 pt-1">
              {DUEL_QUESTIONS[duelIndex].options.map((opt, idx) => {
                const isCorrect = idx === DUEL_QUESTIONS[duelIndex].answer;
                const isChosen = selectedOption === idx;
                let btnStyle = 'bg-paper border-line hover:border-pine';

                if (duelAnswered) {
                  if (isCorrect) btnStyle = 'bg-emerald-100 border-emerald-500 text-emerald-950 font-bold';
                  else if (isChosen) btnStyle = 'bg-rose-100 border-rose-400 text-rose-950';
                }

                return (
                  <button
                    key={opt}
                    onClick={() => handleAnswerDuel(idx)}
                    className={`w-full p-2.5 rounded-xl border text-left transition text-xs font-semibold ${btnStyle}`}
                  >
                    <span className="mr-2 text-[10px] font-mono font-bold text-ink-faint">
                      {String.fromCharCode(65 + idx)}.
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>

            {duelAnswered && (
              <button
                onClick={handleNextDuelQuestion}
                className="w-full mt-2 py-2 rounded-xl bg-pine hover:bg-pine-deep text-cream font-bold text-xs shadow-xs transition active:scale-95"
              >
                Next Duel Question →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Broadcast Modal */}
      {broadcastOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-line bg-paper p-4 shadow-2xl animate-sheet-in space-y-3">
            <h3 className="font-display text-sm font-bold text-ink">
              Broadcast Duo Matchmaking Beacon
            </h3>
            <p className="text-xs text-ink-faint">
              Broadcast an academic or project need across campus for 1 hour.
            </p>

            <div>
              <label className="text-[10px] font-bold text-ink-faint uppercase">
                Subject / Goal Topic
              </label>
              <input
                value={subjectInput}
                onChange={(e) => setSubjectInput(e.target.value)}
                placeholder="e.g. Robotics Exam Prep / Canvas Game Dev"
                className="mt-1 w-full rounded-xl border border-line bg-cream px-3 py-2 text-xs font-bold text-ink outline-none focus:border-pine"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-ink-faint uppercase">
                Short Description of What You Need
              </label>
              <textarea
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                placeholder="e.g. Looking for a study buddy to review kinematics problem sets at Library Floor 2..."
                rows={3}
                className="mt-1 w-full resize-none rounded-xl border border-line bg-cream px-3 py-2 text-xs text-ink outline-none focus:border-pine"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setBroadcastOpen(false)}
                className="flex-1 cursor-pointer rounded-xl bg-cream py-2 text-xs font-bold text-ink-soft border border-line"
              >
                Cancel
              </button>
              <button
                onClick={handleBroadcast}
                className="flex-1 cursor-pointer rounded-xl bg-amber-600 hover:bg-amber-700 py-2 text-xs font-bold text-white shadow-xs"
              >
                Launch Beacon 📡
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chai Ping Modal */}
      {showPingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-line bg-paper p-4 shadow-2xl animate-sheet-in space-y-3">
            <h3 className="font-display text-sm font-bold text-ink">
              Drop a 15-Min Meetup Ping ☕
            </h3>
            <p className="text-xs text-ink-faint">
              Invite friends or nearby classmates for a quick spontaneous hangout.
            </p>

            <form onSubmit={handleCreatePing} className="space-y-3">
              <textarea
                value={pingInput}
                onChange={(e) => setPingInput(e.target.value)}
                placeholder="e.g. Grabbing cutting chai + samosa at Tapri right now! Anyone free to join?"
                rows={3}
                className="w-full rounded-xl border border-line bg-cream px-3 py-2 text-xs text-ink outline-none focus:border-pine"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPingModal(false)}
                  className="flex-1 rounded-xl bg-cream py-2 text-xs font-bold text-ink-soft border border-line"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!pingInput.trim()}
                  className="flex-1 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 py-2 text-xs font-bold text-white shadow-xs"
                >
                  Broadcast Ping ☕
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
