/**
 * Everything shown in the About / Leadership / Gallery parts of the home page lives in this file
 * and src/data/gallery.ts, so a spelling fix or a new name never means touching page code.
 * Photos live in /public/leadership and /public/gallery.
 *
 * Names and offices for the State Executives Council were transcribed from the 2025-2029 EXCO poster
 * exactly as printed. Please have the Association proof-read them before launch.
 */

export interface Person {
    name: string;
    title: string;
    photo?: string;
    /** Set for divisional coordinators: Egba, Ijebu, Remo or Yewa. */
    division?: "Egba" | "Ijebu" | "Remo" | "Yewa";
}

export const orgName = "Artisans Association of Ogun";
export const registeredName = "Artisan Association of Ogun State, Nigeria (AAON)";
export const cacNumber = "CAC/IT/NO: 118130";
export const motto = "Artisan! For better life. No Artisan, No Nation.";

/** The Founder. Add `name` (and optionally `message`) once confirmed; the page shows them automatically. */
export const founder = {
    name: "",
    title: "Founder",
    message: "",
    photo: "/leadership/founder-seated.webp",
    more: [
        { src: "/leadership/founder-portrait.webp", alt: "The Founder of the Artisans Association of Ogun, smiling" },
        { src: "/leadership/founder-standing.webp", alt: "The Founder of the Artisans Association of Ogun, standing" },
    ],
};

export const president: Person = {
    name: "Comrade Anthony Ayodele, B.A. (Hons)",
    title: "President, Artisans Association of Ogun",
    photo: "/leadership/exco/anthony-ayodele.webp",
};

export const bot = {
    chairman: {
        name: "Hon. Kehinde Odeneye, MHR",
        title: "Chairman, Board of Trustees",
        photo: "/leadership/bot-chairman.webp",
    } as Person,
    /** Add the other Board of Trustees members here. */
    members: [] as Person[],
};

/** Add Advisory Council members here; the section appears automatically once there is at least one. */
export const advisoryCouncil: Person[] = [];

const p = (slug: string) => `/leadership/exco/${slug}.webp`;

/** State Executives Council 2025-2029, in the order of the official poster (President shown separately). */
export const exco: Person[] = [
    { name: "Dupe Oni-Aluko", title: "Financial Secretary", photo: p("dupe-oni-aluko") },
    { name: "Okunoye Asimiu Ajayi", title: "State Treasurer", photo: p("okunoye-asimiu-ajayi") },
    { name: "Mr. Musibaudeen Babatunde Ajibola", title: "Vice President", photo: p("musibaudeen-babatunde-ajibola") },
    { name: "Rahmon Abiodun Ogunbiyi", title: "State Secretary", photo: p("rahmon-abiodun-ogunbiyi") },
    { name: "Com. Rasheed Yusuf", title: "Yewa Division Coordinator", photo: p("rasheed-yusuf"), division: "Yewa" },
    { name: "Olayiwola Sunday David", title: "Ogun Central Coordinator (Egba Division)", photo: p("olayiwola-sunday-david"), division: "Egba" },
    { name: "Mrs. Bukola Hassan", title: "Protocol Officer", photo: p("bukola-hassan") },
    { name: "Com. Alaba Adeleye", title: "Ijebu Divisional Coordinator", photo: p("alaba-adeleye"), division: "Ijebu" },
    { name: "Mr. Rasaki Lawal", title: "Remo Divisional Coordinator", photo: p("rasaki-lawal"), division: "Remo" },
    { name: "Mr. Amisu Mukaila Olawale", title: "P.R.O 1", photo: p("amisu-mukaila-olawale") },
    { name: "Taiwo Olajide Amos", title: "Social Secretary", photo: p("taiwo-olajide-amos") },
    { name: "Com. Afeez Aremu Aderonmu", title: "State Training, Empowerment & Development Officer", photo: p("afeez-aremu-aderonmu") },
    { name: "Mr. Tijani Yusuf Babatunde", title: "Quality Assurance Officer", photo: p("tijani-yusuf-babatunde") },
    { name: "Com. Masominu Oretunde", title: "Asst. State Secretary", photo: p("masominu-oretunde") },
    { name: "Mr. Shuaib Awoyemi Fatai", title: "State Auditor", photo: p("shuaib-awoyemi-fatai") },
    { name: "Com. Makkanjuola Ishaq Olakanmi", title: "P.R.O 2", photo: p("makkanjuola-ishaq-olakanmi") },
    { name: "Mrs. Bakare Modinat Abolaji", title: "Training & Development Officer 2", photo: p("bakare-modinat-abolaji") },
    { name: "Mrs. Ogunnaike Adebimpe", title: "Quality Assurance Officer", photo: p("ogunnaike-adebimpe") },
    { name: "Mr. Afuape Biliaminu Atanda", title: "Chief Whip", photo: p("afuape-biliaminu-atanda") },
    { name: "Com. Ogunfodunrin Waidi", title: "Chief Security Officer (CSO)", photo: p("ogunfodunrin-waidi") },
    { name: "Dr. Akinbambo Olaitan", title: "S. A. Inter-Association Matter", photo: p("akinbambo-olaitan") },
    { name: "Mrs. Osinuga Idowu", title: "Women Affairs Officer", photo: p("osinuga-idowu") },
    { name: "Oseni Lateef", title: "Welfare Officer 1", photo: p("oseni-lateef") },
    { name: "Abbakir Odion", title: "Welfare Officer 2", photo: p("abbakir-odion") },
    { name: "Babatunde Alani Olusegun", title: "Social Director", photo: p("babatunde-alani-olusegun") },
    { name: "Chief Adelani Odebunmi Samuel", title: "Egba Division Coordinator", photo: p("adelani-odebunmi-samuel"), division: "Egba" },
    { name: "Comrade Ajayi Sunday", title: "Chief Whip 2", photo: p("ajayi-sunday") },
];

export const divisions = ["Egba", "Ijebu", "Remo", "Yewa"] as const;

export interface Lga {
    name: string;
    /** Add the chairman's name here when available; it appears on the card automatically. */
    chairman?: string;
}

/** The 20 Local Government Areas of Ogun State. */
export const lgas: Lga[] = [
    "Abeokuta North", "Abeokuta South", "Ado-Odo/Ota", "Egbado North (Yewa North)", "Egbado South (Yewa South)",
    "Ewekoro", "Ifo", "Ijebu East", "Ijebu North", "Ijebu North East",
    "Ijebu Ode", "Ikenne", "Imeko Afon", "Ipokia", "Obafemi Owode",
    "Odeda", "Odogbolu", "Ogun Waterside", "Remo North", "Sagamu",
].map((name) => ({ name }));