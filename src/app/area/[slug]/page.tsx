import { Metadata } from 'next';
import Link from 'next/link';
import { 
  Sun, 
  Check, 
  MapPin, 
  ShieldCheck, 
  Star, 
  Droplet, 
  Wrench, 
  Activity, 
  Calendar,
  ChevronRight,
  ArrowRight,
  Shield,
  Award,
  Zap
} from 'lucide-react';

interface AreaDetails {
  title: string;
  description: string;
  h1: string;
  intro: string;
  keywords: string[];
  areaName: string;
  faqs: { q: string; a: string }[];
}

const areaData: Record<string, AreaDetails> = {
  pune: {
    areaName: "Pune",
    title: "Solar Panel Cleaning & Maintenance Services in Pune | Green Orbit Energy",
    description: "Restore up to 35% solar efficiency with Green Orbit Energy's professional soft-water solar panel cleaning and diagnostics in Pune. Senior-citizen friendly roof service.",
    h1: "Solar Panel Cleaning & Maintenance Services in Pune",
    intro: "Green Orbit Energy is Pune's leading professional solar panel cleaning and solar maintenance service provider. We offer high-quality rooftop solar cleaning, diagnostics, and repairs with background-verified teams across Pune City.",
    keywords: ["Solar Panel Cleaning Pune", "Solar Cleaning Services Pune", "Solar Maintenance Pune", "Solar Panel Inspection Pune", "Solar Reinstallation Pune"],
    faqs: [
      { q: "How often should I clean solar panels in Pune?", a: "Due to high dust levels in Pune, we recommend professional solar cleaning every 3 to 4 weeks to maintain peak electricity output." },
      { q: "Do you use hard water for cleaning solar panels?", a: "No, we use purified soft RO water. Hard water causes salt scaling which permanently damages the glass coating and reduces efficiency." },
      { q: "Is roof climbing safe for senior citizens?", a: "Yes, our technicians handle all climbing and equipment setups. Customers do not need to access the terrace or handle unsafe safety setups." }
    ]
  },
  pcmc: {
    areaName: "PCMC",
    title: "Solar Panel Service & Maintenance in PCMC | Green Orbit Energy",
    description: "Get certified solar panel inspection and cleaning in PCMC (Pimpri-Chinchwad). Maximize your solar output with Green Orbit Energy's professional maintenance services.",
    h1: "Expert Solar Panel Service & Maintenance in PCMC",
    intro: "Looking for reliable solar panel services in PCMC? Green Orbit Energy provides certified solar panel inspections, maintenance plans, and deep cleaning for residential societies and commercial systems.",
    keywords: ["Solar Panel Service PCMC", "Solar Cleaning PCMC", "Solar Maintenance Pune", "Solar Panel Cleaning PCMC"],
    faqs: [
      { q: "Which areas in PCMC do you cover?", a: "We cover all major locations in PCMC including Akurdi, Chinchwad, Pimpri, Wakad, Hinjawadi, Ravet, and Moshi." },
      { q: "What is covered in a solar inspection in PCMC?", a: "Our inspection includes voltage testing, wire degradation audits, structure stability checks, and hot-spot thermography scans." }
    ]
  },
  bavdhan: {
    areaName: "Bavdhan",
    title: "Professional Solar Cleaning Services in Bavdhan | Green Orbit Energy",
    description: "Green Orbit Energy provides local solar cleaning and maintenance services in Bavdhan, Pune. Get a comprehensive site inspection and soft-water panel wash.",
    h1: "Professional Solar Cleaning Services in Bavdhan",
    intro: "Maximize your solar system generation in Bavdhan with Green Orbit Energy's soft-water solar panel cleaning and inspection services. We guarantee up to 35% restored solar power.",
    keywords: ["Solar Cleaning Bavdhan", "Solar Panel Cleaning Pune", "Solar Maintenance Pune", "Solar Cleaning Services Pune"],
    faqs: [
      { q: "How long does a cleaning session take in Bavdhan?", a: "A typical 3kW residential system cleaning session takes approximately 45 to 60 minutes." },
      { q: "Do I need to provide water or cleaning gear?", a: "We bring our own specialized soft-water filters and scratch-free solar brushes. We only require connection access to a standard domestic tap." }
    ]
  },
  india: {
    areaName: "India",
    title: "Solar Maintenance & Lifecycle Support in India | Green Orbit Energy",
    description: "Enterprise-grade solar maintenance, panel cleaning, and dismantling services across India. Trusted solar lifecycle platform.",
    h1: "Solar Maintenance & Lifecycle Support in India",
    intro: "Green Orbit Energy provides comprehensive solar maintenance and operations support across India. From rooftop residential installations to large-scale utility plants, we ensure safety, double-entry ledger security, and peak performance.",
    keywords: ["Solar Maintenance India", "Solar Panel Cleaning India", "Solar Lifecycle Support", "Solar Installation India"],
    faqs: [
      { q: "What services does Green Orbit Energy provide across India?", a: "We provide commercial solar cleaning, annual maintenance contracts (AMC), decommissioning, reinstallation, and technical advisory services." },
      { q: "How does Green Orbit Energy guarantee transaction safety?", a: "We operate a dedicated double-entry escrow ledger vault system where payments are held secure and released only upon verified technician completion of the service checklist." }
    ]
  }
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams.slug.toLowerCase();
  const data = areaData[slug] || areaData['pune'];
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://greenorbitenergy.com";
  
  return {
    title: data.title,
    description: data.description,
    keywords: data.keywords.join(', '),
    alternates: {
      canonical: `${baseUrl}/area/${slug}`,
    },
    openGraph: {
      title: data.title,
      description: data.description,
      url: `${baseUrl}/area/${slug}`,
      siteName: "Green Orbit Energy",
      images: [
        {
          url: `${baseUrl}/icon.png`,
          width: 512,
          height: 512,
          alt: `Solar services in ${data.areaName}`,
        },
      ],
      locale: "en_IN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: data.title,
      description: data.description,
      images: [`${baseUrl}/icon.png`],
    },
  };
}

