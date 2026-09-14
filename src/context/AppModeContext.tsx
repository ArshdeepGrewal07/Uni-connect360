"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

import { useCollection, useSavedState } from "@/hooks/use-campus-data";
import { useApp } from "@/app/page";

export type CampusMode = "solo" | "duo" | "group";

export interface DuoBeacon {
  id: string;
  creatorName: string;
  avatarHue: number;
  course: string;
  year: number;
  subject: string;
  goal: string;
  expiresInMinutes: number;
  isMine?: boolean;
}

export interface SquadPin {
  id: string;
  title: string;
  locationName: string;
  x: number;
  y: number;
  creatorName: string;
  category: "chai" | "gaming" | "study" | "sports";
  expiresAt: string;
  attendees: string[];
}

export interface PracticeZone {
  id: string;
  name: string;
  location: string;
  capacity: string;
  acoustics: string;
  status: "available" | "claimed" | "open_jam";
  claimedBy?: string;
  until?: string;
}

export interface PickupGame {
  id: string;
  sport: "badminton" | "basketball" | "football" | "cricket" | "chess";
  title: string;
  court: string;
  neededPlayers: number;
  currentPlayers: string[];
  startsAt: string;
  creatorName: string;
}

export interface VaultItem {
  id: string;
  title: string;
  category: "sports" | "tech" | "boardgames";
  ownerName: string;
  dormLocation: string;
  status: "available" | "borrowed";
  borrowedBy?: string;
}

interface AppModeContextType {
  mode: CampusMode;
  setMode: (m: CampusMode) => void;
  // Duo Beacon
  duoBeacons: DuoBeacon[];
  broadcastDuoBeacon: (beacon: { subject: string; goal: string }) => Promise<boolean>;
  clearMyDuoBeacon: () => Promise<void>;
  // Squad Geo-Pins
  squadPins: SquadPin[];
  dropSquadPin: (pin: { title: string; locationName: string; x: number; y: number; category: SquadPin["category"]; duration?: number }) => Promise<SquadPin | null>;
  joinSquadPin: (pinId: string, studentName: string) => Promise<boolean>;
  // Hype Meter
  hypes: Record<string, number>;
  hypeEvent: (eventId: string) => Promise<boolean>;
  // Practice Zones
  practiceZones: PracticeZone[];
  claimPracticeZone: (zoneId: string, crewName: string) => Promise<boolean>;
  // Pickup Games
  pickupGames: PickupGame[];
  joinPickupGame: (gameId: string, studentName: string) => Promise<boolean>;
  createPickupGame: (game: { sport: PickupGame["sport"]; title: string; court: string; neededPlayers: number }) => Promise<boolean>;
  // Equipment Vault
  vaultItems: VaultItem[];
  borrowVaultItem: (itemId: string, borrowerName: string) => Promise<boolean>;
}

const AppModeContext = createContext<AppModeContextType | null>(null);

export function useCampusMode() {
  const ctx = useContext(AppModeContext);
  if (!ctx) throw new Error("useCampusMode must be used within an AppModeProvider");
  return ctx;
}

const INITIAL_DUO_BEACONS: DuoBeacon[] = [
  {
    id: "db-1",
    creatorName: "Aarav Mehta",
    avatarHue: 18,
    course: "B.Tech CSE",
    year: 2,
    subject: "Robotics & Microcontrollers",
    goal: "Looking for a study buddy to debug ROS kinematics for next week's lab exam.",
    expiresInMinutes: 45,
  },
  {
    id: "db-2",
    creatorName: "Ishita Rao",
    avatarHue: 330,
    course: "B.Des",
    year: 3,
    subject: "Creative Frontend & Canvas",
    goal: "Need a partner to pair-program an interactive canvas browser game for term project.",
    expiresInMinutes: 80,
  },
  {
    id: "db-3",
    creatorName: "Meera Pillai",
    avatarHue: 262,
    course: "B.Tech ECE",
    year: 2,
    subject: "Signal Processing & DSP",
    goal: "Reviewing Fourier transform problem sets at Library 2nd Floor — coffee on me!",
    expiresInMinutes: 30,
  },
];

const INITIAL_SQUAD_PINS: SquadPin[] = [
  {
    id: "sp-1",
    title: "Midnight Chai & Samosa Gathering",
    locationName: "Chai Tapri Pavilion",
    x: 68,
    y: 44,
    creatorName: "Kabir",
    category: "chai",
    expiresAt: "In 35 mins",
    attendees: ["Kabir", "Meera", "Anya", "Dev"],
  },
  {
    id: "sp-2",
    title: "Testing Local Multiplayer LAN Lobby",
    locationName: "Innovation Lab (Room 102)",
    x: 74,
    y: 23,
    creatorName: "Rohan",
    category: "gaming",
    expiresAt: "In 55 mins",
    attendees: ["Rohan", "Arjun", "Priya"],
  },
  {
    id: "sp-3",
    title: "Architecture Studio Critique Group",
    locationName: "Block 34 · Room 204",
    x: 18,
    y: 24,
    creatorName: "Ishita",
    category: "study",
    expiresAt: "In 1h 20m",
    attendees: ["Ishita", "Anya", "Advait"],
  },
];

