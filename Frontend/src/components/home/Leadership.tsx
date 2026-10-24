import { Building2, Compass, Landmark, MapPin, Users } from "lucide-react";
import { advisoryCouncil, bot, divisions, exco, lgas, motto, orgName, Person, president } from "../../data/leadership";

function Eyebrow({ children }: { children: React.ReactNode }) {
    return <span className="inline-block rounded-full bg-forest-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-forest-600">{children}</span>;
}

function Initials({ name, className = "" }: { name: string; className?: string }) {
    const i = name.replace(/^(Hon\.|Com\.|Mr\.|Mrs\.|Dr\.|Chief|Comrade|Rt Hon\.)\s+/i, "").split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
    return <div className={`flex items-center justify-center bg-forest-700 font-bold text-white ${className}`} aria-hidden>{i}</div>;
}

/** A portrait in a gold frame, like the official EXCO poster. */
function FramedPortrait({ person, large, bare }: { person: Person; large?: boolean; bare?: boolean }) {
    return (
        <figure className="group flex flex-col items-center text-center">
            <div className={`rounded-xl bg-gradient-to-br from-gold-400 via-gold-600 to-gold-400 p-1 shadow-card ${large ? "w-full max-w-xs" : "w-full"}`}>
                <div className="rounded-lg bg-white p-1">
                    {person.photo ? (
                        <img src={person.photo} alt={person.name} loading="lazy" decoding="async"
                            className="aspect-[4/5] w-full rounded-md object-cover object-top" />
                    ) : (
                        <Initials name={person.name} className="aspect-[4/5] w-full rounded-md text-2xl" />
                    )}
                </div>
            </div>
            {!bare && <figcaption className="mt-3">
                <p className={`font-semibold leading-snug text-forest-800 ${large ? "text-lg" : "text-sm"}`}>{person.name}</p>
                <p className={`mt-0.5 leading-snug text-gold-600 ${large ? "text-sm" : "text-xs"} font-medium`}>{person.title}</p>
            </figcaption>}
        </figure>
    );
}

const structure = [
    { icon: Landmark, label: "Board of Trustees", href: "#bot", note: "BOT" },
    { icon: Compass, label: "Advisory Council", href: "#advisory", note: "Advisers" },
    { icon: Users, label: "State Executives Council", href: "#exco", note: "SEC 2025 – 2029" },
    { icon: Building2, label: "Divisional Coordinators", href: "#divisions", note: "Egba · Ijebu · Remo · Yewa" },
    { icon: MapPin, label: "Local Government Chairmen", href: "#lgas", note: "All 20 LGAs" },
];