export default async function AreaPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug.toLowerCase();
  const data = areaData[slug] || areaData['pune'];
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://greenorbitenergy.com";

  // Build JSON-LD Structured Data
  const jsonLdLocalBusiness = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": `Green Orbit Energy Solar Services ${data.areaName}`,
    "image": `${baseUrl}/icon.png`,
    "@id": `${baseUrl}/area/${slug}#localbusiness`,
    "url": `${baseUrl}/area/${slug}`,
    "telephone": "+919765539107",
    "priceRange": "₹₹",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Bavdhan Main Road",
      "addressLocality": data.areaName === "India" ? "Pune" : data.areaName,
      "addressRegion": "Maharashtra",
      "postalCode": "411021",
      "addressCountry": "IN"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 18.5204,
      "longitude": 73.8567
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
      ],
      "opens": "08:00",
      "closes": "20:00"
    }
  };

  const jsonLdFaq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": data.faqs.map(faq => ({
      "@type": "Question",
      "name": faq.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.a
      }
    }))
  };

  const jsonLdBreadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": baseUrl
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Areas",
        "item": `${baseUrl}/area/pune`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": data.areaName,
        "item": `${baseUrl}/area/${slug}`
      }
    ]
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-900 antialiased">
      
      {/* Schema Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdLocalBusiness) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }}
      />

      {/* Dynamic Header */}
      <header className="border-b border-slate-900 bg-slate-950/70 backdrop-blur-md sticky top-0 z-50 px-4 sm:px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight text-sky-450">
            Green Orbit <span className="text-white">Energy</span>
          </Link>
          <div className="flex items-center gap-6">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-sky-450" /> {data.areaName} Service Area
            </span>
            <Link 
              href="/?login=true" 
              className="bg-sky-500 hover:bg-sky-600 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs transition duration-150 uppercase"
            >
              Book Service
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 border-b border-slate-900 overflow-hidden bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-sky-500/10 via-transparent to-transparent opacity-50" />
        <div className="max-w-4xl mx-auto text-center px-4 space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/25 text-sky-400 text-xs font-semibold">
            <Sun className="w-4 h-4 animate-spin-slow" /> Professional Solar Services in {data.areaName}
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            {data.h1}
          </h1>
          <p className="text-slate-350 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            {data.intro} Restoring generation capacity by up to 35% with specialized cleaning and diagnostics.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              href="/?login=true"
              className="bg-sky-500 hover:bg-sky-600 text-slate-950 font-bold px-6 py-3.5 rounded-xl transition duration-150 text-sm uppercase flex items-center gap-2"
            >
              Book Inspection Now (₹99) <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#faqs"
              className="bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 font-bold px-6 py-3.5 rounded-xl transition duration-150 text-sm uppercase"
            >
              Read Local FAQs
            </a>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 max-w-6xl mx-auto px-4 space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Rooftop Solar Solutions</h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto">
            Our background-verified engineers handle climbing and cleaning safety. Safe for residential communities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Cleaning */}
          <div className="bg-slate-900/50 border border-slate-850 p-6 rounded-2xl space-y-4 hover:border-sky-500/30 transition">
            <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl w-fit">
              <Droplet className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-200">Solar Panel Cleaning</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              We use specialized scratch-free brushes and purified water systems to clean dust, bird residue, and carbon ash.
            </p>
            <div className="text-xs text-sky-400 font-bold">Starts at ₹99 dispatch fee</div>
          </div>

          {/* Dismantling */}
          <div className="bg-slate-900/50 border border-slate-850 p-6 rounded-2xl space-y-4 hover:border-sky-500/30 transition">
            <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl w-fit">
              <Wrench className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-200">Dismantling &amp; Reinstallation</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Planning roof construction or waterproofing? We safely dismantle your solar frames, store panels, and re-mount them securely.
            </p>
            <div className="text-xs text-sky-400 font-bold">Starts at ₹1,499 service fee</div>
          </div>

          {/* Inspection */}
          <div className="bg-slate-900/50 border border-slate-850 p-6 rounded-2xl space-y-4 hover:border-sky-500/30 transition">
            <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl w-fit">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-200">Diagnostics &amp; Health check</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Complete voltage checking, cable audit, and generation mapping with clear digital report indicators.
            </p>
            <div className="text-xs text-sky-400 font-bold">Starts at ₹199 inspection fee</div>
          </div>
        </div>
      </section>

      {/* Trust factors */}
      <section className="py-16 bg-slate-900 border-y border-slate-900 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-sky-400 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-slate-200">Background Checked</h4>
              <p className="text-[10px] text-slate-400">Strict verification check on all techs</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Zap className="w-8 h-8 text-sky-400 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-slate-200">Up to 35% Restored</h4>
              <p className="text-[10px] text-slate-400">Restores peak electricity generation</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Award className="w-8 h-8 text-sky-400 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-slate-200">RO Water Cleaning</h4>
              <p className="text-[10px] text-slate-400">No chemical acids or mineral scale marks</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Check className="w-8 h-8 text-sky-400 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-slate-200">GST Compliance</h4>
              <p className="text-[10px] text-slate-400">Proper invoicing with GST claims</p>
            </div>
          </div>
        </div>
      </section>

      {/* Local FAQs Section */}
      <section id="faqs" className="py-20 max-w-4xl mx-auto px-4 space-y-10">
        <div className="text-center space-y-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Frequently Asked Questions</h2>
          <p className="text-slate-450 text-xs sm:text-sm">Quick answers to common questions in {data.areaName}.</p>
        </div>

        <div className="space-y-4">
          {data.faqs.map((faq, idx) => (
            <div key={idx} className="bg-slate-900 border border-slate-850 p-6 rounded-2xl space-y-2">
              <h3 className="font-bold text-sm text-slate-200">{faq.q}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SEO Footer Links */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950 py-12 px-4 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h4 className="font-bold text-slate-400">Service Coverage Areas</h4>
              <ul className="space-y-1">
                <li><Link href="/area/pune" className="hover:text-slate-300">Solar Cleaning Pune</Link></li>
                <li><Link href="/area/pcmc" className="hover:text-slate-300">Solar Services PCMC</Link></li>
                <li><Link href="/area/bavdhan" className="hover:text-slate-300">Solar Cleaning Bavdhan</Link></li>
                <li><Link href="/area/india" className="hover:text-slate-300">Solar Maintenance India</Link></li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-bold text-slate-400">Local SEO Keywords</h4>
              <ul className="space-y-1">
                {data.keywords.map((kw, i) => (
                  <li key={i}>{kw}</li>
                ))}
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-bold text-slate-400">Green Orbit Energy Platform</h4>
              <p className="leading-relaxed">
                India's enterprise-grade operations platform for solar lifecycle management. Powered by transaction-safe escrow clearing.
              </p>
            </div>
          </div>
          <div className="text-center pt-8 border-t border-slate-900 text-[10px] text-slate-650">
            &copy; {new Date().getFullYear()} Green Orbit Energy. All rights reserved.
          </div>
        </div>
      </footer>

    </div>
  );
}
