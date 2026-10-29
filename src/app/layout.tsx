import type { Metadata } from "next";
import "./globals.css";
import { I18nProvider } from "@/i18n/client";
import { getI18n } from "@/i18n/server";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { TextileBand } from "@/components/brand/TextileBand";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  return { title: dict.common.appName, description: dict.common.tagline };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { locale, dict } = await getI18n();

  return (
    <html lang={locale}>
      <body className="flex min-h-screen flex-col bg-stone-50 text-stone-900 antialiased">
        <I18nProvider locale={locale} dict={dict}>
          <SiteHeader dict={dict} />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">{children}</main>
          <footer className="mt-12">
            <TextileBand className="h-2 opacity-90" />
            <div className="bg-green-900 text-green-100">
              <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-6 text-sm">
                <p className="font-display text-base text-stone-50">{dict.common.footerNote}</p>
                <p className="text-green-200">
                  {dict.common.photoCredit}{" "}
                  <a className="underline hover:text-stone-50" href="https://unsplash.com/license" target="_blank" rel="noreferrer">
                    Unsplash
                  </a>
                </p>
              </div>
            </div>
          </footer>
        </I18nProvider>
      </body>
    </html>
  );
}