const INITIAL_PRACTICE_ZONES: PracticeZone[] = [
  {
    id: "pz-1",
    name: "Open Amphitheatre Courtyard",
    location: "Central Quad Grounds",
    capacity: "40+ people",
    acoustics: "Open air · Amp power available",
    status: "available",
  },
  {
    id: "pz-2",
    name: "Block 34 Design Atrium",
    location: "Block 34 Ground Floor",
    capacity: "25 dancers",
    acoustics: "Full mirror walls · Wood floor",
    status: "claimed",
    claimedBy: "Urban Groove Dance Crew",
    until: "5:30 PM",
  },
  {
    id: "pz-3",
    name: "Music Society Acoustic Pod 1",
    location: "Auditorium Wing B",
    capacity: "8 musicians",
    acoustics: "Soundproof foam · Drum kit & keyboard ready",
    status: "open_jam",
    claimedBy: "Acoustic Jam Collective",
    until: "Open to all students",
  },
];

const INITIAL_PICKUP_GAMES: PickupGame[] = [
  {
    id: "pg-1",
    sport: "badminton",
    title: "Doubles Badminton (Racquets Ready)",
    court: "Sports Complex Court 2",
    neededPlayers: 4,
    currentPlayers: ["Dev", "Aarav"],
    startsAt: "In 15 mins",
    creatorName: "Dev",
  },
  {
    id: "pg-2",
    sport: "basketball",
    title: "3v3 Half-Court Hoop Session",
    court: "Main Basketball Quad",
    neededPlayers: 6,
    currentPlayers: ["Tara", "Sana", "Kabir", "Arjun"],
    startsAt: "Free Court Right Now",
    creatorName: "Tara",
  },
  {
    id: "pg-3",
    sport: "chess",
    title: "Blitz Chess (5m clock)",
    court: "Hostel A Common Lounge",
    neededPlayers: 2,
    currentPlayers: ["Rohan"],
    startsAt: "Now",
    creatorName: "Rohan",
  },
];

const INITIAL_VAULT_ITEMS: VaultItem[] = [
  {
    id: "vi-1",
    title: "Yonex Carbonex Badminton Racquet + 3 Shuttles",
    category: "sports",
    ownerName: "Dev S. (Hostel B, Room 312)",
    dormLocation: "Hostel B",
    status: "available",
  },
  {
    id: "vi-2",
    title: "English Willow Cricket Bat (Grade 1)",
    category: "sports",
    ownerName: "Aarav M. (Hostel A, Room 204)",
    dormLocation: "Hostel A",
    status: "available",
  },
  {
    id: "vi-3",
    title: "Wooden Tournament Chess Set + Timer Clock",
    category: "boardgames",
    ownerName: "Rohan I. (Hostel A, Room 410)",
    dormLocation: "Hostel A",
    status: "available",
  },
  {
    id: "vi-4",
    title: "DJI Osmo Mobile 6 Smartphone Gimbal",
    category: "tech",
    ownerName: "Anya S. (Hostel C)",
    dormLocation: "Hostel C",
    status: "available",
  },
];

export function AppModeProvider({ children }: { children: React.ReactNode }) {
  const { me } = useApp();
  const [mode,setMode]=useSavedState<CampusMode>('mode','solo');
  const beacons=useCollection<DuoBeacon>('beacons');
  const pins=useCollection<SquadPin>('pins');
  const practice=useCollection<PracticeZone>('practice');
  const games=useCollection<PickupGame>('games');
  const equipment=useCollection<VaultItem>('equipment');
  const culture=useCollection<{id:string}>('culture');
  const hypes=Object.fromEntries(culture.items.map(i=>[i.id,i.hypeCount||0]));
  const broadcastDuoBeacon=async(data:{subject:string;goal:string})=>!!await beacons.mutate('create',{data});
  const clearMyDuoBeacon=async()=>{for(const b of beacons.items.filter(i=>i.isMine))await beacons.mutate('delete',{id:b.id});};
  const dropSquadPin=async(data:{title:string;locationName:string;x:number;y:number;category:SquadPin['category'];duration?:number})=>{const r=await pins.mutate('create',{data});return typeof r==='object'?r:null;};
  const joinSquadPin=async(id:string,_name:string)=>!!await pins.mutate('join',{id});
  const hypeEvent=async(id:string)=>!!await culture.mutate('hype',{id});
  const claimPracticeZone=async(id:string,crewName:string)=>!!await practice.mutate('claim',{id,crewName});
  const joinPickupGame=async(id:string,_name:string)=>!!await games.mutate('join',{id});
  const createPickupGame=async(data:{sport:PickupGame['sport'];title:string;court:string;neededPlayers:number})=>!!await games.mutate('create',{data});
  const borrowVaultItem=async(id:string,_name:string)=>!!await equipment.mutate('borrow',{id});
  return <AppModeContext.Provider value={{mode,setMode,duoBeacons:beacons.items,broadcastDuoBeacon,clearMyDuoBeacon,squadPins:pins.items,dropSquadPin,joinSquadPin,hypes,hypeEvent,practiceZones:practice.items,claimPracticeZone,pickupGames:games.items,joinPickupGame,createPickupGame,vaultItems:equipment.items,borrowVaultItem}}>{children}</AppModeContext.Provider>;
}
