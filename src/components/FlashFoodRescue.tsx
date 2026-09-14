"use client";

import { useCollection, useSavedState } from "@/hooks/use-campus-data";
import { useApp } from "@/app/page";
import { useState } from "react";
import { FoodCardImage } from "@/components/FoodCardImage";
import {
  IconCheck,
  IconFlame,
  IconSparkles,
} from "@/components/icons";

interface SurplusItem {
  id: string;
  vendorName: string;
  dishName: string;
  originalPrice: number;
  discountPrice: number;
  platesLeft: number;
  closingTime: string;
  image?: string;
  veg: boolean;
}

const SURPLUS_ITEMS: SurplusItem[] = [
  {
    id: "ff-1",
    vendorName: "Main Canteen",
    dishName: "Deluxe Paneer Thali + 3 Butter Rotis",
    originalPrice: 95,
    discountPrice: 45,
    platesLeft: 6,
    closingTime: "Closes in 35 mins",
    image: "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=400&q=80",
    veg: true,
  },
  {
    id: "ff-2",
    vendorName: "Momos Corner",
    dishName: "Steamed Chicken Momos (8pc batch)",
    originalPrice: 70,
    discountPrice: 35,
    platesLeft: 4,
    closingTime: "Closes in 20 mins",
    image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=400&q=80",
    veg: false,
  },
  {
    id: "ff-3",
    vendorName: "Green Bowl Cafe",
    dishName: "Falafel Hummus Protein Bowl",
    originalPrice: 130,
    discountPrice: 60,
    platesLeft: 3,
    closingTime: "Closes in 45 mins",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=80",
    veg: true,
  },
  {
    id: "ff-4",
    vendorName: "Chai Tapri",
    dishName: "Medu Vada (2pc) + Ginger Chai Combo",
    originalPrice: 45,
    discountPrice: 20,
    platesLeft: 8,
    closingTime: "Closes in 50 mins",
    image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400&q=80",
    veg: true,
  },
  {
    id: "ff-5",
    vendorName: "Rolls Mania & Kathi Point",
    dishName: "Double Paneer Tikka Kathi Roll",
    originalPrice: 85,
    discountPrice: 40,
    platesLeft: 5,
    closingTime: "Closes in 25 mins",
    image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=400&q=80",
    veg: true,
  },
  {
    id: "ff-6",
    vendorName: "UniMall Waffle & Cafe",
    dishName: "Warm Belgian Dark Chocolate Waffle",
    originalPrice: 120,
    discountPrice: 55,
    platesLeft: 3,
    closingTime: "Closes in 40 mins",
    image: "https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=400&q=80",
    veg: true,
  },
  {
    id: "ff-7",
    vendorName: "Amritsari Kulcha Dhaba",
    dishName: "Chur Chur Aloo Kulcha + Chole Thali",
    originalPrice: 90,
    discountPrice: 45,
    platesLeft: 4,
    closingTime: "Closes in 30 mins",
    image: "https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=400&q=80",
    veg: true,
  },
];

export function FlashFoodRescue({
  onToast,
}: {
  onToast?: (msg: string, tone?: "ok" | "warn") => void;
}) {
  const {items,mutate}=useCollection<SurplusItem>('food');
  const reservedIds=items.filter(i=>i.reserved).map(i=>i.id);

  const handleReserve=async(item:SurplusItem)=>{if(await mutate('reserve',{id:item.id}))onToast?.('Reservation saved in the app. Sample offers are not redeemable at campus counters.','ok');};

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="rounded-2xl border border-emerald-300/60 bg-gradient-to-r from-emerald-50 via-cream to-emerald-50/40 p-4 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
            🌱
          </span>
          <div>
            <h3 className="font-display text-sm font-bold text-ink">
              Flash Food Waste Prevention
            </h3>
            <p className="text-[11px] text-ink-faint">
              40–60% surplus discounts right before closing · Save food & dining budget
            </p>
          </div>
        </div>
      </div>

      {/* Food Surplus Cards */}
      <div className="space-y-3">
        {items.map((item) => {
          const isReserved = reservedIds.includes(item.id);
          const discountPct = Math.round(((item.originalPrice - item.discountPrice) / item.originalPrice) * 100);

          return (
            <div
              key={item.id}
              className="flex items-start gap-3 rounded-2xl border border-line bg-cream p-3 shadow-2xs transition-all hover:border-emerald-400 hover:shadow-xs"
            >
              <FoodCardImage
                src={item.image}
                name={item.dishName}
                className="h-20 w-22 shrink-0 rounded-xl object-cover shadow-2xs"
              />

              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10.5px] font-bold text-pine uppercase truncate">
                    📍 {item.vendorName}
                  </span>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.2 text-[9.5px] font-black text-emerald-800 border border-emerald-200">
                    {discountPct}% OFF
                  </span>
                </div>

                <h4 className="font-display text-xs font-bold text-ink truncate">
                  {item.dishName}
                </h4>

                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-black text-pine">
                    ₹{item.discountPrice}
                  </span>
                  <span className="font-mono text-xs line-through text-ink-faint">
                    ₹{item.originalPrice}
                  </span>
                  <span className="text-[10px] font-bold text-amber-700 ml-auto">
                    🔥 {item.platesLeft} left
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-line/60 text-[10px]">
                  <span className="text-ink-faint font-semibold">
                    ⏳ {item.closingTime}
                  </span>

                  <button
                    onClick={() => handleReserve(item)}
                    disabled={isReserved || item.platesLeft === 0}
                    className={`cursor-pointer rounded-xl px-3 py-1 text-xs font-bold transition-all active:scale-95 ${
                      isReserved
                        ? "bg-emerald-700 text-white opacity-90"
                        : item.platesLeft === 0
                        ? "bg-line text-ink-faint cursor-not-allowed"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                    }`}
                  >
                    {isReserved ? "Token Reserved ✓" : "Reserve Plate 🍱"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
