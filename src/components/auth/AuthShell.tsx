import { HERO_IMAGE } from "@/lib/images";
import type { Dictionary } from "@/i18n/dictionaries";

/** Pantalla dividida: foto de mercado + formulario */
export function AuthShell({ dict, children }: { dict: Dictionary; children: React.ReactNode }) {
  return (
    <div className="grid overflow-hidden rounded-xl border border-stone-200 bg-white md:grid-cols-2">
      <div className="relative min-h-48 md:min-h-[560px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={HERO_IMAGE} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-green-950/80 via-green-950/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6 text-white">
          <p className="text-2xl font-semibold">{dict.common.appName}</p>
          <p className="mt-1 max-w-sm text-sm text-white/90">{dict.common.tagline}</p>
          <p className="mt-3 text-xs text-white/70">{dict.auth.heroNote}</p>
        </div>
      </div>
      <div className="flex items-center justify-center p-6 sm:p-10">{children}</div>
    </div>
  );
}
