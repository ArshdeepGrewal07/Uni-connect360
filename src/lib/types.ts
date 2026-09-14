export type Gender = "male" | "female" | "non_binary" | "prefer_not_to_say";

export interface MeUser {
  id: string;
  fullName: string;
  firstName: string;
  regId: string;
  email: string;
  mobile: string | null;
  gender: Gender;
  course: string;
  academicYear: number;
  interests: string[];
  lookingFor: string | null;
  avatarHue: number;
  visible: boolean;
  isDemo: boolean;
  isRestricted: boolean;
  alumniDue: boolean;
  createdAt: string;
}

export interface RestrictionSource {
  sessionId: string;
  otherName: string;
  expiredAt: string | null;
}

export interface MeData {
  user: MeUser;
  restriction: RestrictionSource | null;
  pendingIn: number;
  pendingOut: number;
  unread: number;
}

export interface HomeData {
  greeting: string;
  pulse: { total: number; buddies: number; food: number; events: number; vendors: number };
  lookingToday: number;
  announcements: {
    id: string;
    title: string;
    body: string;
    pinned: boolean;
    createdAt: string;
  }[];
  trending: {
    id: string;
    title: string;
    location: string;
    tag: string;
    image?: string;
    startsAt: string;
    going: number;
    buddySeekers: number;
  }[];
}

export interface BuddyCard {
  id: string;
  firstName: string;
  course: string;
  academicYear: number;
  gender: Gender;
  interests: string[];
  lookingFor: string | null;
  avatarHue: number;
  relation: {
    status: string;
    sessionId: string;
    iInitiated: boolean;
  } | null;
}

export interface EventItem {
  id: string;
  title: string;
  description: string;
  location: string;
  tag: string;
  image?: string;
  startsAt: string;
  going: number;
  buddySeekers: number;
  iAmGoing: boolean;
  attendees?: {
    id: string;
    firstName: string;
    course: string;
    avatarHue: number;
    wantsBuddy: boolean;
  }[];
}

export type ChatStatus = "pending" | "accepted" | "expired" | "declined";

export interface ChatSummary {
  id: string;
  status: ChatStatus;
  mediaUnlocked: boolean;
  createdAt: string;
  timerEndsAt: string;
  acceptedAt: string | null;
  expiredAt: string | null;
  waivedAt: string | null;
  iInitiated: boolean;
  other: {
    id: string;
    firstName: string;
    fullName: string;
    course: string;
    avatarHue: number;
  };
  lastMessage: string | null;
  lastMessageKind: string | null;
  lastMessageAt: string | null;
  unread: number;
}

export interface MessageItem {
  id: string;
  senderId: string | null;
  kind: "text" | "image" | "voice" | "system";
  body: string;
  createdAt: string;
}

export interface ChatDetail {
  session: ChatSummary;
  messages: MessageItem[];
}

export interface ChatListData {
  chats: ChatSummary[];
  restricted: boolean;
  restriction: RestrictionSource | null;
}

export interface VendorListItem {
  id: string;
  name: string;
  blurb: string;
  isOpen: boolean;
  image: string;
  topDish: string | null;
  x: number;
  y: number;
  rating: number;
  reviewCount: number;
  distanceMeters: number;
}

export interface PlaceItem {
  id: string;
  name: string;
  kind: "food" | "academic" | "housing";
  x: number;
  y: number;
  distanceMeters: number;
}

export interface VendorDetail {
  vendor: VendorListItem & { menu: { item: string; price: string; veg: boolean }[] };
  reviews: {
    id: string;
    rating: number;
    body: string;
    createdAt: string;
    firstName: string;
    hue: number;
  }[];
}

export interface SafetyData {
  reports: {
    id: string;
    reportedFirstName: string;
    category: string;
    details: string;
    evidenceUrl: string;
    status: "open" | "reviewed" | "actioned";
    createdAt: string;
  }[];
  blocked: {
    id: string;
    firstName: string;
    course: string;
    avatarHue: number;
    createdAt: string;
  }[];
}
