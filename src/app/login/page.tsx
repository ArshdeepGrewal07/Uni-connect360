"use client";

import { useState } from "react";
import { ToastHost, type ToastItem } from "@/components/ui";
import { LoginPage } from "@/components/LoginPage";

let toastSeq = 1;

export default function LoginRoutePage() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = (message: string, tone: ToastItem["tone"] = "ok") => {
    const id = toastSeq++;
    setToasts((t) => [...t.slice(-2), { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  };

  const dismissToast = (id: number) =>
    setToasts((t) => t.filter((x) => x.id !== id));

  return (
    <>
      <ToastHost toasts={toasts} dismiss={dismissToast} />
      <LoginPage toast={toast} />
    </>
  );
}
