import { ArrowRight, Briefcase, CheckCircle2, ChevronDown, Handshake, Hammer, Mail, Phone, Search, Users } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import { isListed } from "../../lib/billing";
import { useStore } from "../../store/AppStore";

const faqs = [
  ["Who does the chapter represent?", "Artisans, tradespeople, informal-sector workers and MSME operators across Ogun State, including plumbing, tailoring, motor mechanics, carpentry and other skilled trades."],
  ["What does the chapter do?", "It brings artisans together, strengthens cooperation among trade groups, and provides a collective platform for engagement with government, institutions and development partners."],
  ["Who leads the Ogun State Chapter?", "The chapter is led by State President Comrade Anthony Ayodele, working with association officers and local chapter representatives to advance the interests of artisans."],
  ["How do I appear in the Find Artisan directory?", "Artisans are registered by their association after verification. Once registered and up to date with the monthly facilitation fee, your profile appears in public search."],
];

function Eyebrow({ children, light }: { children: React.ReactNode; light?: boolean }) {
  return (
    <span className={`inline-block rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wide ${light ? "bg-white/10 text-mint" : "bg-forest-100 text-forest-600"}`}>
      {children}
    </span>
  );
}

export default function HomePage() {
  const { artisans, categories, associations } = useStore();
  const navigate = useNavigate();
  const towns = Array.from(new Set(associations.map((a) => a.town).filter(Boolean)));
  const activeCats = categories.filter((c) => c.status === "Active");
  const listed = artisans.filter(isListed);
  const [category, setCategory] = useState("");
  const [town, setTown] = useState("");
  const [area, setArea] = useState("");
  const [open, setOpen] = useState<number | null>(0);

  const search = (e?: React.FormEvent) => {
    e?.preventDefault();
    const p = new URLSearchParams();
    if (category) p.set("category", category);
    if (town) p.set("town", town);
    if (area.trim()) p.set("area", area.trim());
    navigate(`/search-results?${p.toString()}`);
  };

  return (
    <div>
      {/* HERO + SEARCH */}
      <section className="relative isolate overflow-hidden bg-forest-800 text-white">
        <img src="/aaon/aaon-hero-artisans.jpg" alt="" className="absolute inset-0 -z-20 h-full w-full object-cover object-[center_22%]" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-forest-900/95 via-forest-800/85 to-forest-800/60" />
        <div className="mx-auto max-w-7xl px-6 pb-16 pt-16 sm:pt-24">
          <div className="max-w-3xl">
            <Eyebrow light>Artisans… For Better Life!!! No Artisan… No Nation</Eyebrow>
            <h1 className="mt-5 text-4xl font-bold leading-tight sm:text-6xl">Empowering Artisans. Strengthening Ogun State.</h1>
            <p className="mt-5 max-w-2xl text-lg text-forest-100/85">
              Welcome to the Artisans Association of Nigeria (AAON), Ogun State Chapter — an umbrella body representing artisans, tradespeople
              and informal-sector workers across the state.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/contact" className="inline-flex items-center gap-2 rounded-xl bg-mint px-6 py-3 text-sm font-semibold text-forest-800 hover:bg-forest-300">
                Contact the Chapter <ArrowRight size={16} />
              </Link>
              <Link to="/about" className="rounded-xl border border-white/40 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10">About the Chapter</Link>
            </div>
          </div>

          <form onSubmit={search} id="find" className="mt-12 max-w-5xl rounded-2xl bg-white p-5 text-forest-900 shadow-2xl sm:p-6">
            <p className="text-lg font-bold text-forest-800">Find a skilled artisan near you</p>
            <p className="text-sm text-forest-700/60">Search by trade and location. No account needed.</p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]">
              <Select label="Artisan category" value={category} onChange={(e) => setCategory(e.target.value)}
                options={[{ label: "Any trade", value: "" }, ...activeCats.map((c) => ({ label: c.name, value: c.name }))]} />
              <Select label="Town / city" value={town} onChange={(e) => setTown(e.target.value)}
                options={[{ label: "Any town", value: "" }, ...towns.map((t) => ({ label: t, value: t }))]} />
              <Input label="Specific location" value={area} onChange={(e) => setArea(e.target.value)} placeholder="Area, neighbourhood or street" />
              <div className="flex items-end">
                <Button type="submit" className="w-full lg:w-auto"><Search size={16} /> Search</Button>
              </div>
            </div>
          </form>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              [Users, "Representing artisans' interests and concerns"],
              [Hammer, "Skills, professionalism and quality workmanship"],
              [Briefcase, "Enterprise, employment and local cooperation"],
            ].map(([Icon, t]) => {
              const I = Icon as typeof Users;
              return (
                <div key={t as string} className="flex items-center gap-4 rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur">
                  <div className="rounded-xl bg-mint p-3 text-forest-800"><I size={22} /></div>
                  <p className="font-medium">{t as string}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* MISSION */}
      <section className="bg-white py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-2">
          <div className="relative">
            <img src="/artisans/img5.png" alt="Artisan at work" className="h-96 w-[78%] rounded-2xl object-cover" />
            <img src="/aaon/assembly-square.jpg" alt="Chapter assembly" className="absolute -bottom-8 right-0 h-56 w-[52%] rounded-2xl border-8 border-white object-cover shadow-card" />
            <div className="absolute left-4 top-4 rounded-2xl bg-forest-800 px-5 py-3 text-white">
              <p className="text-3xl font-bold">20</p>
              <p className="text-xs text-mint">Local Government Areas</p>
            </div>
          </div>
          <div>
            <Eyebrow>Our Mission in Action</Eyebrow>
            <h2 className="mt-4 text-3xl font-bold text-forest-800 sm:text-4xl">A Collective Platform for Artisans Across Ogun State</h2>
            <p className="mt-4 text-forest-700/80">
              AAON Ogun State brings artisans together, strengthens cooperation among trade groups, and provides a collective platform through
              which members can engage with government, institutions and partners.
            </p>
            <div className="mt-6 flex gap-4 rounded-2xl bg-forest-50 p-5">
              <Handshake className="mt-1 shrink-0 text-forest-500" />
              <div>
                <h3 className="font-semibold text-forest-800">Practical Support</h3>
                <p className="text-sm text-forest-700/80">We advocate for practical support, improved access to skills development, and opportunities that help artisans build sustainable livelihoods.</p>
              </div>
            </div>
            <ul className="mt-5 space-y-2 text-forest-700/90">
              {["Unity across trades, so artisans and trade groups can organise and be heard.", "Professional service that strengthens trust with customers and communities."].map((t) => (
                <li key={t} className="flex gap-2"><CheckCircle2 size={18} className="mt-0.5 shrink-0 text-forest-500" />{t}</li>
              ))}
            </ul>
            <div className="mt-7 flex flex-wrap items-center gap-6">
              <Link to="/about" className="inline-flex items-center gap-2 rounded-xl bg-forest-800 px-6 py-3 text-sm font-semibold text-white hover:bg-forest-500">More About Us <ArrowRight size={16} /></Link>
              <div className="flex items-center gap-3">
                <img src="/aaon/officers-square.jpg" alt="" className="h-12 w-12 rounded-full object-cover" />
                <div><p className="text-sm font-semibold text-forest-800">Comrade Anthony Ayodele</p><p className="text-xs text-forest-700/60">State President</p></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FIND ARTISAN HUB */}
      <section className="bg-forest-800 py-16 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-6 lg:flex-row lg:items-center">
          <div className="max-w-2xl">
            <Eyebrow light>Find Artisan Hub</Eyebrow>
            <h2 className="mt-4 text-3xl font-bold sm:text-4xl">Find a Skilled Artisan Near You</h2>
            <p className="mt-3 text-forest-100/80">
              Need a plumber, tailor, motor mechanic, carpenter or another tradesperson in Ogun State? Search by trade and location and contact
              verified chapter members directly.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <div><p className="text-4xl font-bold text-mint">{listed.length}</p><p className="text-sm text-forest-100/70">listed artisans</p></div>
            <Link to="/search-results" className="rounded-xl bg-mint px-6 py-3 text-sm font-semibold text-forest-800 hover:bg-forest-300">Find Artisan Now</Link>
          </div>
        </div>
      </section>

      {/* PRIORITIES */}
      <section className="bg-white py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <Eyebrow>Our Priorities</Eyebrow>
            <h2 className="mt-4 text-3xl font-bold text-forest-800 sm:text-4xl">What the Chapter Works to Advance</h2>
            <p className="mt-4 text-forest-700/80">The chapter promotes the interests, dignity, skills and economic opportunities of artisans, and supports the growth of communities across Ogun State.</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[["Representation", "Representing artisans' interests and concerns through a shared platform."], ["Skills Development", "Encouraging professionalism and quality workmanship in every trade."]].map(([t, d]) => (
                <div key={t} className="rounded-2xl border border-forest-100 bg-forest-50 p-5">
                  <h3 className="font-semibold text-forest-800">{t}</h3><p className="mt-1 text-sm text-forest-700/80">{d}</p>
                </div>
              ))}
            </div>
            <ul className="mt-5 space-y-2 text-forest-700/90">
              {["Supporting collaboration between artisans, government and private-sector partners", "Promoting opportunities for local enterprise, employment and economic development", "Strengthening communication and cooperation among local government area chapters"].map((t) => (
                <li key={t} className="flex gap-2"><CheckCircle2 size={18} className="mt-0.5 shrink-0 text-forest-500" />{t}</li>
              ))}
            </ul>
            <Link to="/contact" className="mt-7 inline-flex rounded-xl bg-forest-800 px-6 py-3 text-sm font-semibold text-white hover:bg-forest-500">Get In Touch</Link>
          </div>
          <div className="order-1 grid grid-cols-2 gap-4 lg:order-2">
            <img src="/artisans/img1.png" alt="" className="h-80 w-full rounded-2xl object-cover" />
            <img src="/artisans/img8.png" alt="" className="mt-10 h-80 w-full rounded-2xl object-cover" />
            <div className="col-span-2 flex items-center gap-4 rounded-2xl bg-forest-50 p-4">
              <div className="flex -space-x-3">
                {["leadership", "officers", "patron"].map((n) => <img key={n} src={`/aaon/${n}-square.jpg`} alt="" className="h-12 w-12 rounded-full border-2 border-white object-cover" />)}
              </div>
              <div><p className="font-bold text-forest-800">One umbrella body</p><p className="text-sm text-forest-700/70">for artisans in Ogun State</p></div>
            </div>
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="bg-forest-50 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-2xl">
            <Eyebrow>Our Values</Eyebrow>
            <h2 className="mt-4 text-3xl font-bold text-forest-800 sm:text-4xl">How the Chapter Serves Artisans and the State</h2>
            <p className="mt-4 text-forest-700/80">Artisans are an important source of employment and practical expertise, contributing to households, businesses and the wider Ogun State economy.</p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[["Unity", "Bringing artisans and trade groups together."], ["Representation", "Advocating for members' interests through constructive engagement."]].map(([t, d]) => (
              <div key={t} className="rounded-2xl border border-forest-100 bg-white p-6 shadow-card"><h3 className="text-lg font-semibold text-forest-800">{t}</h3><p className="mt-2 text-sm text-forest-700/80">{d}</p></div>
            ))}
            <div className="rounded-2xl bg-forest-800 p-6 text-white">
              <h3 className="text-lg font-semibold">Professionalism, Opportunity and Partnership</h3>
              <ul className="mt-3 space-y-2 text-sm text-forest-100/85">
                {["Encouraging quality, reliability and ethical service", "Supporting skills, enterprise and employment growth", "Working with relevant institutions and stakeholders"].map((t) => <li key={t} className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-forest-300" />{t}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* LEADERSHIP */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow>Leadership</Eyebrow>
            <h2 className="mt-4 text-3xl font-bold text-forest-800 sm:text-4xl">Led for Artisans Across Ogun State</h2>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[["leadership", "Comrade Anthony Ayodele", "State President"], ["officers", "Association Officers", "Chapter Leadership"], ["members", "Local Chapter Representatives", "Community Coordination"]].map(([img, n, r]) => (
              <Link to="/about" key={n} className="group overflow-hidden rounded-2xl border border-forest-100 bg-white shadow-card">
                <img src={`/aaon/${img}.jpg`} alt={n} className="h-72 w-full object-cover object-top transition-transform duration-500 group-hover:scale-105" />
                <div className="p-5"><p className="font-semibold text-forest-800">{n}</p><p className="text-sm text-forest-700/60">{r}</p></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ + CONTACT */}
      <section className="bg-forest-50 py-20">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-2">
          <div className="relative overflow-hidden rounded-2xl">
            <img src="/aaon/community-portrait.jpg" alt="" className="h-full min-h-[420px] w-full object-cover" />
            <div className="absolute inset-x-4 bottom-4 rounded-2xl bg-white/95 p-5 shadow-card backdrop-blur">
              <h3 className="font-bold text-forest-800">Need to Reach the Chapter?</h3>
              <p className="mt-1 text-sm text-forest-700/80">Enquire about membership, connect a trade group, raise an issue, or discuss a partnership.</p>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-forest-700/80">
                <span className="flex items-center gap-2"><Phone size={15} className="text-forest-500" /> Number to be confirmed</span>
                <span className="flex items-center gap-2"><Mail size={15} className="text-forest-500" /> Email to be confirmed</span>
              </div>
            </div>
          </div>
          <div>
            <Eyebrow>Questions</Eyebrow>
            <h2 className="mt-4 text-3xl font-bold text-forest-800 sm:text-4xl">About the Ogun State Chapter</h2>
            <div className="mt-6 space-y-3">
              {faqs.map(([q, a], i) => (
                <div key={q} className="rounded-2xl border border-forest-100 bg-white">
                  <button className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold text-forest-800" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}>
                    Q{i + 1}. {q}
                    <ChevronDown size={18} className={`shrink-0 transition-transform ${open === i ? "rotate-180" : ""}`} />
                  </button>
                  {open === i && <p className="px-5 pb-4 text-sm text-forest-700/80">{a}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
