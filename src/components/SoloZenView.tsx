'use client';

import { useFocus } from "@/hooks/use-focus";
import { useSavedState, useCollection } from "@/hooks/use-campus-data";
import { useEffect, useState } from 'react';
import {
  IconCheck,
  IconClock,
  IconLeaf,
  IconMap,
  IconNavigation,
  IconPause,
  IconPlay,
  IconSparkles,
} from '@/components/icons';

interface QuietSpot {
  id: string;
  name: string;
  location: string;
  decibels: number;
  vibe: string;
  freeDesks: string;
  x: number;
  y: number;
}

interface SoloQuest {
  id: string;
  title: string;
  subtitle: string;
  durationMins: number;
  distanceMetres: number;
  noiseLevel: string;
  badge: string;
  completed: boolean;
  waypoints: string[];
}

interface Flashcard {
  id: string;
  subject: string;
  question: string;
  answer: string;
  reviewed?: boolean;
}

const SEED_QUIET_SPOTS: QuietSpot[] = [
  {
    id: 'qs-1',
    name: 'Central Library Floor 2 · Reading Room 3',
    location: 'Central Library (North Wing)',
    decibels: 18,
    vibe: 'Whisper-only · Power sockets at every desk',
    freeDesks: '14 desks open',
    x: 42,
    y: 14,
  },
  {
    id: 'qs-2',
    name: 'Block 34 · 4th Floor Drafting Nook',
    location: 'Block 34 (School of Design)',
    decibels: 20,
    vibe: 'Natural north light · Empty after 2 PM',
    freeDesks: '8 drafting tables open',
    x: 18,
    y: 24,
  },
  {
    id: 'qs-3',
    name: 'Secret Garden Stone Benches',
    location: 'Behind Central Quad Water Fountain',
    decibels: 24,
    vibe: 'Outdoor open breeze · Shaded banyan canopy',
    freeDesks: '5 stone benches free',
    x: 52,
    y: 45,
  },
  {
    id: 'qs-4',
    name: 'Auditorium Quiet Terrace',
    location: 'Shanti Devi Auditorium (Upper Mezzanine)',
    decibels: 21,
    vibe: 'Serene mountain views · Ideal for reading',
    freeDesks: '10 lounge chairs open',
    x: 64,
    y: 14,
  },
];

const INITIAL_QUESTS: SoloQuest[] = [
  {
    id: 'quest-1',
    title: 'Botanical Zen Walk',
    subtitle: 'Mindful stroll through old campus greenery',
    durationMins: 15,
    distanceMetres: 480,
    noiseLevel: '16–22 dB',
    badge: '🌿 Zen Walker',
    completed: false,
    waypoints: ['Central Lawn Banyan', 'Lotus Pond Deck', 'Silent Pine Pergola'],
  },
  {
    id: 'quest-2',
    title: 'Architecture & Geometry Trail',
    subtitle: 'Explore symmetry, skylights & cantilevered bridges',
    durationMins: 20,
    distanceMetres: 620,
    noiseLevel: '22–28 dB',
    badge: '🏛️ Campus Cartographer',
    completed: false,
    waypoints: ['Block 34 Glass Atrium', 'Aero Spiral Staircase', 'Sculpture Courtyard'],
  },
  {
    id: 'quest-3',
    title: 'Twilight Rooftop Meditation',
    subtitle: 'Elevated open sky sanctuary with mountain breeze',
    durationMins: 12,
    distanceMetres: 340,
    noiseLevel: '14–18 dB',
    badge: '🌅 Sunset Sage',
    completed: true,
    waypoints: ['Auditorium Mezzanine', 'Rooftop Solar Observatory', 'Perimeter Overlook'],
  },
];

