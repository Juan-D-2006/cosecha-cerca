import { HERO_IMAGE } from "@/lib/images";
import type { Dictionary } from "@/i18n/dictionaries";
import { BrandMark } from "@/components/brand/BrandMark";
import { TextileBand } from "@/components/brand/TextileBand";

/** Pantalla dividida: foto de mercado con el mensaje de la marca + formulario */
export function AuthShell({ dict, children }: { dict: Dictionary; children: React.ReactNode }) {
  return (
    <div className="grid overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-[var(--shadow-lift)] md:grid-cols-[1.1fr_1fr]">
      <div className="relative isolate flex min-h-64 flex-col justify-end md:min-h-[620px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={HERO_IMAGE} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-green-950/95 via-green-950/50 to-green-950/10" />
        <div className="p-6 sm:p-10">
          <BrandMark className="h-12 w-12 shadow-lg" />
          <p className="font-display mt-5 max-w-md text-3xl font-semibold leading-[1.1] text-stone-50 sm:text-4xl">
            {dict.common.tagline}
          </p>
          <p className="mt-3 max-w-sm text-sm text-green-100">{dict.auth.heroNote}</p>
        </div>
        <TextileBand className="h-3" />
      </div>
      <div className="flex items-center justify-center bg-stone-50/60 p-6 sm:p-10">{children}</div>
    </div>
  );
}
