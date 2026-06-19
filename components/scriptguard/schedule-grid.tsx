import { schedule } from "./data";

export function ScheduleGrid() {
  return (
    <section>
      <h2 className="mb-3 text-base font-bold text-gray-900">
        Medication Schedule{" "}
        <span className="font-bengali font-medium text-gray-500">
          / ঔষধের সূচি
        </span>
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {schedule.map((slot) => (
          <div
            key={slot.key}
            className="rounded-xl border border-gray-100 bg-white p-4"
          >
            <div className="mb-3 flex items-center gap-2">
              <span aria-hidden="true" className="text-lg">
                {slot.icon}
              </span>
              <span className="text-sm font-semibold text-gray-900">
                {slot.label}
              </span>
              <span className="font-bengali text-sm text-gray-400">
                {slot.bengali}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {slot.meds.map((med) => (
                <div key={med.name} className="flex flex-col gap-1">
                  <span className="w-fit rounded-full bg-sky-100 px-3 py-1 text-sm font-medium text-sky-700">
                    {med.name}
                  </span>
                  <span className="pl-1 text-xs text-gray-400">
                    {med.timing}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
