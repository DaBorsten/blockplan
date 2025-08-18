import { ModeToggle } from "@/components/theme-toggle";

export default function Settings() {
  return (
    <div className="px-4 md:px-6 pb-4 md:pb-6 h-full w-full">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
          Einstellungen
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Webseite Einstellungen
        </p>
      </div>

      <ModeToggle />
    </div>
  );
}
