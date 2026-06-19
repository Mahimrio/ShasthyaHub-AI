import { medications, type MatchLevel } from "./data";

function MatchBadge({ match }: { match: MatchLevel }) {
  if (match === "high") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
        {"\u2713"} High
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
      {"~"} Medium
    </span>
  );
}

export function MedicationsTable() {
  return (
    <section className="rounded-xl border border-gray-100 bg-white">
      <div className="border-b border-gray-100 p-4 sm:p-5">
        <h2 className="text-base font-bold text-gray-900">
          Extracted Medications
        </h2>
        <p className="mt-0.5 text-sm text-gray-500">
          {medications.length} medicines detected from your prescription
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <thead>
            <tr className="text-xs uppercase tracking-widest text-gray-500">
              <th className="px-4 py-3 font-medium sm:px-5">Written</th>
              <th className="px-4 py-3 font-medium sm:px-5">Brand Name</th>
              <th className="px-4 py-3 font-medium sm:px-5">Generic Name</th>
              <th className="px-4 py-3 font-medium sm:px-5">Drug Class</th>
              <th className="px-4 py-3 font-medium sm:px-5">Match</th>
            </tr>
          </thead>
          <tbody>
            {medications.map((med, i) => (
              <tr
                key={med.written}
                className={i % 2 === 1 ? "bg-gray-50" : "bg-white"}
              >
                <td className="px-4 py-3 font-mono text-sm text-gray-500 sm:px-5">
                  {med.written}
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-gray-900 sm:px-5">
                  {med.brand}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700 sm:px-5">
                  {med.generic}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 sm:px-5">
                  {med.drugClass}
                </td>
                <td className="px-4 py-3 sm:px-5">
                  <MatchBadge match={med.match} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
