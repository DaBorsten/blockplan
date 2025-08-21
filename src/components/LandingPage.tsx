import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { CalendarDays, StickyNote, Share2 } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between p-4 md:p-6 h-16">
        <span className="font-semibold">Blockplan</span>
        <div className="flex items-center gap-2">
          <SignInButton mode="modal">
            <Button variant="ghost" size="sm" className="cursor-pointer">
              Anmelden
            </Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button size="sm" className="cursor-pointer">
              Registrieren
            </Button>
          </SignUpButton>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-3xl w-full text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Dein Stundenplan mit Notizen
          </h1>
          <p className="text-muted-foreground text-base md:text-lg">
            Organisiere Unterricht, erfasse Notizen pro Stunde und arbeite in
            Klassen zusammen.
          </p>
          <div className="flex items-center justify-center gap-3">
            <SignUpButton mode="modal">
              <Button size="lg" className="cursor-pointer">
                Jetzt starten
              </Button>
            </SignUpButton>
            <SignInButton mode="modal">
              <Button variant="outline" size="lg" className="cursor-pointer">
                Ich habe bereits ein Konto
              </Button>
            </SignInButton>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6">
            <div className="rounded-lg border p-4 flex flex-col items-center gap-2">
              <CalendarDays className="h-6 w-6" suppressHydrationWarning />
              <div className="font-medium">Woche im Blick</div>
              <div className="text-xs text-muted-foreground">
                Schnell zwischen Wochen wechseln
              </div>
            </div>
            <div className="rounded-lg border p-4 flex flex-col items-center gap-2">
              <StickyNote className="h-6 w-6" suppressHydrationWarning />
              <div className="font-medium">Notizen je Stunde</div>
              <div className="text-xs text-muted-foreground">
                Strukturiert, gruppenbasiert
              </div>
            </div>
            <div className="rounded-lg border p-4 flex flex-col items-center gap-2">
              <Share2 className="h-6 w-6" suppressHydrationWarning />
              <div className="font-medium">Gemeinsam arbeiten</div>
              <div className="text-xs text-muted-foreground">
                Klassen verwalten und einladen
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
