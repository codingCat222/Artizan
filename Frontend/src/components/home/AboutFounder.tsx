import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cacNumber, founder, motto, orgName, registeredName } from "../../data/leadership";

/** Right after the hero: who the Association is, and its Founder, shown prominently. */
export default function AboutFounder() {
    return (
        <section id="about-association" className="scroll-mt-24 bg-white py-20">
            <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-12">
                {/* Founder photos */}
                <div className="lg:col-span-5">
                    <div className="relative">
                        <div className="absolute -bottom-4 -left-4 h-full w-full rounded-3xl bg-forest-100" aria-hidden />
                        <img
                            src={founder.photo}
                            alt={`The Founder of the ${orgName}`}
                            className="relative aspect-[3/4] w-full rounded-3xl object-cover object-top shadow-card"
                            width={960}
                            height={1280}
                        />
                        <div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-white/95 px-5 py-3 shadow-card backdrop-blur">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gold-600">{founder.title}</p>
                            <p className="font-bold text-forest-800">{founder.name || `Founder of the ${orgName}`}</p>
                        </div>
                    </div>
                    <div className="mt-8 grid grid-cols-2 gap-4">
                        {founder.more.map((m) => (
                            <img key={m.src} src={m.src} alt={m.alt} loading="lazy" decoding="async"
                                className="aspect-[3/4] w-full rounded-2xl object-cover object-top shadow-card" />
                        ))}
                    </div>
                </div>

                {/* About */}
                <div className="lg:col-span-7">
                    <span className="inline-block rounded-full bg-forest-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-forest-600">
                        About the Association
                    </span>
                    <h2 className="mt-4 text-3xl font-bold text-forest-800 sm:text-4xl">
                        One Body for the Artisans, Technicians and Craftsmen of Ogun State
                    </h2>
                    <p className="mt-5 text-lg leading-relaxed text-forest-700/85">
                        The {orgName} brings artisans together, strengthens cooperation among trade groups, and provides a collective platform
                        through which members can engage with government, institutions and partners.
                    </p>
                    <p className="mt-4 leading-relaxed text-forest-700/80">
                        It represents artisans' interests and concerns, encourages skills, professionalism and quality workmanship, and promotes
                        opportunities for local enterprise, employment and economic development across the state.
                    </p>

                    <div className="mt-8 rounded-2xl border border-forest-100 bg-forest-50 p-6">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gold-600">Our Founder</p>
                        {founder.name && <p className="mt-1 text-xl font-bold text-forest-800">{founder.name}</p>}
                        <p className="mt-2 leading-relaxed text-forest-700/85">
                            {founder.message || `The Association stands on the vision of its Founder: a single, recognised home for every artisan, technician and craftsman in Ogun State.`}
                        </p>
                    </div>

                    <p className="mt-6 text-sm font-semibold italic text-forest-600">“{motto}”</p>
                    <p className="mt-2 text-xs text-forest-700/60">Registered as {registeredName} · {cacNumber}</p>

                    <div className="mt-7 flex flex-wrap gap-3">
                        <a href="#leadership" className="inline-flex items-center gap-2 rounded-xl bg-forest-800 px-6 py-3 text-sm font-semibold text-white hover:bg-forest-500">
                            Meet our leadership <ArrowRight size={16} />
                        </a>
                        <Link to="/search-results" className="rounded-xl border border-forest-200 px-6 py-3 text-sm font-semibold text-forest-800 hover:bg-forest-50">
                            Find an artisan
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}