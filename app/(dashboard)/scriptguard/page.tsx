import { InteractionAlert } from "@/components/scriptguard/interaction-alert";
import { MedicationsTable } from "@/components/scriptguard/medications-table";
import { ScheduleGrid } from "@/components/scriptguard/schedule-grid";
import { AudioGuide } from "@/components/scriptguard/audio-guide";

export default function ScriptGuardPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
        <header className="mb-6">
          <p className="text-xs font-medium uppercase tracking-widest text-gray-400">
            ScriptGuard
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
            Prescription Analysis{" "}
            <span className="font-bengali text-gray-400">
              / প্রেসক্রিপশন বিশ্লেষণ
            </span>
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">
            We read your handwritten prescription and checked it for safety,
            dosing, and a daily schedule.
          </p>
        </header>

        <div className="flex flex-col gap-6">
          <InteractionAlert />
          <MedicationsTable />
          <ScheduleGrid />
          <AudioGuide />
        </div>
      </div>
    </main>
  );
}
