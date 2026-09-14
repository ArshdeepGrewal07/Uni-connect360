'use client';

import React, { useState, useRef, useEffect } from 'react';
import type {SkillBeacon} from '@/lib/career-types';
import type { PlaceItem, VendorListItem } from '@/lib/types';
import type { CampusMode, SquadPin } from '@/context/AppModeContext';
import {
  IconBuilding,
  IconFlame,
  IconFood,
  IconNavigation,
  IconRadar,
  IconSparkles,
  IconUsers,
  IconWalk,
} from '@/components/icons';

interface IsometricCampusMapProps {
  skillBeacons?:SkillBeacon[];
  onSelectSkillBeacon?:(beacon:SkillBeacon)=>void;
  skillDestination?:{x:number;y:number;name:string}|null;
  you: { x: number; y: number };
  onMoveYou: (pos: { x: number; y: number }) => void;
  selectedId: string | null;
  onSelect: (item: {
    id: string;
    name: string;
    meters: number;
    x: number;
    y: number;
    kind: 'vendor' | 'place';
    placeKind?: string;
  }) => void;
  onOpenIndoor?: (buildingName: string) => void;
  vendors: VendorListItem[];
  places: PlaceItem[];
  showHeatmap: boolean;
  onToggleHeatmap: () => void;
  showBuddyRadar: boolean;
  onToggleBuddyRadar: () => void;
  walkMinutes: (meters: number) => string;
  mode?: CampusMode;
  squadPins?: SquadPin[];
  onSelectSquadPin?: (pin: SquadPin) => void;
}

interface BuddyZone {
  id: string;
  name: string;
  area: string;
  x: number;
  y: number;
  count: number;
  friends: { name: string; course: string; avatar: string }[];
}

type LightingMode = 'day' | 'sunset' | 'night';

const BUDDY_ZONES: BuddyZone[] = [
  {
    id: 'bz1',
    name: 'Design Studio & Atrium',
    area: 'Block 34',
    x: 210,
    y: 220,
    count: 3,
    friends: [
      { name: 'Anya', course: 'B.Des Comm', avatar: 'A' },
      { name: 'Ishita', course: 'B.Des 3rd Yr', avatar: 'I' },
      { name: 'Dev', course: 'B.Tech Mech', avatar: 'D' },
    ],
  },
  {
    id: 'bz2',
    name: 'Quiet Study Nook',
    area: 'Central Library Floor 2',
    x: 440,
    y: 160,
    count: 2,
    friends: [
      { name: 'Rohan', course: 'B.Tech CSE', avatar: 'R' },
      { name: 'Priya', course: 'B.Tech CSE', avatar: 'P' },
    ],
  },
  {
    id: 'bz3',
    name: 'Chai & Samosa Circle',
    area: 'Chai Tapri Pavilion',
    x: 690,
    y: 390,
    count: 2,
    friends: [
      { name: 'Meera', course: 'B.Tech ECE', avatar: 'M' },
      { name: 'Kabir', course: 'BBA 1st Yr', avatar: 'K' },
    ],
  },
];

const HEATMAP_POINTS = [
  { id: 'hm1', name: 'Main Canteen', x: 490, y: 350, r: 85, type: 'busy', level: '85% Full' },
  { id: 'hm2', name: 'Chai Tapri', x: 680, y: 400, r: 65, type: 'busy', level: '72% Full' },
  { id: 'hm3', name: 'Central Library', x: 420, y: 150, r: 80, type: 'quiet', level: '22% Full' },
  { id: 'hm4', name: 'Block 34 Studio', x: 200, y: 220, r: 70, type: 'moderate', level: '48% Full' },
  { id: 'hm5', name: 'Central Green Lawn', x: 480, y: 460, r: 75, type: 'quiet', level: '30% Full' },
];

