import { CheckCircle2, MapPin, Search as SearchIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import { isListed } from "../../lib/billing";
import { useStore } from "../../store/AppStore";

export default function SearchResultsPage() {
  const { artisans, categories, associations } = useStore();
  const towns = Array.from(new Set(associations.map((a) => a.town).filter(Boolean)));
  const [params, setParams] = useSearchParams();
  const [category, setCategory] = useState(params.get("category") ?? "");
  const [area, setArea] = useState(params.get("area") ?? "");
  const [town, setTown] = useState(params.get("town") ?? "");

  const results = useMemo(() => {
    return artisans.filter((a) => {
      if (!isListed(a)) return false; // only active, verified, paid-up artisans are public
      if (category && a.category !== category) return false;
      if (town && a.town !== town) return false;
      if (area.trim() && !`${a.area}`.toLowerCase().includes(area.trim().toLowerCase())) return false;
      return true;
    });
  }, [artisans, category, town, area]);

  const applyFilters = () => {
    const next = new URLSearchParams();
    if (category) next.set("category", category);
    if (town) next.set("town", town);
    if (area.trim()) next.set("area", area.trim());
    setParams(next);
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="rounded-2xl border border-forest-100 bg-white p-4 shadow-card">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]">
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={[
              { label: "Any category", value: "" },
              ...categories.filter((c) => c.status === "Active").map((c) => ({ label: c.name, value: c.name })),
            ]}
          />
          <Select
            value={town}
            onChange={(e) => setTown(e.target.value)}
            options={[
              { label: "Any town / city", value: "" },
              ...towns.map((t) => ({ label: t, value: t })),
            ]}
          />
          <Input
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="Specific location (area, street)"
          />
          <Button onClick={applyFilters}>
            <SearchIcon size={16} /> Apply Filters
          </Button>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <h1 className="text-lg font-bold text-forest-900">
          {results.length} artisan{results.length !== 1 ? "s" : ""} found
        </h1>
      </div>

      {results.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-forest-200 bg-white p-16 text-center">
          <p className="font-semibold text-forest-900">No artisans match your search</p>
          <p className="mt-1 text-sm text-forest-700/60">
            Try a different category, a nearby area, or search the whole town.
          </p>
          <Button
            variant="secondary"
            className="mt-4"
            onClick={() => { setCategory(""); setTown(""); setArea(""); setParams(new URLSearchParams()); }}
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((a) => (
            <Link
              key={a.id}
              to={`/artisans/${a.id}`}
              className="rounded-2xl border border-forest-100 bg-white p-5 shadow-card transition-transform hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-forest-700 text-sm font-bold text-white">
                  {a.avatarInitials}
                </div>
                <div>
                  <p className="font-semibold text-forest-900">{a.name}</p>
                  <p className="text-xs text-forest-700/60">{a.category}</p>
                </div>
                {a.verification === "Verified" && (
                  <CheckCircle2 size={16} className="ml-auto text-fresh-500" />
                )}
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-xs text-forest-700/60">
                <MapPin size={13} />
                {a.area}, {a.town}
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-forest-700/70">
                {a.businessDescription}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