export default function Leadership() {
    const others = exco;
    return (
        <section id="leadership" className="scroll-mt-24 bg-forest-50 py-20">
            <div className="mx-auto max-w-7xl px-6">
                <div className="mx-auto max-w-3xl text-center">
                    <Eyebrow>Leadership &amp; Structure</Eyebrow>
                    <h2 className="mt-4 text-3xl font-bold text-forest-800 sm:text-4xl">How the {orgName} Is Organised</h2>
                    <p className="mt-4 text-forest-700/80">From the Board of Trustees down to every Local Government Area, one structure keeps artisans across Ogun State connected.</p>
                </div>

                {/* Structure at a glance */}
                <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    {structure.map((s, i) => (
                        <li key={s.label}>
                            <a href={s.href} className="group flex h-full flex-col rounded-2xl border border-forest-100 bg-white p-5 shadow-card transition-transform hover:-translate-y-0.5">
                                <div className="flex items-center justify-between">
                                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-forest-800 text-mint"><s.icon size={20} /></span>
                                    <span className="text-xs font-bold text-forest-700/40">0{i + 1}</span>
                                </div>
                                <p className="mt-4 font-semibold leading-snug text-forest-800 group-hover:text-forest-500">{s.label}</p>
                                <p className="mt-1 text-xs text-forest-700/60">{s.note}</p>
                            </a>
                        </li>
                    ))}
                </ol>

                {/* Board of Trustees */}
                <div id="bot" className="mt-20 scroll-mt-24">
                    <h3 className="text-2xl font-bold text-forest-800">Board of Trustees</h3>
                    <div className="mt-6 flex flex-col items-center gap-8 rounded-3xl border border-forest-100 bg-white p-6 shadow-card sm:flex-row sm:p-8">
                        <div className="w-48 shrink-0">
                            <FramedPortrait person={bot.chairman} bare />
                        </div>
                        <div className="text-center sm:text-left">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gold-600">{bot.chairman.title}</p>
                            <p className="mt-1 text-2xl font-bold text-forest-800">{bot.chairman.name}</p>
                            <p className="mt-2 max-w-xl text-forest-700/80">Chairman of the Board of Trustees of the {orgName}.</p>
                        </div>
                    </div>
                    {bot.members.length > 0 && (
                        <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">{bot.members.map((m) => <FramedPortrait key={m.name} person={m} />)}</div>
                    )}
                </div>

                {/* Advisory Council: appears once members are added in src/data/leadership.ts */}
                {advisoryCouncil.length > 0 && (
                    <div id="advisory" className="mt-20 scroll-mt-24">
                        <h3 className="text-2xl font-bold text-forest-800">Advisory Council</h3>
                        <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">{advisoryCouncil.map((m) => <FramedPortrait key={m.name} person={m} />)}</div>
                    </div>
                )}

                {/* State Executives Council */}
                <div id="exco" className="mt-20 scroll-mt-24">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <h3 className="text-2xl font-bold text-forest-800">State Executives Council</h3>
                            <p className="mt-1 text-forest-700/70">Faces of the EXCOs · 2025 – 2029</p>
                        </div>
                        <p className="text-sm font-semibold italic text-forest-600">“{motto}”</p>
                    </div>

                    <div className="mt-8 flex justify-center">
                        <div className="w-full max-w-xs"><FramedPortrait person={president} large /></div>
                    </div>

                    <div className="mt-12 grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                        {others.map((m) => <FramedPortrait key={m.name} person={m} />)}
                    </div>
                </div>

                {/* Divisional Coordinators */}
                <div id="divisions" className="mt-20 scroll-mt-24">
                    <h3 className="text-2xl font-bold text-forest-800">Divisional Coordinators</h3>
                    <p className="mt-1 text-forest-700/70">Ogun State's four divisions, each with its coordinator.</p>
                    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {divisions.map((d) => (
                            <div key={d} className="rounded-2xl border border-forest-100 bg-white p-5 shadow-card">
                                <p className="text-sm font-bold uppercase tracking-wide text-forest-500">{d} Division</p>
                                <ul className="mt-3 space-y-3">
                                    {exco.filter((m) => m.division === d).map((m) => (
                                        <li key={m.name} className="flex items-center gap-3">
                                            <img src={m.photo} alt="" loading="lazy" className="h-12 w-12 shrink-0 rounded-full object-cover object-top ring-2 ring-gold-400" />
                                            <div>
                                                <p className="text-sm font-semibold leading-snug text-forest-800">{m.name}</p>
                                                <p className="text-xs text-forest-700/60">Coordinator</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 20 LGAs */}
                <div id="lgas" className="mt-20 scroll-mt-24">
                    <h3 className="text-2xl font-bold text-forest-800">Local Government Chairmen</h3>
                    <p className="mt-1 text-forest-700/70">The Association is organised in each of Ogun State's 20 Local Government Areas.</p>
                    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                        {lgas.map((l, i) => (
                            <div key={l.name} className="rounded-xl border border-forest-100 bg-white px-4 py-3 shadow-card">
                                <p className="text-[11px] font-bold text-forest-700/40">LGA {String(i + 1).padStart(2, "0")}</p>
                                <p className="mt-0.5 text-sm font-semibold leading-snug text-forest-800">{l.name}</p>
                                {l.chairman && <p className="mt-1 text-xs text-gold-600">Chairman: {l.chairman}</p>}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}