export function IsometricCampusMap({
  skillBeacons=[],onSelectSkillBeacon,skillDestination,
  you,
  onMoveYou,
  selectedId,
  onSelect: notifySelection,
  onOpenIndoor,
  vendors,
  places,
  showHeatmap,
  onToggleHeatmap,
  showBuddyRadar,
  onToggleBuddyRadar,
  walkMinutes,
  mode = 'solo',
  squadPins = [],
  onSelectSquadPin,
}: IsometricCampusMapProps) {
  const onSelect: IsometricCampusMapProps['onSelect'] = item => {
    const collection = item.kind === 'vendor' ? vendors : places;
    const match = collection.find(candidate => candidate.id === item.id || candidate.name === item.name);
    if (!match) return; // A schematic building may not have a configured database record.
    notifySelection({ ...item, id: match.id, x: match.x, y: match.y, meters: match.distanceMeters });
  };
  const [activeBuddyZone, setActiveBuddyZone] = useState<BuddyZone | null>(null);
  const [lighting, setLighting] = useState<LightingMode>('day');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const hasMovedRef = useRef(false);

  const surfaceRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef({ distance: 0, zoom: 1, x: 0, y: 0, panX: 0, panY: 0 });
  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return;
    const wheel = (event: WheelEvent) => {
      // Normal wheel scrolls Campus; Ctrl+wheel deliberately zooms the map.
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      setZoom(value => Math.max(1, Math.min(3, value - event.deltaY * 0.005)));
    };
    surface.addEventListener('wheel', wheel, { passive: false });
    return () => surface.removeEventListener('wheel', wheel);
  }, []);

  // Exact 1000x650 coordinate translation
  const toStageX = (x: number) => (x / 100) * 1000;
  const toStageY = (y: number) => (y / 100) * 650;

  const beaconGroups=Object.values(skillBeacons.reduce<Record<string,SkillBeacon[]>>((groups,b)=>{const key=`${Math.round(b.x/5)}:${Math.round(b.y/5)}`;(groups[key]??=[]).push(b);return groups;},{}));
  const userX = toStageX(you.x);
  const userY = toStageY(you.y);

  // Click handler with exact coordinate projection (Fixes pin jump bug)
  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (hasMovedRef.current) return;
    const svg = e.currentTarget;
    const matrix = svg.getScreenCTM();
    if (!matrix) return;
    const point = new DOMPoint(e.clientX, e.clientY).matrixTransform(matrix.inverse());
    const clickX = point.x;
    const clickY = point.y;

    const normX = Math.round((clickX / 1000) * 100 * 10) / 10;
    const normY = Math.round((clickY / 650) * 100 * 10) / 10;

    onMoveYou({
      x: Math.max(5, Math.min(95, normX)),
      y: Math.max(5, Math.min(95, normY)),
    });
    setActiveBuddyZone(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    hasMovedRef.current = false;
    if (zoom <= 1) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    if (Math.hypot(dx, dy) > 5) {
      hasMovedRef.current = true;
    }
    const maxPan = (zoom - 1) * 200;
    setPan({
      x: Math.max(-maxPan, Math.min(maxPan, dragStartRef.current.panX + dx)),
      y: Math.max(-maxPan, Math.min(maxPan, dragStartRef.current.panY + dy)),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoom = (delta: number) => {
    setZoom((prev) => {
      const next = Math.max(1, Math.min(3, Math.round((prev + delta) * 100) / 100));
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  const recenter = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const selectedVendor = vendors.find((v) => v.id === selectedId);
  const selectedPlace = places.find((p) => p.id === selectedId);
  const selectedItem = selectedVendor || selectedPlace;

  const drawnPositions: Record<string, [number, number]> = {
    'Block 34 (School of Design & Architecture)': [180, 200], 'Central Library': [420, 120],
    'Main Canteen': [440, 320], 'Chai Tapri': [680, 380], 'Sports Complex': [840, 200], 'Hostel A': [140, 480],
  };
  const targetX = selectedItem ? (drawnPositions[selectedItem.name]?.[0] ?? toStageX(selectedItem.x)) : null;
  const targetY = selectedItem ? (drawnPositions[selectedItem.name]?.[1] ?? toStageY(selectedItem.y)) : null;

  // Atmosphere palette tokens
  const theme = {
    day: {
      terrain: '#f4ede1',
      lawnFill: '#d8e7ce',
      lawnStroke: '#c5dac6',
      spineFill: '#ece3d2',
      spineBorder: '#fffbf2',
      buildingLight: '#fbf7ee',
      buildingShade: '#d5c8b5',
      roofTerracotta: '#c86d51',
      roofSlate: '#536b63',
      ambientFilter: 'none',
      gridOpacity: 0.45,
    },
    sunset: {
      terrain: '#ebdcd0',
      lawnFill: '#d1ceb8',
      lawnStroke: '#bfb89e',
      spineFill: '#e0ccba',
      spineBorder: '#fef1e4',
      buildingLight: '#fed7aa',
      buildingShade: '#c28766',
      roofTerracotta: '#b45309',
      roofSlate: '#78350f',
      ambientFilter: 'sepia(0.2) saturate(1.2)',
      gridOpacity: 0.35,
    },
    night: {
      terrain: '#1a2421',
      lawnFill: '#1f332c',
      lawnStroke: '#2a443b',
      spineFill: '#24332e',
      spineBorder: '#2f433c',
      buildingLight: '#2e433b',
      buildingShade: '#18241f',
      roofTerracotta: '#854d0e',
      roofSlate: '#0f172a',
      ambientFilter: 'contrast(1.05) brightness(0.9)',
      gridOpacity: 0.2,
    },
  }[lighting];

  return (
    <div className="relative w-full overflow-hidden select-none bg-[#ece5d8] transition-colors duration-500">
      {/* Top Left: Atmosphere, Heatmap, and Radar Controls */}
      <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-1.5 pointer-events-auto">
        {/* Lighting Mode Pill */}
        <button
          onClick={() => {
            const nextMode: LightingMode =
              lighting === 'day' ? 'sunset' : lighting === 'sunset' ? 'night' : 'day';
            setLighting(nextMode);
          }}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold shadow-xs transition-all backdrop-blur-md active:scale-95 bg-paper/90 text-ink border border-line"
          title="Toggle Time of Day"
        >
          <span>{lighting === 'day' ? '☀️ Day' : lighting === 'sunset' ? '🌅 Dusk' : '🌙 Night'}</span>
        </button>

        {/* Heatmap Toggle */}
        <button
          onClick={onToggleHeatmap}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold shadow-xs transition-all backdrop-blur-md active:scale-95 ${
            showHeatmap
              ? 'bg-amber-600 text-white ring-2 ring-amber-400/40'
              : 'bg-paper/85 text-ink-soft border border-line hover:bg-paper'
          }`}
        >
          <IconFlame size={12} className={showHeatmap ? 'text-amber-200' : 'text-amber-600'} />
          <span>Crowd</span>
        </button>

        {/* Buddy Radar Toggle */}
        <button
          onClick={onToggleBuddyRadar}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold shadow-xs transition-all backdrop-blur-md active:scale-95 ${
            showBuddyRadar
              ? 'bg-pine text-white ring-2 ring-emerald-400/40'
              : 'bg-paper/85 text-ink-soft border border-line hover:bg-paper'
          }`}
        >
          <IconRadar size={12} className={showBuddyRadar ? 'text-emerald-200' : 'text-pine'} />
          <span>Radar</span>
        </button>
      </div>

      {/* Top Right: Zoom & Recenter Controls */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1 bg-paper/90 backdrop-blur-md p-1 rounded-2xl border border-line shadow-xs">
        <button
          onClick={() => handleZoom(0.25)}
          className="w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs text-ink hover:bg-line/60 active:scale-95"
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={() => handleZoom(-0.25)}
          className="w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs text-ink hover:bg-line/60 active:scale-95"
          title="Zoom Out"
        >
          −
        </button>
        <button
          onClick={recenter}
          className="px-2 h-7 rounded-xl flex items-center justify-center font-bold text-[10px] text-pine hover:bg-line/60 active:scale-95"
          title="Recenter"
        >
          ⊙ {Math.round(zoom * 100)}%
        </button>
      </div>

      {/* 2.5D Isometric Interactive Canvas */}
      <div
        ref={surfaceRef}
        title="Pinch to zoom; drag when zoomed. Ctrl + wheel zooms. Scroll outside the map to browse Campus."
        className="w-full overflow-hidden cursor-crosshair"
        onTouchStart={event => {
          hasMovedRef.current = false;
          const a = event.touches[0], b = event.touches[1];
          touchStart.current = { distance: b ? Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) : 0, zoom, x: a.clientX, y: a.clientY, panX: pan.x, panY: pan.y };
        }}
        onTouchMove={event => {
          const a = event.touches[0], b = event.touches[1], start = touchStart.current;
          if (b && start.distance) {
            hasMovedRef.current = true;
            setZoom(Math.max(1, Math.min(3, start.zoom * Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) / start.distance)));
          } else if (zoom > 1 && a) {
            const dx = a.clientX - start.x, dy = a.clientY - start.y;
            if (Math.hypot(dx, dy) > 5) hasMovedRef.current = true;
            const bound = (zoom - 1) * 250;
            setPan({ x: Math.max(-bound, Math.min(bound, start.panX + dx)), y: Math.max(-bound, Math.min(bound, start.panY + dy)) });
          } else if (a && Math.hypot(a.clientX - start.x, a.clientY - start.y) > 5) hasMovedRef.current = true;
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ touchAction: 'none' }}
      >
        <svg
          viewBox="0 0 1000 650"
          className="block w-full"
          style={{
            aspectRatio: '1000/650',
            minHeight: '350px',
            maxHeight: '430px',
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '50% 50%',
            filter: theme.ambientFilter,
          }}
          onClick={handleSvgClick}
        >
          <defs>
            {/* Isometric Ground Grid */}
            <pattern id="iso-ground-grid" width="40" height="24" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 40 12 L 20 24 L 0 12 Z" fill="none" stroke="#d5ccbb" strokeWidth="0.5" />
            </pattern>

            {/* Heatmap Radials */}
            <radialGradient id="heat-busy" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ea580c" stopOpacity="0.45" />
              <stop offset="60%" stopColor="#f97316" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#ea580c" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="heat-quiet" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
              <stop offset="60%" stopColor="#34d399" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </radialGradient>

            {/* Water Ripple Gradient */}
            <radialGradient id="water-pool" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.9" />
              <stop offset="75%" stopColor="#60a5fa" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.65" />
            </radialGradient>

            {/* Drop Shadow Filter */}
            <filter id="shadow-3d" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="3" dy="6" stdDeviation="4" floodColor="#211d17" floodOpacity="0.2" />
            </filter>
          </defs>

          {/* 1. Base Terrain Surface */}
          <rect width="1000" height="650" fill={theme.terrain} />
          <rect width="1000" height="650" fill="url(#iso-ground-grid)" opacity={theme.gridOpacity} />

          {/* 2. Stylized Lawns and Garden Polygons */}
          <polygon points="280,420 540,280 740,390 480,530" fill={theme.lawnFill} stroke={theme.lawnStroke} strokeWidth="1.5" />
          <polygon points="320,180 500,80 620,150 440,240" fill={theme.lawnFill} stroke={theme.lawnStroke} strokeWidth="1.2" />
          <polygon points="80,510 240,420 340,480 180,570" fill={theme.lawnFill} stroke={theme.lawnStroke} strokeWidth="1.2" />
          <polygon points="700,240 860,150 940,200 780,290" fill={theme.lawnFill} stroke={theme.lawnStroke} strokeWidth="1.2" />

          {/* 3. Cobblestone Avenues & Walkways */}
          <path d="M 60,320 L 460,530 L 940,270 L 540,70 Z" fill="none" stroke={theme.spineBorder} strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 60,320 L 460,530 L 940,270 L 540,70 Z" fill="none" stroke={theme.spineFill} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />

          <path d="M 220,180 L 490,340 L 760,490" fill="none" stroke={theme.spineBorder} strokeWidth="9" strokeLinecap="round" />
          <path d="M 220,180 L 490,340 L 760,490" fill="none" stroke={theme.spineFill} strokeWidth="6" strokeLinecap="round" />

          {/* 4. Animated Central Fountain Water Ripple */}
          <g transform="translate(520, 360)">
            <ellipse cx="0" cy="0" rx="36" ry="18" fill="url(#water-pool)" filter="url(#shadow-3d)" />
            <ellipse cx="0" cy="0" rx="28" ry="14" fill="none" stroke="#e0f2fe" strokeWidth="1.5" opacity="0.8">
              <animate attributeName="rx" values="10;34" dur="2.5s" repeatCount="indefinite" />
              <animate attributeName="ry" values="5;17" dur="2.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.9;0" dur="2.5s" repeatCount="indefinite" />
            </ellipse>
            <circle cx="0" cy="-6" r="3" fill="#ffffff">
              <animate attributeName="cy" values="-6;-14;-6" dur="1.2s" repeatCount="indefinite" />
            </circle>
          </g>

          {/* 5. Isometric 3D Buildings */}

          {/* A. BLOCK 34 (School of Design & Architecture) */}
          <g
            transform="translate(180, 200)"
            filter="url(#shadow-3d)"
            className="cursor-pointer transition-opacity hover:opacity-80"
            onClick={(e) => {
              e.stopPropagation();
                if (hasMovedRef.current) return;
              onSelect({
                id: 'place-block-34',
                name: 'Block 34 (School of Design & Architecture)',
                meters: 140,
                x: 18,
                y: 24,
                kind: 'place',
                placeKind: 'academic',
              });
            }}
          >
            {/* Ground shadow */}
            <polygon points="0,60 90,10 160,40 70,90" fill="#201c15" opacity="0.2" />
            {/* Left Facade */}
            <polygon points="0,0 -40,-20 -40,30 0,50" fill={theme.buildingShade} />
            {/* Right Facade */}
            <polygon points="0,50 60,20 60,-30 0,0" fill={theme.buildingLight} />
            {/* Roof Deck */}
            <polygon points="0,0 -40,-20 20,-50 60,-30" fill={theme.roofSlate} />

            {/* Glass Curtains & Skylight */}
            <line x1="-30" y1="-10" x2="-30" y2="25" stroke="#93c5fd" strokeWidth="2" opacity="0.8" />
            <line x1="-15" y1="-3" x2="-15" y2="35" stroke="#93c5fd" strokeWidth="2" opacity="0.8" />
            <line x1="20" y1="35" x2="20" y2="-10" stroke="#93c5fd" strokeWidth="2" opacity="0.8" />
            <line x1="40" y1="25" x2="40" y2="-20" stroke="#93c5fd" strokeWidth="2" opacity="0.8" />

            {/* Floating Tag */}
            <g transform="translate(10, -68)">
              <rect x="-48" y="-12" width="96" height="24" rx="12" fill="#1e3a8a" stroke="#ffffff" strokeWidth="1.5" />
              <text x="0" y="4" textAnchor="middle" fontSize="11" fill="#ffffff" fontWeight="bold">
                🏛️ Block 34
              </text>
            </g>
          </g>

          {/* B. CENTRAL LIBRARY SANCTUM */}
          <g
            transform="translate(420, 120)"
            filter="url(#shadow-3d)"
            className="cursor-pointer transition-opacity hover:opacity-80"
            onClick={(e) => {
              e.stopPropagation();
                if (hasMovedRef.current) return;
              onSelect({
                id: 'place-library',
                name: 'Central Library',
                meters: 220,
                x: 42,
                y: 14,
                kind: 'place',
                placeKind: 'academic',
              });
            }}
          >
            {/* Base Tier */}
            <polygon points="0,20 -50,-5 0,-30 50,-5" fill={theme.buildingShade} />
            <polygon points="0,50 -50,25 -50,-5 0,20" fill={theme.buildingShade} />
            <polygon points="0,50 50,25 50,-5 0,20" fill={theme.buildingLight} />
            {/* Upper Tier Dome */}
            <polygon points="0,-10 -30,-25 0,-40 30,-25" fill="#3b82f6" opacity="0.8" />
            <polygon points="0,-10 -30,-25 -30,-15 0,0" fill="#2563eb" />
            <polygon points="0,-10 30,-25 30,-15 0,0" fill="#60a5fa" />

            {/* Tag */}
            <g transform="translate(0, -56)">
              <rect x="-48" y="-12" width="96" height="24" rx="12" fill="#047857" stroke="#ffffff" strokeWidth="1.5" />
              <text x="0" y="4" textAnchor="middle" fontSize="11" fill="#ffffff" fontWeight="bold">
                📚 Library
              </text>
            </g>
          </g>

          {/* C. MAIN CANTEEN & FOOD COURT */}
          <g
            transform="translate(440, 320)"
            filter="url(#shadow-3d)"
            className="cursor-pointer transition-opacity hover:opacity-80"
            onClick={(e) => {
              e.stopPropagation();
                if (hasMovedRef.current) return;
              onSelect({
                id: 'vendor-main',
                name: 'Main Canteen',
                meters: 90,
                x: 44,
                y: 38,
                kind: 'vendor',
              });
            }}
          >
            <polygon points="0,30 -50,5 0,-20 50,5" fill={theme.roofTerracotta} />
            <polygon points="0,60 -50,35 -50,5 0,30" fill={theme.buildingShade} />
            <polygon points="0,60 50,35 50,5 0,30" fill={theme.buildingLight} />

            {/* Canteen Warm Windows */}
            <rect x="10" y="20" width="12" height="12" rx="2" fill="#fbbf24" opacity={lighting === 'night' ? 0.95 : 0.6} />
            <rect x="28" y="10" width="12" height="12" rx="2" fill="#fbbf24" opacity={lighting === 'night' ? 0.95 : 0.6} />

            <g transform="translate(0, -36)">
              <rect x="-60" y="-12" width="120" height="24" rx="12" fill="#ea580c" stroke="#ffffff" strokeWidth="1.5" />
              <text x="0" y="4" textAnchor="middle" fontSize="11" fill="#ffffff" fontWeight="bold">
                🍱 Main Canteen
              </text>
            </g>
          </g>

          {/* D. CHAI TAPRI */}
          <g
            transform="translate(680, 380)"
            filter="url(#shadow-3d)"
            className="cursor-pointer transition-opacity hover:opacity-80"
            onClick={(e) => {
              e.stopPropagation();
                if (hasMovedRef.current) return;
              onSelect({
                id: 'vendor-chai',
                name: 'Chai Tapri',
                meters: 180,
                x: 68,
                y: 44,
                kind: 'vendor',
              });
            }}
          >
            {/* Wooden Shack Isometric Roof */}
            <polygon points="0,15 -35,-2 0,-20 35,-2" fill="#854d0e" />
            <polygon points="0,40 -35,23 -35,-2 0,15" fill="#a16207" />
            <polygon points="0,40 35,23 35,-2 0,15" fill="#ca8a04" />

            {/* Steaming kettle bubble */}
            <circle cx="0" cy="-28" r="7" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
            <text x="0" y="-25" textAnchor="middle" fontSize="9">
              ☕
            </text>

            <g transform="translate(0, -48)">
              <rect x="-50" y="-12" width="100" height="24" rx="12" fill="#b45309" stroke="#ffffff" strokeWidth="1.5" />
              <text x="0" y="4" textAnchor="middle" fontSize="11" fill="#ffffff" fontWeight="bold">
                ☕ Chai Tapri
              </text>
            </g>
          </g>

          {/* D1. MOMOS JUNCTION */}
          <g
            transform="translate(320, 390)"
            filter="url(#shadow-3d)"
            className="cursor-pointer transition-opacity hover:opacity-80"
            onClick={(e) => {
              e.stopPropagation();
                if (hasMovedRef.current) return;
              const v = vendors.find((x) => x.name.toLowerCase().includes('momo'));
              onSelect({
                id: v?.id || 'vendor-momos',
                name: v?.name || 'Momos Junction',
                meters: v?.distanceMeters || 135,
                x: 32,
                y: 39,
                kind: 'vendor',
              });
            }}
          >
            <polygon points="0,12 -28,-2 0,-16 28,-2" fill="#e11d48" />
            <polygon points="0,30 -28,16 -28,-2 0,12" fill="#be123c" />
            <polygon points="0,30 28,16 28,-2 0,12" fill="#fb7185" />
            <circle cx="0" cy="-24" r="6" fill="#fecdd3" stroke="#e11d48" strokeWidth="1" />
            <text x="0" y="-21" textAnchor="middle" fontSize="8">🥟</text>
            <g transform="translate(0, -42)">
              <rect x="-62" y="-12" width="124" height="24" rx="12" fill="#e11d48" stroke="#ffffff" strokeWidth="1.5" />
              <text x="0" y="4" textAnchor="middle" fontSize="10.5" fill="#ffffff" fontWeight="bold">
                🥟 Momos Junction
              </text>
            </g>
          </g>

          {/* D2. ROLLS MANIA & KATHI POINT */}
          <g
            transform="translate(590, 250)"
            filter="url(#shadow-3d)"
            className="cursor-pointer transition-opacity hover:opacity-80"
            onClick={(e) => {
              e.stopPropagation();
                if (hasMovedRef.current) return;
              const v = vendors.find((x) => x.name.toLowerCase().includes('roll') || x.name.toLowerCase().includes('kathi'));
              onSelect({
                id: v?.id || 'vendor-rolls',
                name: v?.name || 'Rolls Mania',
                meters: v?.distanceMeters || 160,
                x: 59,
                y: 25,
                kind: 'vendor',
              });
            }}
          >
            <polygon points="0,12 -28,-2 0,-16 28,-2" fill="#d97706" />
            <polygon points="0,30 -28,16 -28,-2 0,12" fill="#b45309" />
            <polygon points="0,30 28,16 28,-2 0,12" fill="#f59e0b" />
            <circle cx="0" cy="-24" r="6" fill="#fef3c7" stroke="#d97706" strokeWidth="1" />
            <text x="0" y="-21" textAnchor="middle" fontSize="8">🌯</text>
            <g transform="translate(0, -42)">
              <rect x="-56" y="-12" width="112" height="24" rx="12" fill="#d97706" stroke="#ffffff" strokeWidth="1.5" />
              <text x="0" y="4" textAnchor="middle" fontSize="11" fill="#ffffff" fontWeight="bold">
                🌯 Rolls Mania
              </text>
            </g>
          </g>

          {/* D3. NIGHT CANTEEN */}
          <g
            transform="translate(240, 520)"
            filter="url(#shadow-3d)"
            className="cursor-pointer transition-opacity hover:opacity-80"
            onClick={(e) => {
              e.stopPropagation();
                if (hasMovedRef.current) return;
              const v = vendors.find((x) => x.name.toLowerCase().includes('night'));
              onSelect({
                id: v?.id || 'vendor-night',
                name: v?.name || 'Night Canteen',
                meters: v?.distanceMeters || 220,
                x: 24,
                y: 52,
                kind: 'vendor',
              });
            }}
          >
            <polygon points="0,14 -30,-2 0,-18 30,-2" fill="#312e81" />
            <polygon points="0,34 -30,18 -30,-2 0,14" fill="#1e1b4b" />
            <polygon points="0,34 30,18 30,-2 0,14" fill="#4338ca" />
            <circle cx="0" cy="-26" r="6" fill="#e0e7ff" stroke="#4338ca" strokeWidth="1" />
            <text x="0" y="-23" textAnchor="middle" fontSize="8">🌙</text>
            <g transform="translate(0, -44)">
              <rect x="-60" y="-12" width="120" height="24" rx="12" fill="#312e81" stroke="#ffffff" strokeWidth="1.5" />
              <text x="0" y="4" textAnchor="middle" fontSize="11" fill="#ffffff" fontWeight="bold">
                🌙 Night Canteen
              </text>
            </g>
          </g>

          {/* D4. UNIMALL WAFFLE & CAFE */}
          <g
            transform="translate(780, 440)"
            filter="url(#shadow-3d)"
            className="cursor-pointer transition-opacity hover:opacity-80"
            onClick={(e) => {
              e.stopPropagation();
                if (hasMovedRef.current) return;
              const v = vendors.find((x) => x.name.toLowerCase().includes('waffle') || x.name.toLowerCase().includes('cafe'));
              onSelect({
                id: v?.id || 'vendor-waffle',
                name: v?.name || 'UniMall Waffle & Cafe',
                meters: v?.distanceMeters || 195,
                x: 78,
                y: 44,
                kind: 'vendor',
              });
            }}
          >
            <polygon points="0,14 -32,-2 0,-18 32,-2" fill="#9a3412" />
            <polygon points="0,34 -32,18 -32,-2 0,14" fill="#7c2d12" />
            <polygon points="0,34 32,18 32,-2 0,14" fill="#c2410c" />
            <circle cx="0" cy="-26" r="6" fill="#ffedd5" stroke="#c2410c" strokeWidth="1" />
            <text x="0" y="-23" textAnchor="middle" fontSize="8">🧇</text>
            <g transform="translate(0, -44)">
              <rect x="-62" y="-12" width="124" height="24" rx="12" fill="#9a3412" stroke="#ffffff" strokeWidth="1.5" />
              <text x="0" y="4" textAnchor="middle" fontSize="10.5" fill="#ffffff" fontWeight="bold">
                🧇 Waffle & Cafe
              </text>
            </g>
          </g>

          {/* D5. AMRITSARI KULCHA DHABA */}
          <g
            transform="translate(380, 540)"
            filter="url(#shadow-3d)"
            className="cursor-pointer transition-opacity hover:opacity-80"
            onClick={(e) => {
              e.stopPropagation();
                if (hasMovedRef.current) return;
              const v = vendors.find((x) => x.name.toLowerCase().includes('kulcha') || x.name.toLowerCase().includes('dhaba'));
              onSelect({
                id: v?.id || 'vendor-kulcha',
                name: v?.name || 'Amritsari Kulcha Dhaba',
                meters: v?.distanceMeters || 210,
                x: 38,
                y: 54,
                kind: 'vendor',
              });
            }}
          >
            <polygon points="0,12 -28,-2 0,-16 28,-2" fill="#b45309" />
            <polygon points="0,30 -28,16 -28,-2 0,12" fill="#78350f" />
            <polygon points="0,30 28,16 28,-2 0,12" fill="#d97706" />
            <circle cx="0" cy="-24" r="6" fill="#fef3c7" stroke="#b45309" strokeWidth="1" />
            <text x="0" y="-21" textAnchor="middle" fontSize="8">🥘</text>
            <g transform="translate(0, -42)">
              <rect x="-60" y="-12" width="120" height="24" rx="12" fill="#78350f" stroke="#ffffff" strokeWidth="1.5" />
              <text x="0" y="4" textAnchor="middle" fontSize="11" fill="#ffffff" fontWeight="bold">
                🥘 Kulcha Dhaba
              </text>
            </g>
          </g>

          {/* D6. MADRAS DOSA CORNER */}
          <g
            transform="translate(560, 420)"
            filter="url(#shadow-3d)"
            className="cursor-pointer transition-opacity hover:opacity-80"
            onClick={(e) => {
              e.stopPropagation();
                if (hasMovedRef.current) return;
              const v = vendors.find((x) => x.name.toLowerCase().includes('dosa'));
              onSelect({
                id: v?.id || 'vendor-dosa',
                name: v?.name || 'Madras Dosa Corner',
                meters: v?.distanceMeters || 120,
                x: 56,
                y: 42,
                kind: 'vendor',
              });
            }}
          >
            <polygon points="0,12 -26,-2 0,-16 26,-2" fill="#047857" />
            <polygon points="0,28 -26,14 -26,-2 0,12" fill="#065f46" />
            <polygon points="0,28 26,14 26,-2 0,12" fill="#059669" />
            <circle cx="0" cy="-24" r="6" fill="#d1fae5" stroke="#047857" strokeWidth="1" />
            <text x="0" y="-21" textAnchor="middle" fontSize="8">🥞</text>
            <g transform="translate(0, -42)">
              <rect x="-56" y="-12" width="112" height="24" rx="12" fill="#065f46" stroke="#ffffff" strokeWidth="1.5" />
              <text x="0" y="4" textAnchor="middle" fontSize="11" fill="#ffffff" fontWeight="bold">
                🥞 Dosa Corner
              </text>
            </g>
          </g>

          {/* D7. FRESH JUICE OASIS */}
          <g
            transform="translate(750, 270)"
            filter="url(#shadow-3d)"
            className="cursor-pointer transition-opacity hover:opacity-80"
            onClick={(e) => {
              e.stopPropagation();
                if (hasMovedRef.current) return;
              const v = vendors.find((x) => x.name.toLowerCase().includes('juice') || x.name.toLowerCase().includes('shake'));
              onSelect({
                id: v?.id || 'vendor-juice',
                name: v?.name || 'Fresh Juice Oasis',
                meters: v?.distanceMeters || 175,
                x: 75,
                y: 27,
                kind: 'vendor',
              });
            }}
          >
            <polygon points="0,12 -26,-2 0,-16 26,-2" fill="#0284c7" />
            <polygon points="0,28 -26,14 -26,-2 0,12" fill="#0369a1" />
            <polygon points="0,28 26,14 26,-2 0,12" fill="#38bdf8" />
            <circle cx="0" cy="-24" r="6" fill="#e0f2fe" stroke="#0284c7" strokeWidth="1" />
            <text x="0" y="-21" textAnchor="middle" fontSize="8">🥤</text>
            <g transform="translate(0, -42)">
              <rect x="-56" y="-12" width="112" height="24" rx="12" fill="#0369a1" stroke="#ffffff" strokeWidth="1.5" />
              <text x="0" y="4" textAnchor="middle" fontSize="11" fill="#ffffff" fontWeight="bold">
                🥤 Juice Oasis
              </text>
            </g>
          </g>

          {/* E. HOSTEL RESIDENCES CLUSTER */}
          <g
            transform="translate(140, 480)"
            filter="url(#shadow-3d)"
            className="cursor-pointer transition-opacity hover:opacity-80"
            onClick={(e) => {
              e.stopPropagation();
                if (hasMovedRef.current) return;
              onSelect({
                id: 'place-hostel-a',
                name: 'Hostel A & B Wings',
                meters: 260,
                x: 14,
                y: 56,
                kind: 'place',
                placeKind: 'housing',
              });
            }}
          >
            <polygon points="0,20 -40,0 0,-20 40,0" fill={theme.roofSlate} />
            <polygon points="0,50 -40,30 -40,0 0,20" fill={theme.buildingShade} />
            <polygon points="0,50 40,30 40,0 0,20" fill={theme.buildingLight} />

            <g transform="translate(0, -36)">
              <rect x="-48" y="-12" width="96" height="24" rx="12" fill="#475569" stroke="#ffffff" strokeWidth="1.5" />
              <text x="0" y="4" textAnchor="middle" fontSize="11" fill="#ffffff" fontWeight="bold">
                🏡 Hostels
              </text>
            </g>
          </g>

          {/* F. SPORTS COMPLEX */}
          <g
            transform="translate(840, 200)"
            filter="url(#shadow-3d)"
            className="cursor-pointer transition-opacity hover:opacity-80"
            onClick={(e) => {
              e.stopPropagation();
                if (hasMovedRef.current) return;
              onSelect({
                id: 'place-sports',
                name: 'Sports Complex',
                meters: 340,
                x: 84,
                y: 22,
                kind: 'place',
                placeKind: 'academic',
              });
            }}
          >
            {/* Stadium Ellipse */}
            <ellipse cx="0" cy="15" rx="55" ry="26" fill="#15803d" stroke="#166534" strokeWidth="3" />
            <ellipse cx="0" cy="15" rx="42" ry="18" fill="#dc2626" stroke="#ffffff" strokeWidth="1" strokeDasharray="3 3" />
            <ellipse cx="0" cy="15" rx="30" ry="12" fill="#22c55e" />

            <g transform="translate(0, -26)">
              <rect x="-48" y="-12" width="96" height="24" rx="12" fill="#15803d" stroke="#ffffff" strokeWidth="1.5" />
              <text x="0" y="4" textAnchor="middle" fontSize="11" fill="#ffffff" fontWeight="bold">
                🏸 Sports
              </text>
            </g>
          </g>

          {/* 6. Heatmap Layer */}
          {showHeatmap && (
            <g className="pointer-events-none transition-opacity duration-300">
              {HEATMAP_POINTS.map((hm) => (
                <circle
                  key={hm.id}
                  cx={hm.x}
                  cy={hm.y}
                  r={hm.r}
                  fill={hm.type === 'busy' ? 'url(#heat-busy)' : 'url(#heat-quiet)'}
                />
              ))}
            </g>
          )}

          {/* 7. Buddy Radar Spatial Nodes */}
          {showBuddyRadar && (
            <g>
              {BUDDY_ZONES.map((zone) => (
                <g
                  key={zone.id}
                  transform={`translate(${zone.x}, ${zone.y})`}
                  className="cursor-pointer transition-opacity hover:opacity-80"
                  onClick={(e) => {
                    e.stopPropagation();
                if (hasMovedRef.current) return;
                    setActiveBuddyZone(zone);
                  }}
                >
                  <circle cx="0" cy="0" r="16" fill="#10b981" opacity="0.25">
                    <animate attributeName="r" values="12;22;12" dur="2.4s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="0" cy="0" r="10" fill="#047857" stroke="#ffffff" strokeWidth="2" />
                  <text x="0" y="3.5" textAnchor="middle" fontSize="9" fill="#ffffff" fontWeight="bold">
                    {zone.count}
                  </text>
                </g>
              ))}
            </g>
          )}

          {/* 8. Squad Group Rally Pins */}
          {squadPins.map((pin) => (
            <g
              key={pin.id}
              transform={`translate(${toStageX(pin.x)}, ${toStageY(pin.y)})`}
              className="cursor-pointer transition-opacity hover:opacity-80"
              onClick={(e) => {
                e.stopPropagation();
                if (hasMovedRef.current) return;
                onSelectSquadPin?.(pin);
              }}
            >
              <circle cx="0" cy="0" r="18" fill="#f59e0b" opacity="0.3">
                <animate attributeName="r" values="10;24;10" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle cx="0" cy="0" r="8" fill="#d97706" stroke="#ffffff" strokeWidth="2" />
              <g transform="translate(0, -22)">
                <rect x="-48" y="-11" width="96" height="22" rx="11" fill="#78350f" stroke="#ffffff" strokeWidth="1.5" />
                <text x="0" y="3.5" textAnchor="middle" fontSize="10.5" fill="#ffffff" fontWeight="bold">
                  📍 {pin.title}
                </text>
              </g>
            </g>
          ))}

          {/* 9. Dynamic Holographic Laser Route to Target */}
          {targetX !== null && targetY !== null && (
            <g className="pointer-events-none">
              <path
                d={`M ${userX} ${userY} Q ${(userX + targetX) / 2 + 20} ${(userY + targetY) / 2 - 25} ${targetX} ${targetY}`}
                fill="none"
                stroke="#10b981"
                strokeWidth="4"
                opacity="0.3"
              />
              <path
                d={`M ${userX} ${userY} Q ${(userX + targetX) / 2 + 20} ${(userY + targetY) / 2 - 25} ${targetX} ${targetY}`}
                fill="none"
                stroke="#059669"
                strokeWidth="2.5"
                strokeDasharray="6 4"
              >
                <animate attributeName="stroke-dashoffset" values="20;0" dur="1s" repeatCount="indefinite" />
              </path>
            </g>
          )}

          {/* 10. Accurate User Marker Pin */}
          <g transform={`translate(${userX}, ${userY})`}>
            <circle cx="0" cy="0" r="18" fill="#047857" opacity="0.25">
              <animate attributeName="r" values="10;26;10" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite" />
            </circle>

            <circle cx="0" cy="0" r="9" fill="#047857" stroke="#ffffff" strokeWidth="2.5" />
            <circle cx="0" cy="0" r="4" fill="#fde047" />

            <g transform="translate(0, -24)">
              <rect x="-32" y="-10" width="64" height="20" rx="10" fill="#047857" stroke="#ffffff" strokeWidth="1.5" />
              <text x="0" y="3.5" textAnchor="middle" fontSize="10.5" fill="#ffffff" fontWeight="bold">
                📍 YOU
              </text>
            </g>
          </g>
          {skillDestination&&<g pointerEvents="none"><path d={`M ${userX} ${userY} L ${toStageX(skillDestination.x)} ${toStageY(skillDestination.y)}`} stroke="#7c3aed" strokeWidth="5" strokeDasharray="10 7"/><circle cx={toStageX(skillDestination.x)} cy={toStageY(skillDestination.y)} r="26" fill="none" stroke="#7c3aed" strokeWidth="4"/></g>}
          {beaconGroups.map(group=>{const beacon=group[0],label=group.length>1?`Open ${group.length} pins at ${beacon.location}`:'Open pin: '+beacon.title;return <g key={beacon.id} transform={`translate(${toStageX(beacon.x)},${toStageY(beacon.y)})`} role="button" tabIndex={0} aria-label={label} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelectSkillBeacon?.(beacon);}}} onClick={e=>{e.stopPropagation();if(!hasMovedRef.current)onSelectSkillBeacon?.(beacon);}} className="cursor-pointer">
            <title>{group.map(b=>b.title).join(' · ')}</title><circle r="26" fill={group.length>1?'#4f46e5':({skill:'#4f46e5',bounty:'#d97706',hackathon:'#7c3aed',study:'#059669'}[beacon.kind]||'#059669')} stroke="white" strokeWidth="4"/><text textAnchor="middle" dy="7" fontSize="22" fontWeight="700" fill="white">{group.length>1?group.length:({skill:'💡',bounty:'💰',hackathon:'🚀',study:'📚'}[beacon.kind]||'📍')}</text><rect x="-62" y="31" width="124" height="24" rx="8" fill="white"/><text textAnchor="middle" y="47" fill="#334155" fontSize="12" fontWeight="700">{group.length>1?`${group.length} pins · tap to choose`:beacon.title.slice(0,18)+(beacon.title.length>18?'…':'')}</text>
          </g>;})}
        </svg>
      </div>

      {/* Selected Location Bottom Drawer */}
      {selectedItem && (
        <div className="apple-glass absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between rounded-3xl p-3.5 shadow-2xl animate-sheet-in">
          <div className="min-w-0 flex-1 pr-2">
            <div className="flex items-center gap-2">
              <p className="truncate font-display text-[15px] font-bold text-ink tracking-tight">{selectedItem.name}</p>
              <span className="rounded-full bg-pine/10 px-2.5 py-0.5 text-[10px] font-bold text-pine">
                {selectedVendor ? 'Food & Dining' : 'Academic Block'}
              </span>
            </div>
            <p className="mt-0.5 text-xs font-semibold text-ink-faint">
              📍 {selectedItem.distanceMeters}m away ·{' '}
              <strong className="text-pine font-bold">{walkMinutes(selectedItem.distanceMeters)}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {selectedPlace && onOpenIndoor && (
              <button
                onClick={() => onOpenIndoor(selectedItem.name)}
                className="tap-spring cursor-pointer flex items-center gap-1.5 rounded-2xl bg-cream px-3.5 py-2.5 text-xs font-bold text-pine border border-pine/30 shadow-xs hover:bg-pine/5"
              >
                <IconBuilding size={14} />
                <span>Floor Map</span>
              </button>
            )}

            <button
              onClick={() => {
                onMoveYou({ x: selectedItem.x, y: selectedItem.y });
              }}
              className="tap-spring cursor-pointer flex items-center gap-1.5 rounded-2xl bg-pine px-3.5 py-2.5 text-xs font-bold text-cream shadow-xs hover:bg-pine-deep"
            >
              <IconWalk size={14} />
              <span>Teleport</span>
            </button>
          </div>
        </div>
      )}

      {/* Active Buddy Zone Modal */}
      {activeBuddyZone && (
        <div className="absolute bottom-4 left-4 right-4 z-30 animate-fade-up rounded-2xl border border-line bg-paper/95 p-3.5 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-line pb-2">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs">
                {activeBuddyZone.count}
              </span>
              <div>
                <p className="font-display text-xs font-bold text-ink">{activeBuddyZone.name}</p>
                <p className="text-[10px] font-semibold text-ink-faint">📍 {activeBuddyZone.area}</p>
              </div>
            </div>
            <button
              onClick={() => setActiveBuddyZone(null)}
              className="cursor-pointer text-xs font-bold text-ink-faint hover:text-ink px-2 py-1"
            >
              ✕
            </button>
          </div>

          <div className="mt-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {activeBuddyZone.friends.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 rounded-full bg-cream px-2.5 py-1 border border-line shadow-2xs"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-pine text-[10px] font-bold text-cream">
                    {f.avatar}
                  </span>
                  <span className="text-[11px] font-bold text-ink">{f.name}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                alert(`Waved 👋 to friends at ${activeBuddyZone.name}!`);
                setActiveBuddyZone(null);
              }}
              className="cursor-pointer rounded-xl bg-pine px-3 py-1.5 text-xs font-bold text-cream shadow-2xs transition-transform active:scale-95"
            >
              Wave 👋
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
