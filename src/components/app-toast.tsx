"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function AppToast() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const error = searchParams.get("error");
  const added = searchParams.get("added");
  const [toast, setToast] = useState<{
    message: string;
    tone: "error" | "success";
  } | null>(null);

  useEffect(() => {
    if (pathname === "/login" || pathname === "/signup") {
      return;
    }

    if (!error && !added) {
      return;
    }

    const message = error ?? added;
    if (!message) {
      return;
    }

    setToast({ message, tone: error ? "error" : "success" });

    const params = new URLSearchParams(searchParams.toString());
    params.delete("error");
    params.delete("added");
    const search = params.toString();
    router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false });

    const timeout = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [added, error, pathname, router, searchParams]);

  if (!toast) {
    return null;
  }

  return (
    <div
      role="status"
      className={
        toast.tone === "error"
          ? "shelf-toast fixed bottom-6 right-6 z-50 max-w-sm rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
          : "shelf-toast fixed bottom-6 right-6 z-50 max-w-sm rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
      }
    >
      {toast.message}
    </div>
  );
}
