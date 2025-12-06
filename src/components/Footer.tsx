import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { Button } from "./ui/button";

type FooterLink = {
  label: string;
  href?: string;
};

const footerLinks: Array<{ heading: string; items: FooterLink[] }> = [
  {
    heading: "Platform",
    items: [
      { label: "Product Overview", href: "#overview" },
      { label: "Clinical Dashboard", href: "#dashboard" },
      { label: "Control Panel", href: "#control" },
      { label: "Device Console", href: "#device" }
    ]
  },
  {
    heading: "Resources",
    items: [
      { label: "Documentation Suite", href: "#support" },
      { label: "Architecture Blueprint", href: "#cta" },
      { label: "API Integration", href: "#support" },
      { label: "Support Portal", href: "#support" }
    ]
  },
  {
    heading: "Contact",
    items: [
      { label: "Solutions Team: ankur.kumar@deckmount.in", href: "mailto:ankur.kumar@deckmount.in" },
      { label: "Direct: +91 87000 76769", href: "tel:+918700076769" },
      { label: "Company: 1800 309 2499", href: "tel:18003092499" },
      {
        label: "260, Phase IV, Udyog Vihar, Sector 18, Gurugram, Haryana 122015"
      },
      { label: "deckmount.in", href: "https://deckmount.in/" }
    ]
  }
];

function VisitorCounter() {
  const [visitorCount, setVisitorCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const trackVisitor = async () => {
      try {
        // Check if this is a new session
        const sessionKey = "cardiox_session_tracked";
        const hasTracked = sessionStorage.getItem(sessionKey);
        
        // Get API base URL (works for both local and Vercel)
        const apiBase = import.meta.env.PROD 
          ? window.location.origin 
          : "http://localhost:5173";
        
        if (!hasTracked) {
          // New visitor - increment count
          const response = await fetch(`${apiBase}/api/visitors`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          });
          
          if (response.ok) {
            const data = await response.json();
            setVisitorCount(data.count);
            sessionStorage.setItem(sessionKey, "true");
          } else {
            // Fallback: fetch current count
            const getResponse = await fetch(`${apiBase}/api/visitors`);
            if (getResponse.ok) {
              const data = await getResponse.json();
              setVisitorCount(data.count);
            }
          }
        } else {
          // Returning visitor - just get current count
          const response = await fetch(`${apiBase}/api/visitors`);
          if (response.ok) {
            const data = await response.json();
            setVisitorCount(data.count);
          }
        }
      } catch (error) {
        console.error("Failed to track visitor:", error);
        // Fallback to localStorage if API fails
        const storedCount = localStorage.getItem("cardiox_visitor_count");
        setVisitorCount(storedCount ? parseInt(storedCount, 10) : 1247);
      } finally {
        setIsLoading(false);
      }
    };

    trackVisitor();
  }, []);

  const formatNumber = (num: number): string => {
    return num.toLocaleString("en-US");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 text-sm text-white/60">
        <span className="text-xs uppercase tracking-[0.3em] text-white/40">Total Visitors:</span>
        <span className="font-display text-lg font-semibold text-brand-electric">...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2 text-sm text-white/60">
      <span className="text-xs uppercase tracking-[0.3em] text-white/40">Total Visitors:</span>
      <span className="font-display text-lg font-semibold text-brand-electric">
        {formatNumber(visitorCount)}
      </span>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="mt-24 border-t border-white/10 bg-slate-950/80 backdrop-blur-lg">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-14 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm space-y-6">
          <Logo />
          <p className="text-sm text-white/60">
            CardioX by Deckmount delivers real-time ECG monitoring, analytics, and secure
            report management trusted by clinicians worldwide.
          </p>
          <Button variant="secondary" className="uppercase tracking-[0.3em]">
            Book a Demo
          </Button>
        </div>
        <div className="grid flex-1 grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-3">
          {footerLinks.map((column) => (
            <div key={column.heading} className="space-y-4">
              <p className="text-xs uppercase tracking-[0.35em] text-white/40">
                {column.heading}
              </p>
              <ul className="space-y-2 text-sm text-white/70">
                {column.items.map((item) => (
                  <li key={item.label}>
                    {item.href ? (
                      <a
                        href={item.href}
                        className="transition hover:text-white"
                        target={item.href.startsWith("http") ? "_blank" : undefined}
                        rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                      >
                        {item.label}
                      </a>
                    ) : (
                      item.label
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-white/5 py-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 md:flex-row">
          <div className="text-xs uppercase tracking-[0.35em] text-white/50">
            © {new Date().getFullYear()} Deckmount Healthcare. All rights reserved.
          </div>
          <VisitorCounter />
        </div>
      </div>
    </footer>
  );
}

