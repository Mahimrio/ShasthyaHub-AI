import { TriangleAlert } from "lucide-react";

export function InteractionAlert() {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-r-xl border-l-4 border-red-500 bg-red-50 p-4 sm:p-5"
    >
      <TriangleAlert
        className="mt-0.5 h-5 w-5 shrink-0 text-red-600"
        aria-hidden="true"
      />
      <div className="min-w-0">
        <h2 className="text-sm font-bold leading-snug text-red-700 sm:text-base">
          CRITICAL DRUG INTERACTION{" "}
          <span className="font-bengali">/ মারাত্মক মিথস্ক্রিয়া</span>
        </h2>
        <p className="mt-1 text-sm text-red-600">
          Naproxen + Azithromycin may affect liver function. Consult your doctor
          before taking these together.
        </p>
      </div>
    </div>
  );
}
