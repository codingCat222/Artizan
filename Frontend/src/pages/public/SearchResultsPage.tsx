import { CheckCircle2, MapPin, Search as SearchIcon } from "lucide-react";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Notice from "../../components/ui/Notice";
import Select from "../../components/ui/Select";
import { useApi } from "../../lib/useApi";
import { publicApi } from "../../services/public";

const PAGE_SIZE = 12;

export default function SearchResultsPage() {
  const [params, setParams] = useSearchParams();
  // The address bar is the source of truth, so searches can be shared and the back button works.
  const category = params.get("category") ?? "";
  const town = params.get("town") ?? "";
  const area = params.get("area") ?? "";
  const page = Math.max(1, Number(params.get("page")) || 1);

  const [form, setForm] = useState({ category, town, area });
  const filters = useApi(publicApi.filters);
  const { data, loading, error, reload } = useApi(
    () => publicApi.search({ category, town, area, page, pageSize: PAGE_SIZE }),
    [category, town, area, page],
  );

  const results = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const go = (next: { category?: string; town?: string; area?: string; page?: number }) => {
    const p = new URLSearchParams();
    if (next.category) p.set("category", next.category);
    if (next.town) p.set("town", next.town);
    if (next.area?.trim()) p.set("area", next.area.trim());
    if (next.page && next.page > 1) p.set("page", String(next.page));
    setParams(p);
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <form
        onSubmit={(e) => { e.preventDefault(); go(form); }}
        className="rounded-2xl border border-forest-100 bg-white p-4 shadow-card"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]">
          <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
            options={[{ label: "Any category", value: "" }, ...(filters.data?.categories ?? []).map((c) => ({ label: c, value: c }))]} />
          <Select value={form.town} onChange={(e) => setForm({ ...form, town: e.target.value })}
            options={[{ label: "Any town / city", value: "" }, ...(filters.data?.towns ?? []).map((t) => ({ label: t, value: t }))]} />
          <Input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} placeholder="Specific location (area, street)" />
          <Button type="submit"><SearchIcon size={16} /> Apply Filters</Button>
        </div>
      </form>

      <div className="mt-6 flex items-center justify-between">
        <h1 className="text-lg font-bold text-forest-900">
          {data ? `${total} artisan${total !== 1 ? "s" : ""} found` : loading ? "Searching..." : ""}
        </h1>
      </div>

      {error && <div className="mt-4"><Notice tone="error">{error} <button className="ml-2 font-medium underline" onClick={reload}>Try again</button></Notice></div>}

      {data && results.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-forest-200 bg-white p-16 text-center">
          <p className="font-semibold text-forest-900">No artisans match your search</p>
          <p className="mt-1 text-sm text-forest-700/60">Try a different category, a nearby area, or search the whole town.</p>
          <Button variant="secondary" className="mt-4" onClick={() => { setForm({ category: "", town: "", area: "" }); setParams(new URLSearchParams()); }}>
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((a) => (
            <Link key={a.id} to={`/artisans/${a.id}`}
              className="rounded-2xl border border-forest-100 bg-white p-5 shadow-card transition-transform hover:-translate-y-0.5 hover:shadow-lg">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-forest-700 text-sm font-bold text-white">{a.initials}</div>
                <div>
                  <p className="font-semibold text-forest-900">{a.name}</p>
                  <p className="text-xs text-forest-700/60">{a.category}</p>
                </div>
                <CheckCircle2 size={16} className="ml-auto text-fresh-500" aria-label="Verified" />
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-xs text-forest-700/60"><MapPin size={13} />{a.area}, {a.town}</div>
              <p className="mt-3 line-clamp-2 text-sm text-forest-700/70">{a.description}</p>
            </Link>
          ))}
        </div>
      )}

      {total > PAGE_SIZE && (
        <div className="mt-8 flex items-center justify-between text-sm text-forest-700/70">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={page <= 1 || loading} onClick={() => go({ category, town, area, page: page - 1 })}>Previous</Button>
            <Button variant="secondary" size="sm" disabled={page >= totalPages || loading} onClick={() => go({ category, town, area, page: page + 1 })}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}