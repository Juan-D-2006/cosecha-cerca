import type { Metadata } from "next";
import "./globals.css";
import { I18nProvider } from "@/i18n/client";
import { getI18n } from "@/i18n/server";
import { SiteHeader } from "@/components/layout/SiteHeader";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  return { title: dict.common.appName, description: dict.common.tagline };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { locale, dict } = await getI18n();

  return (
    <html lang={locale}>
      <body className="min-h-screen bg-stone-50 text-stone-900 antialiased">
        <I18nProvider locale={locale} dict={dict}>
          <SiteHeader dict={dict} />
          <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        </I18nProvider>
      </body>
    </html>
  );
}
