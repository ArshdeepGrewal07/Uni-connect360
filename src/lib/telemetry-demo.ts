export interface LaundryMachine {
  id: string;
  type: "washer" | "dryer";
  name: string;
  dorm: string;
  status: "available" | "in_use";
  minutesLeft?: number;
}

export const INITIAL_LAUNDRY: LaundryMachine[] = [
  { id: "w-1", type: "washer", name: "Washer #01 (Front Load)", dorm: "Hostel A", status: "available" },
  { id: "w-2", type: "washer", name: "Washer #02 (Heavy Cycle)", dorm: "Hostel A", status: "in_use", minutesLeft: 14 },
  { id: "w-3", type: "washer", name: "Washer #03 (Eco Wash)", dorm: "Hostel A", status: "available" },
  { id: "w-4", type: "washer", name: "Washer #04 (Speed 30)", dorm: "Hostel B", status: "in_use", minutesLeft: 8 },
  { id: "d-1", type: "dryer", name: "Dryer #01 (High Heat)", dorm: "Hostel A", status: "available" },
  { id: "d-2", type: "dryer", name: "Dryer #02 (Tumble Dry)", dorm: "Hostel A", status: "in_use", minutesLeft: 22 },
  { id: "d-3", type: "dryer", name: "Dryer #03 (High Capacity)", dorm: "Hostel B", status: "available" },
];

export interface NoiseZone {
  id: string;
  zone: string;
  category: "silent" | "chatter" | "energy";
  db: number;
  description: string;
  recommendedFor: string;
}

export const NOISE_ZONES: NoiseZone[] = [
  {
    id: "nz-1",
    zone: "Central Library Floor 2 (Reading Room 3)",
    category: "silent",
    db: 18,
    description: "Whisper-enforced · Deep solo study",
    recommendedFor: "Exam cramming & Thesis writing",
  },
  {
    id: "nz-2",
    zone: "Block 34 4th Floor Studio Nook",
    category: "silent",
    db: 22,
    description: "Low footfall · High natural light",
    recommendedFor: "UI/UX drafting & coding sprints",
  },
  {
    id: "nz-3",
    zone: "Green Bowl Cafe & Sports Terrace",
    category: "chatter",
    db: 48,
    description: "Ambient lofi tunes & low murmur",
    recommendedFor: "Casual study & group brainstorming",
  },
  {
    id: "nz-4",
    zone: "Central Quad Lawn & Water Fountain",
    category: "chatter",
    db: 54,
    description: "Outdoor breeze & passing conversations",
    recommendedFor: "Chai chats & reading novels",
  },
  {
    id: "nz-5",
    zone: "Main Canteen Dining Pavilion",
    category: "energy",
    db: 78,
    description: "Peak rush · Lively chatter & order calls",
    recommendedFor: "Social lunches & team catchups",
  },
  {
    id: "nz-6",
    zone: "Sports Complex Indoor Courts",
    category: "energy",
    db: 84,
    description: "High reverberation · Sneaker squeaks & whistles",
    recommendedFor: "Badminton & basketball matches",
  },
];

export const DEMO_ROOMS = [
 { id: "library-2", name: "Floor 2 · Silent Research Nook", capacity: 50, occupied: 16 },
 { id: "library-1", name: "Floor 1 · High-Speed Digital Lab", capacity: 60, occupied: 42 },
 { id: "library-0", name: "Ground Floor · General Reading Hall", capacity: 80, occupied: 68 },
 { id: "library-night", name: "24/7 Air-Conditioned Night Study Hall", capacity: 40, occupied: 26 },
];
