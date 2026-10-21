import { CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import PageBanner from "../../components/PageBanner";

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-block rounded-full bg-forest-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-forest-600">{children}</span>
);
const Check = ({ children }: { children: React.ReactNode }) => (
  <li className="flex gap-2"><CheckCircle2 size={18} className="mt-0.5 shrink-0 text-forest-500" />{children}</li>
);

export default function AboutPage() {
  return (
    <div>
      <PageBanner title="About Us" />

      <section className="bg-white py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-2">
          <div>
            <Eyebrow>Who We Are</Eyebrow>
            <h2 className="mt-4 text-3xl font-bold text-forest-800 sm:text-4xl">A Representative Body for Artisans and Tradespeople</h2>
            <p className="mt-4 text-forest-700/80">
              The Artisans Association of Nigeria (AAON), Ogun State Chapter, is a representative body for artisans and tradespeople across Ogun
              State. It provides a shared platform for workers and small businesses in the informal sector to organise, collaborate and make their
              voices heard on matters affecting them.
            </p>
            <h3 className="mt-6 text-lg font-semibold text-forest-800">Our Purpose</h3>
            <p className="mt-2 text-forest-700/80">
              We aim to strengthen the artisan community by encouraging unity across trades, promoting responsible and professional service,
              supporting skills development, and advocating for an enabling environment in which artisan-led businesses can grow.
            </p>
            <ul className="mt-4 space-y-2 text-forest-700/90">
              <Check>Artisans are an important source of employment and practical expertise.</Check>
              <Check>Their work contributes to households, businesses and the wider Ogun State economy.</Check>
            </ul>
            <Link to="/contact" className="mt-7 inline-flex rounded-xl bg-forest-800 px-6 py-3 text-sm font-semibold text-white hover:bg-forest-500">Contact the Chapter</Link>
          </div>
          <div className="relative">
            <img src="/aaon/officers.jpg" alt="Chapter officers" className="h-[28rem] w-full rounded-2xl object-cover object-top" />
            <div className="absolute bottom-4 left-4 rounded-2xl bg-white/95 px-5 py-3 shadow-card">
              <p className="font-semibold text-forest-800">Comrade Anthony Ayodele</p>
              <p className="text-xs text-forest-700/60">State President</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-forest-50 py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-2">
          <img src="/aaon/dialogue-square.jpg" alt="Dialogue with stakeholders" className="h-96 w-full rounded-2xl object-cover" />
          <div>
            <Eyebrow>Engagement and Partnerships</Eyebrow>
            <h2 className="mt-4 text-3xl font-bold text-forest-800 sm:text-4xl">Dialogue That Supports Artisans and the State Economy</h2>
            <p className="mt-4 text-forest-700/80">
              AAON Ogun State engages with relevant public institutions and stakeholders on issues that affect artisans, promoting constructive
              cooperation on economic development, skills training, public-private partnerships and practical support for workers.
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-forest-100 bg-white p-5"><h3 className="font-semibold text-forest-800">State Institutions</h3><p className="mt-1 text-sm text-forest-700/80">Dialogue with the Ogun State Government and relevant ministries and agencies.</p></div>
              <div className="rounded-2xl border border-forest-100 bg-white p-5"><h3 className="font-semibold text-forest-800">House of Assembly</h3><p className="mt-1 text-sm text-forest-700/80">Engagement with the Ogun State House of Assembly at Oke-Mosan, Abeokuta.</p></div>
            </div>
            <ul className="mt-5 space-y-2 text-forest-700/90">
              <Check>Advocacy for recognition, training, resources and opportunities</Check>
              <Check>Support for operational processes, documentation and registration</Check>
              <Check>Programmes that help members serve customers and run their businesses</Check>
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-2xl">
            <Eyebrow>Our Values</Eyebrow>
            <h2 className="mt-4 text-3xl font-bold text-forest-800 sm:text-4xl">Unity, Representation and Professional Service</h2>
            <p className="mt-4 text-forest-700/80">The chapter works through local chapters and trade groups so artisans' concerns can be raised from communities across Ogun State.</p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[["Unity", "Bringing artisans and trade groups together."], ["Representation", "Advocating for members' interests through constructive engagement."]].map(([t, d]) => (
              <div key={t} className="rounded-2xl border border-forest-100 bg-forest-50 p-6"><h3 className="text-lg font-semibold text-forest-800">{t}</h3><p className="mt-2 text-sm text-forest-700/80">{d}</p></div>
            ))}
            <div className="rounded-2xl bg-forest-800 p-6 text-white">
              <h3 className="text-lg font-semibold">Professionalism, Opportunity and Partnership</h3>
              <ul className="mt-3 space-y-2 text-sm text-forest-100/85">
                <li>Professionalism: quality, reliability and ethical service</li>
                <li>Opportunity: skills, enterprise and employment growth</li>
                <li>Partnership: working with institutions and stakeholders</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-forest-800 py-16 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-6 lg:flex-row lg:items-center">
          <div className="max-w-2xl">
            <Eyebrow>Local Chapters</Eyebrow>
            <h2 className="mt-4 text-3xl font-bold">Organised From Communities Across the State</h2>
            <p className="mt-3 text-forest-100/80">Local structures help coordinate communication, identify members' needs and connect artisans with relevant association activities.</p>
            <p className="mt-3 font-medium text-mint">Together, we can build a stronger, more organised and more prosperous artisan community in Ogun State.</p>
          </div>
          <Link to="/contact" className="rounded-xl bg-mint px-6 py-3 text-sm font-semibold text-forest-800 hover:bg-forest-300">Reach the Chapter</Link>
        </div>
      </section>
    </div>
  );
}
