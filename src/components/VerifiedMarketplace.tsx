"use client";

import { useCollection, useSavedState } from "@/hooks/use-campus-data";
import { useApp } from "@/app/page";
import { useState } from "react";
import { Avatar } from "@/components/ui";

interface MarketListing {
  id: string;
  sellerName: string;
  avatarHue: number;
  dormLocation: string;
  title: string;
  category: "Academic Gear" | "Textbooks" | "Appliances" | "Electronics";
  price: number;
  condition: "Like New" | "Good" | "Fair";
  status: "available" | "reserved";
}

const INITIAL_MARKET: MarketListing[] = [
  {
    id: "vm-1",
    sellerName: "Ishita Rao",
    avatarHue: 330,
    dormLocation: "Hostel C · Room 214",
    title: "A2 Architecture Drafting Board + Parallel Motion T-Scale + Clips",
    category: "Academic Gear",
    price: 450,
    condition: "Like New",
    status: "available",
  },
  {
    id: "vm-2",
    sellerName: "Dev Sharma",
    avatarHue: 96,
    dormLocation: "Hostel B · Room 312",
    title: "Omega Engineering Mini Drafter + Unbreakable Drawing Tube",
    category: "Academic Gear",
    price: 250,
    condition: "Good",
    status: "available",
  },
  {
    id: "vm-3",
    sellerName: "Rohan Iyer",
    avatarHue: 142,
    dormLocation: "Hostel A · Room 410",
    title: "100% Cotton Chemistry & Workshop Lab Coat (Size L, freshly washed)",
    category: "Academic Gear",
    price: 120,
    condition: "Good",
    status: "available",
  },
  {
    id: "vm-4",
    sellerName: "Senior Alum (Graduating)",
    avatarHue: 210,
    dormLocation: "Hostel A · Room 108",
    title: "Haier 42L Compact Dorm Mini-Fridge (Chills drinks & milk perfectly)",
    category: "Appliances",
    price: 2800,
    condition: "Good",
    status: "available",
  },
];

export function VerifiedMarketplace({
  onToast,
}: {
  onToast?: (msg: string, tone?: "ok" | "warn") => void;
}) {
  const {items:listings,mutate}=useCollection<MarketListing>('market');
  const [modalOpen, setModalOpen] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [priceInput, setPriceInput] = useState(200);
  const [catInput, setCatInput] = useState<MarketListing["category"]>("Academic Gear");
  const reservedIds=listings.filter(i=>i.reserved).map(i=>i.id);

  const handleReserve=async(item:MarketListing)=>{if(await mutate('reserve',{id:item.id}))onToast?.('Reservation saved. Confirm pickup directly with the seller.','ok');};
  const handlePost=async()=>{
    if(!titleInput.trim())return;
    if(!await mutate('create',{data:{title:titleInput.trim(),category:catInput,price:priceInput,condition:'Like New',dormLocation:'Arrange with seller'}}))return;
    onToast?.('Listing saved.','ok');setModalOpen(false);setTitleInput('');
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="rounded-2xl border border-blue-300/60 bg-gradient-to-r from-blue-50 via-cream to-blue-50/40 p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
              🛍️
            </span>
            <div>
              <h3 className="font-display text-sm font-bold text-ink">
                Verified Student P2P Marketplace
              </h3>
              <p className="text-[11px] text-ink-faint">
                Campus-only buy/sell hub · No off-campus scams · Dorm pickup
              </p>
            </div>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="cursor-pointer rounded-xl bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-xs font-bold text-white shadow-2xs active:scale-95"
          >
            + Sell Item
          </button>
        </div>
      </div>

      {/* Listings Grid */}
      <div className="space-y-3">
        {listings.map((item) => {
          const isReserved = reservedIds.includes(item.id);

          return (
            <div
              key={item.id}
              className="rounded-2xl border border-line bg-cream p-4 shadow-2xs space-y-2.5 transition-all hover:border-blue-300 hover:shadow-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <Avatar name={item.sellerName} hue={item.avatarHue} size={36} />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-display text-xs font-bold text-ink">{item.sellerName}</h4>
                      <span className="rounded-full bg-emerald-100 px-1.5 py-0.2 text-[8px] font-black uppercase text-emerald-800">
                        ID Verified
                      </span>
                    </div>
                    <p className="text-[10px] font-semibold text-ink-faint">📍 {item.dormLocation}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono text-base font-black text-pine">
                    ₹{item.price}
                  </span>
                  <span className="block text-[9px] font-bold text-ink-faint uppercase">
                    {item.condition}
                  </span>
                </div>
              </div>

              <div>
                <span className="rounded-md bg-paper px-2 py-0.5 text-[9px] font-bold text-ink-soft border border-line/60 uppercase">
                  {item.category}
                </span>
                <p className="mt-1 font-display text-xs font-bold text-ink leading-snug">
                  {item.title}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-line/60 text-[11px]">
                <span className="text-ink-faint font-medium">
                  Direct peer exchange
                </span>

                <button
                  onClick={() => handleReserve(item)}
                  disabled={isReserved}
                  className={`cursor-pointer rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95 ${
                    isReserved
                      ? "bg-emerald-600 text-white opacity-90"
                      : "bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                  }`}
                >
                  {isReserved ? "Contacted ✓" : "Message Seller"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Post Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-line bg-paper p-4 shadow-2xl animate-sheet-in space-y-3">
            <h3 className="font-display text-sm font-bold text-ink">
              List Item on Verified Marketplace
            </h3>

            <div>
              <label className="text-[10px] font-bold text-ink-faint uppercase">
                Item Title
              </label>
              <input
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                placeholder="e.g. Drafter, textbook, dorm kettle..."
                className="mt-1 w-full rounded-xl border border-line bg-cream px-3 py-2 text-xs font-bold text-ink outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-ink-faint uppercase">
                  Category
                </label>
                <select
                  value={catInput}
                  onChange={(e) => setCatInput(e.target.value as any)}
                  className="mt-1 w-full rounded-xl border border-line bg-cream px-3 py-2 text-xs font-semibold text-ink outline-none"
                >
                  <option value="Academic Gear">Academic Gear</option>
                  <option value="Textbooks">Textbooks</option>
                  <option value="Appliances">Appliances</option>
                  <option value="Electronics">Electronics</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-ink-faint uppercase">
                  Price (₹)
                </label>
                <input
                  type="number"
                  value={priceInput}
                  onChange={(e) => setPriceInput(Number(e.target.value))}
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
                onClick={handlePost}
                className="flex-1 cursor-pointer rounded-xl bg-blue-600 hover:bg-blue-700 py-2 text-xs font-bold text-white shadow-xs"
              >
                Publish 🛍️
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
