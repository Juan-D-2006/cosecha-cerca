"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/client";
import { apiFetch } from "@/lib/api";
import { secondaryBtn } from "@/components/ui";
import type { ListingStatus } from "@/types/domain";

export function ListingStatusButton({ id, status }: { id: string; status: ListingStatus }) {
  const { dict } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  if (status !== "active" && status !== "paused") return null;

  const next = status === "active" ? "paused" : "active";
  return (
    <button
      type="button"
      disabled={pending}
      className={secondaryBtn}
      onClick={() =>
        startTransition(async () => {
          const res = await apiFetch(`/api/listings/${id}`, "PATCH", { status: next });
          if (res.ok) router.refresh();
        })
      }
    >
      {status === "active" ? dict.panel.pause : dict.panel.activate}
    </button>
  );
}