const SEED_FLASHCARDS: Flashcard[] = [
  {
    id: 'fc-1',
    subject: 'Algorithms & Systems',
    question: 'What is the time complexity of Dijkstra with a Fibonacci Heap?',
    answer: 'O(E + V log V), significantly faster on dense graphs than standard binary heaps.',
  },
  {
    id: 'fc-2',
    subject: 'UX & Interaction',
    question: 'What does Hick’s Law state for digital navigation design?',
    answer: 'The time it takes to make a decision increases logarithmically with the number and complexity of choices.',
  },
  {
    id: 'fc-3',
    subject: 'Computer Networks',
    question: 'How does TCP congestion avoidance calculate the additive increase window?',
    answer: 'CWND += 1 MSS per RTT once slow-start threshold (ssthresh) is reached.',
  },
];

export function SoloZenView({
  onNavigateToSpot,
}: {
  onNavigateToSpot?: (spot: QuietSpot) => 

void;
}) {

  const {items:stored_QUIET_SPOTS}=useCollection<(typeof SEED_QUIET_SPOTS)[number]>('quiet_spots');
  const QUIET_SPOTS=stored_QUIET_SPOTS.length?stored_QUIET_SPOTS:SEED_QUIET_SPOTS;

  const {items:stored_FLASHCARDS}=useCollection<(typeof SEED_FLASHCARDS)[number]>('flashcards');
  const FLASHCARDS=stored_FLASHCARDS.length?stored_FLASHCARDS:SEED_FLASHCARDS;
  const [activeTab, setActiveTab] = useState<'timer' | 'quests' | 'quiz' | 'radar'>('timer');

  // Focus Timer state (default 25 minutes = 1500 seconds)
  const [focusMinutes, setFocusMinutes] = useSavedState('focusMinutes',25);
  const focus=useFocus('solo',focusMinutes);
  const secondsLeft=focus.seconds,timerRunning=focus.running;
  const [activeSound, setActiveSound] = useSavedState<string | null>('activeSound','rain');
  const focusStats=focus.stats;

  // Solo Quests state
  const [quests, setQuests] = useSavedState<SoloQuest[]>('quests',INITIAL_QUESTS.map(q=>({...q,completed:false})));
  const [activeQuestId, setActiveQuestId] = useState<string | null>(null);

  // Flashcards state
  const [cardIndex, setCardIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [xp, setXp] = useSavedState('xp',0);
  const [streak, setStreak] = useSavedState('streak',0);

  // Daily focus goals checklist
  const [goals, setGoals] = useSavedState('goals',[
    { id: 'g1', text: 'Complete 25m Pomodoro Focus Sprint', done: false },
    { id: 'g2', text: 'Visit 1 Low-Noise Haven (<25 dB)', done: false },
    { id: 'g3', text: 'Review 3 Academic Flashcard Concepts', done: false },
  ]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const toggleQuest = (id: string) => {
    setQuests((prev) =>
      prev.map((q) => {
        if (q.id === id) {
          const updated = !q.completed;
          if (updated) setXp((x) => x + 50);
          return { ...q, completed: updated };
        }
        return q;
      })
    );
  };

  const handleNextCard = () => {
    setRevealed(false);
    setCardIndex((i) => (i + 1) % FLASHCARDS.length);
    setXp((x) => x + 15);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Zen Status Banner */}
      <div className="rounded-3xl border border-[#52796f]/40 bg-gradient-to-r from-[#22332c] via-[#2d4038] to-[#1a2621] p-4 text-[#e9f2eb] shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <IconLeaf size={19} />
            </span>
            <div>
              <h2 className="font-display text-sm font-bold text-white">Solo Zen Sanctuary</h2>
              <p className="text-[11px] text-[#cad2c5]">
                DND Active · Friends see you as &ldquo;Deep in Focus&rdquo;
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-300 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-500/30">
            <span>🔥</span> {streak}d streak · {xp} XP
          </div>
        </div>

        {/* Solo Activity Sub-Tab Selector */}
        <div className="mt-3.5 grid grid-cols-4 gap-1 p-1 rounded-2xl bg-black/35 border border-white/10">
          {[
            { key: 'timer', label: 'Pomodoro', icon: '⏱️' },
            { key: 'quests', label: 'Zen Walks', icon: '🌿' },
            { key: 'quiz', label: 'Flashcards', icon: '⚡' },
            { key: 'radar', label: 'Quiet Spots', icon: '🤫' },
          ].map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all active:scale-95 flex items-center justify-center gap-1 ${
                  active
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{tab.icon}</span>
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 1. FOCUS TIMER DIAL */}
        {activeTab === 'timer' && (
          <div className="mt-3.5 flex flex-col items-center justify-center rounded-2xl bg-black/25 p-4 border border-white/10 backdrop-blur-xs animate-fade-in">
            <span className="text-[11px] font-bold tracking-widest text-[#84a98c] uppercase">
              Synchronized Focus Dial
            </span>
            <div className="font-mono text-4xl font-extrabold text-white tracking-tight my-1 drop-shadow-sm">
              {timeFormatted}
            </div>

            <label className="my-2 text-xs text-white">Focus duration
              <select aria-label="Focus duration" value={focusMinutes} disabled={timerRunning} onChange={event => { const n = Number(event.target.value); setFocusMinutes(n); }} className="ml-2 rounded-lg bg-emerald-900 p-2 text-white">
                {[5, 10, 15, 25, 30, 45, 60].map(n => <option key={n} value={n}>{n} minutes</option>)}
              </select>
            </label>
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={focus.toggle}
                className={`flex cursor-pointer items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-bold transition-all active:scale-95 ${
                  timerRunning ? 'bg-amber-600 text-white shadow-xs' : 'bg-emerald-600 text-white shadow-xs'
                }`}
              >
                {timerRunning ? (
                  <>
                    <IconPause size={14} /> Pause
                  </>
                ) : (
                  <>
                    <IconPlay size={14} /> Start Focus
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  void focus.reset();
                }}
                className="cursor-pointer rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-white/80 hover:text-white transition-colors"
              >
                Reset
              </button>
            </div>

            <div className="mt-3 flex items-center gap-4 text-[10px] text-[#cad2c5]">
              <span>🎯 Today: {focusStats.sessionsToday} sessions</span>
              <span>⏳ {focusStats.minutesCompleted} mins focused</span>
            </div>

            {/* Ambient Audio Selector */}
            <div className="mt-3 w-full border-t border-white/10 pt-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#84a98c] mb-1.5">
                Focus Audio Soundscape
              </p>
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                {[
                  { id: 'rain', label: '🌧️ Campus Rain' },
                  { id: 'leaves', label: '🍃 Quad Breeze' },
                  { id: 'library', label: '📚 Library Hum' },
                  { id: 'binaural', label: '🧠 40Hz Gamma Beats' },
                  { id: 'lofi', label: '🎧 Lofi Cafe' },
                ].map((snd) => {
                  const isPlaying = activeSound === snd.id;
                  return (
                    <button
                      key={snd.id}
                      onClick={() => setActiveSound(isPlaying ? null : snd.id)}
                      className={`cursor-pointer shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-semibold border transition-all ${
                        isPlaying
                          ? 'bg-emerald-700 text-white border-emerald-400 shadow-xs'
                          : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {snd.label} {isPlaying && '•'}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 2. SOLO MINDFUL CAMPUS WALKS / QUESTS */}
        {activeTab === 'quests' && (
          <div className="mt-3.5 space-y-2.5 animate-fade-in">
            <div className="flex items-center justify-between text-xs text-white/80">
              <span className="font-bold">Mindful Exploration Trails</span>
              <span className="text-[10px] text-emerald-300">Earn Badges on Arrival</span>
            </div>

            {quests.map((q) => (
              <div
                key={q.id}
                className="p-3 rounded-2xl bg-black/25 border border-white/10 space-y-2 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-white text-xs">{q.title}</h4>
                    <p className="text-[11px] text-white/70 leading-snug">{q.subtitle}</p>
                  </div>
                  <button
                    onClick={() => toggleQuest(q.id)}
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border transition active:scale-95 ${
                      q.completed
                        ? 'bg-emerald-600/60 text-emerald-200 border-emerald-500'
                        : 'bg-white/10 text-white/80 border-white/20 hover:bg-white/20'
                    }`}
                  >
                    {q.completed ? '✓ Completed' : 'Check In'}
                  </button>
                </div>

                <div className="flex items-center gap-3 text-[10px] text-white/60">
                  <span>⏱️ {q.durationMins} mins</span>
                  <span>📍 ~{q.distanceMetres}m walk</span>
                  <span>🤫 {q.noiseLevel}</span>
                  <span className="ml-auto font-bold text-emerald-300">{q.badge}</span>
                </div>

                {/* Waypoints */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-white/5 text-[10px]">
                  <span className="text-white/40">Waypoints:</span>
                  {q.waypoints.map((wp, idx) => (
                    <span key={wp} className="px-1.5 py-0.5 rounded bg-white/10 text-white/80">
                      {idx + 1}. {wp}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 3. SOLO KNOWLEDGE SPRINT (FLASHCARDS) */}
        {activeTab === 'quiz' && (
          <div className="mt-3.5 p-4 rounded-2xl bg-black/25 border border-white/10 text-xs space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                {FLASHCARDS[cardIndex].subject}
              </span>
              <span className="text-[10px] text-white/60">
                Card {cardIndex + 1} of {FLASHCARDS.length}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-white/10 border border-white/10 min-h-[90px] flex flex-col justify-center">
              <p className="font-display text-xs font-bold text-white leading-relaxed">
                &ldquo;{FLASHCARDS[cardIndex].question}&rdquo;
              </p>

              {revealed && (
                <div className="mt-2.5 pt-2.5 border-t border-white/10 animate-fade-up">
                  <p className="text-[11px] text-emerald-200 font-semibold leading-relaxed">
                    💡 {FLASHCARDS[cardIndex].answer}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              {!revealed ? (
                <button
                  onClick={() => setRevealed(true)}
                  className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition active:scale-95"
                >
                  Reveal Key Concept
                </button>
              ) : (
                <button
                  onClick={handleNextCard}
                  className="w-full py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs shadow-xs transition active:scale-95"
                >
                  Next Concept (+15 XP) →
                </button>
              )}
            </div>
          </div>
        )}

        {/* 4. QUIET SPOTS RADAR */}
        {activeTab === 'radar' && (
          <div className="mt-3.5 space-y-2.5 animate-fade-in">
            {QUIET_SPOTS.map((spot) => (
              <div
                key={spot.id}
                className="p-3 rounded-2xl bg-black/25 border border-white/10 flex items-start justify-between gap-2 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-white text-xs truncate">{spot.name}</h4>
                    <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[9px] font-bold">
                      {spot.decibels} dB
                    </span>
                  </div>
                  <p className="text-[10px] text-white/70 mt-0.5">{spot.vibe}</p>
                  <p className="text-[9px] text-emerald-400 mt-1 font-semibold">
                    📍 {spot.location} · {spot.freeDesks}
                  </p>
                </div>
                <button
                  onClick={() => onNavigateToSpot?.(spot)}
                  className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold border border-white/20 transition active:scale-95 shrink-0"
                >
                  Go 🗺️
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Daily Deep Work Goals Checklist */}
      <div className="rounded-2xl border border-line bg-cream p-3.5 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xs font-bold text-ink flex items-center gap-1.5">
            <span>🎯</span> Today&apos;s Mindful Deep Work Goals
          </h3>
          <span className="text-[10px] font-bold text-pine font-mono">
            {goals.filter((g) => g.done).length}/{goals.length} Completed
          </span>
        </div>

        <div className="space-y-1.5">
          {goals.map((g) => (
            <button
              key={g.id}
              onClick={() =>
                setGoals((prev) =>
                  prev.map((item) => (item.id === g.id ? { ...item, done: !item.done } : item))
                )
              }
              className={`w-full p-2 rounded-xl border text-left text-xs transition flex items-center gap-2 ${
                g.done
                  ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300/60 text-emerald-900 line-through opacity-80'
                  : 'bg-paper border-line text-ink hover:border-ink-faint'
              }`}
            >
              <span
                className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold border ${
                  g.done ? 'bg-emerald-600 text-white border-emerald-600' : 'border-line bg-cream'
                }`}
              >
                {g.done && '✓'}
              </span>
              <span className="text-xs font-semibold">{g.text}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
