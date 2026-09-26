import type { Metadata } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { AppState } from "@/components/app-state";
import { Shell } from "@/components/shell";
import { liveModeOrRefusal } from "@/lib/env";
import "./globals.css";

const source = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Investing Reps",
  description: "Learn a technique. Test your judgment. Share your reasoning.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const gate = liveModeOrRefusal();

  if (gate.mode === "blocked") {
    return (
      <html lang="en">
        <body className={`${source.variable} ${fraunces.variable} bg-paper text-ink antialiased`}>
          <main className="mx-auto max-w-lg px-4 py-16">
            <p className="text-sm font-semibold text-danger">Database blocked</p>
            <h1 className="mt-2 text-3xl">This app will not use that database.</h1>
            <p className="mt-4 text-lg leading-7">{gate.reason}</p>
          </main>
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <body className={`${source.variable} ${fraunces.variable} bg-paper text-ink antialiased`}>
        <AppState mode={gate.mode} modeReason={gate.mode === "demo" ? gate.reason : ""}>
          <Shell>{children}</Shell>
        </AppState>
      </body>
    </html>
  );
}
