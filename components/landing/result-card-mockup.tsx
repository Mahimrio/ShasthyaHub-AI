import { Eye, AlertTriangle, CalendarClock } from "lucide-react";

export function ResultCardMockup() {
  return (
    <div className="w-full max-w-sm rotate-1 rounded-2xl border-l-4 border-orange-400 bg-white p-6 shadow-2xl shadow-gray-900/10 ring-1 ring-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
            <Eye className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-bold text-gray-900">NayanAI</p>
            <p className="text-xs text-gray-400">Retinal Screening</p>
          </div>
        </div>
        <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-700">
          Moderate
        </span>
      </div>

      {/* Finding */}
      <div className="mt-5">
        <p className="text-xs uppercase tracking-wide text-gray-400">
          Detected Condition
        </p>
        <p className="mt-1 text-lg font-bold text-gray-900">
          Diabetic Retinopathy
        </p>
      </div>

      {/* Confidence */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Confidence</span>
          <span className="font-semibold text-gray-900">87%</span>
        </div>
        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500"
            style={{ width: "87%" }}
          />
        </div>
      </div>

      {/* Recommendation */}
      <div className="mt-5 rounded-xl bg-gray-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Recommendation
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
          Early signs of retinal damage detected. Consult an ophthalmologist
          within 2 weeks for a dilated eye exam.
        </p>
      </div>

      {/* Urgency */}
      <div className="mt-4 flex items-center gap-3 text-sm">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-orange-50 px-2.5 py-1 font-medium text-orange-700">
          <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
          Refer Soon
        </span>
        <span className="inline-flex items-center gap-1.5 text-gray-400">
          <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
          Within 14 days
        </span>
      </div>
    </div>
  );
}
