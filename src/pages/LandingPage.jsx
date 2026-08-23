import React, { useEffect, useRef, useState } from 'react';
import logo from '../images/android-chrome-512x512.png'
/**
 * Landing page for the social media management / content-scheduling
 * platform. Built to satisfy the TikTok Content Posting API review
 * requirements called out in the brief:
 *  - Privacy Policy / Terms of Service are real, working links in the
 *    footer (not gated behind login).
 *  - The "What Is Your Platform" and "TikTok Integration" sections
 *    explain, in plain language, why TikTok access is requested.
 *  - No claims about features/approvals the product doesn't actually
 *    have — copy stays close to the provided spec on purpose.
 *
 * Replace the placeholders below (APP_NAME, SUPPORT_EMAIL, hrefs) with
 * real values before shipping. The dashboard preview and hero mockup
 * are built as CSS/SVG mockups — swap in real product screenshots
 * where noted, TikTok's reviewers respond better to real UI.
 */

const APP_NAME = 'Social Automation';
const SUPPORT_EMAIL = 'supportsocialautomation@gmail.com';

/* ------------------------------------------------------------------ */
/* Icons — plain geometric SVGs, not brand logos, so nothing here      */
/* reproduces a trademarked mark. Swap for official badges only if     */
/* the relevant platform's brand guidelines allow it.                  */
/* ------------------------------------------------------------------ */

const iconProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

const IconMenu = (p) => (
  <svg {...iconProps} {...p}><path d="M4 7h16M4 12h16M4 17h16" /></svg>
);
const IconClose = (p) => (
  <svg {...iconProps} {...p}><path d="M6 6l12 12M18 6L6 18" /></svg>
);
const IconArrowRight = (p) => (
  <svg {...iconProps} {...p}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
const IconCheck = (p) => (
  <svg {...iconProps} {...p}><path d="M5 12.5l4.5 4.5L19 7" /></svg>
);
const IconClock = (p) => (
  <svg {...iconProps} {...p}><circle cx="12" cy="12" r="8.25" /><path d="M12 7.5V12l3 2" /></svg>
);
const IconLayers = (p) => (
  <svg {...iconProps} {...p}><path d="M12 3.5l8.5 4.5L12 12.5 3.5 8z" /><path d="M3.5 13l8.5 4.5L20.5 13" /><path d="M3.5 17.5L12 22l8.5-4.5" /></svg>
);
const IconNote = (p) => (
  <svg {...iconProps} {...p}><circle cx="8" cy="17.5" r="2.75" /><path d="M10.75 17.5V5.5l7.75-1.75V13" /><circle cx="16.5" cy="15.25" r="2.75" /></svg>
);
const IconImage = (p) => (
  <svg {...iconProps} {...p}><rect x="3.5" y="4.5" width="17" height="15" rx="2" /><circle cx="9" cy="10" r="1.75" /><path d="M20.5 16l-5.5-5-9 8" /></svg>
);
const IconTag = (p) => (
  <svg {...iconProps} {...p}><path d="M11 3.5h6a2 2 0 0 1 2 2v6L10.5 20 3.5 13 11 3.5z" /><circle cx="14.5" cy="8.5" r="1.25" /></svg>
);
const IconActivity = (p) => (
  <svg {...iconProps} {...p}><path d="M3 12h4l2.5 7L14 5l2 7h5" /></svg>
);
const IconPlug = (p) => (
  <svg {...iconProps} {...p}><path d="M8.5 3.5v5M15.5 3.5v5M6 8.5h12l-1 5a5 5 0 0 1-10 0l-1-5z" /><path d="M12 17v3.5" /></svg>
);
const IconUpload = (p) => (
  <svg {...iconProps} {...p}><path d="M12 15.5V4M8 8l4-4 4 4" /><path d="M4.5 15.5v3a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-3" /></svg>
);
const IconSend = (p) => (
  <svg {...iconProps} {...p}><path d="M21 3L3 10.5l7 3.5 3.5 7L21 3z" /><path d="M13.5 14L21 3" /></svg>
);
const IconLock = (p) => (
  <svg {...iconProps} {...p}><rect x="5" y="10.5" width="14" height="9.5" rx="2" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></svg>
);
const IconShield = (p) => (
  <svg {...iconProps} {...p}><path d="M12 3.5l7 2.5v6c0 4.5-3 7.5-7 8.5-4-1-7-4-7-8.5V6z" /><path d="M9 12l2.2 2.2L15.5 9.5" /></svg>
);
const IconEye = (p) => (
  <svg {...iconProps} {...p}><path d="M3 12s3.5-6.5 9-6.5S21 12 21 12s-3.5 6.5-9 6.5S3 12 3 12z" /><circle cx="12" cy="12" r="2.5" /></svg>
);
const IconBuilding = (p) => (
  <svg {...iconProps} {...p}><rect x="5" y="4" width="9" height="16" rx="1" /><rect x="14.5" y="9" width="5" height="11" rx="1" /><path d="M8 8h1M8 12h1M8 16h1" /></svg>
);
const IconUsers = (p) => (
  <svg {...iconProps} {...p}><circle cx="9" cy="9" r="3" /><path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" /><path d="M15.5 6.5a3 3 0 0 1 0 6" /><path d="M15 14c2.4.3 4.5 2.1 5.5 5" /></svg>
);
const IconUserCheck = (p) => (
  <svg {...iconProps} {...p}><circle cx="9.5" cy="8.5" r="3.25" /><path d="M3.5 19.5c0-3.3 2.7-5.75 6-5.75s6 2.45 6 5.75" /><path d="M16.5 11.5l1.75 1.75L21.5 9.5" /></svg>
);

const IconInstagram = (p) => (
  <svg {...iconProps} {...p}><rect x="4" y="4" width="16" height="16" rx="5" /><circle cx="12" cy="12" r="3.75" /><circle cx="16.75" cy="7.25" r="0.9" fill="currentColor" stroke="none" /></svg>
);
const IconFacebook = (p) => (
  <svg {...iconProps} {...p}><path d="M14 21v-7h2.5l.5-3H14V9c0-1 .3-1.7 1.7-1.7H17V4.6C16.6 4.5 15.6 4.4 14.5 4.4 12.1 4.4 10.5 5.9 10.5 8.6V11H8v3h2.5v7" /></svg>
);
const IconYoutube = (p) => (
  <svg {...iconProps} {...p}><rect x="3.5" y="6" width="17" height="12" rx="4" /><path d="M10.5 9.5l5 2.5-5 2.5z" fill="currentColor" stroke="none" /></svg>
);
const IconLinkedin = (p) => (
  <svg {...iconProps} {...p}><rect x="4" y="4" width="16" height="16" rx="3" /><circle cx="8.3" cy="8.3" r="1" fill="currentColor" stroke="none" /><path d="M8.3 11v6M12 11v6M12 13.5c0-1.6 1.2-2.5 2.5-2.5S17 11.9 17 13.5V17" /></svg>
);
const IconTikTok = (p) => <IconNote {...p} />;

/* ------------------------------------------------------------------ */
/* Reveal — small scroll-in helper. Falls back to fully visible/no      */
/* motion automatically when the user prefers reduced motion (handled  */
/* in the injected stylesheet below), so this never blocks content.    */
/* ------------------------------------------------------------------ */

function Reveal({ as: Tag = 'div', className = '', children, ...rest }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`reveal ${visible ? 'reveal-visible' : ''} ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/* ------------------------------------------------------------------ */
/* Data                                                                 */
/* ------------------------------------------------------------------ */

const NAV_LINKS = [
  { label: 'Home', href: '#top' },
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Supported Platforms', href: '#platforms' },
  { label: 'Contact', href: '#contact' },
];

const FEATURES = [
  {
    icon: IconClock,
    title: 'Content Scheduling',
    desc: 'Schedule your social media content for specific dates and times and let the platform handle publishing automatically.',
  },
  {
    icon: IconLayers,
    title: 'Multi-Platform Publishing',
    desc: 'Manage content for multiple supported social media platforms from a centralized dashboard.',
  },
  {
    icon: IconNote,
    title: 'TikTok Publishing',
    desc: "Connect your TikTok account and publish supported photos and videos using TikTok's official Content Posting API.",
    featured: true,
  },
  {
    icon: IconImage,
    title: 'Media Management',
    desc: 'Upload and organize your photos and videos in one centralized media library.',
  },
  {
    icon: IconTag,
    title: 'Caption Management',
    desc: 'Prepare captions and content before publishing and keep your posts organized.',
  },
  {
    icon: IconActivity,
    title: 'Publishing Status',
    desc: 'Track scheduled and published content and monitor the status of your publishing activity.',
  },
];

const STEPS = [
  {
    n: '01',
    icon: IconPlug,
    title: 'Connect',
    desc: 'Connect your supported social media accounts through their official authorization process.',
  },
  {
    n: '02',
    icon: IconUpload,
    title: 'Create',
    desc: 'Upload your photos or videos and prepare your post content.',
  },
  {
    n: '03',
    icon: IconClock,
    title: 'Schedule',
    desc: 'Choose the platforms, date, and time for your content.',
  },
  {
    n: '04',
    icon: IconSend,
    title: 'Publish',
    desc: 'Our platform automatically processes the scheduled content and publishes it to the connected accounts.',
  },
];

const TIKTOK_POINTS = [
  {
    icon: IconLock,
    title: 'Secure Account Authorization',
    desc: "Users authorize their TikTok account through TikTok's official authorization process.",
  },
  {
    icon: IconImage,
    title: 'Photo & Video Publishing',
    desc: 'Supported photos and videos can be prepared and published through the TikTok Content Posting API.',
  },
  {
    icon: IconSend,
    title: 'Automated Publishing',
    desc: "Scheduled content can be processed by the platform according to the user's selected publishing schedule.",
  },
];

const PLATFORMS = [
  { icon: IconTikTok, label: 'TikTok' },
  { icon: IconInstagram, label: 'Instagram' },
  { icon: IconFacebook, label: 'Facebook' },
  { icon: IconLinkedin, label: 'LinkedIn' },
  { icon: IconYoutube, label: 'YouTube' },
];

const SECURITY_CARDS = [
  {
    icon: IconLock,
    title: 'Secure Authentication',
    desc: 'Social accounts are connected through official authorization flows.',
  },
  {
    icon: IconShield,
    title: 'Protected Credentials',
    desc: 'Sensitive authentication credentials are handled securely by our backend and are not exposed to frontend users.',
  },
  {
    icon: IconEye,
    title: 'Privacy Focused',
    desc: "We only use connected account information and permissions required to provide the platform's functionality.",
  },
];

const AUDIENCES = [
  {
    icon: IconBuilding,
    title: 'Businesses',
    desc: "Manage your company's social media publishing from one centralized platform.",
  },
  {
    icon: IconUsers,
    title: 'Marketing Teams',
    desc: 'Plan and coordinate content across multiple supported social networks.',
  },
  {
    icon: IconUserCheck,
    title: 'Social Media Managers',
    desc: 'Reduce repetitive publishing tasks with scheduling and centralized content management.',
  },
];

const DASHBOARD_NAV = ['Dashboard', 'Companies', 'Social Media', 'Media', 'Posts', 'Scheduler'];

const QUEUE_ITEMS = [
  { icon: IconTikTok, platform: 'TikTok', time: '09:00 AM' },
  { icon: IconInstagram, platform: 'Instagram', time: '10:00 AM' },
  { icon: IconFacebook, platform: 'Facebook', time: '11:00 AM' },
];

/* ------------------------------------------------------------------ */
/* Page                                                                  */
/* ------------------------------------------------------------------ */

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div id="top" className="min-h-screen bg-[#F6F6F3] text-[#14171C] font-[Inter]">
      <GlobalStyles />

      {/* ============================================================ */}
      {/* 1. NAVBAR                                                     */}
      {/* ============================================================ */}
      <header className="sticky top-0 z-50 border-b border-[#E4E1D8] bg-[#F6F6F3]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <a href="#top" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F6F6F3]/90 ">
              <img src={logo} alt="Logo" className="h-full w-full object-contain" />
            </span>
            <span className="font-['Space_Grotesk'] text-lg font-semibold tracking-tight">
              {APP_NAME}
            </span>
          </a>

          <nav className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-[#4B5160] transition-colors hover:text-[#14171C]"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center md:flex">
            <a
              href="/login"
              className="rounded-lg bg-[#26304D] px-4 py-2 text-sm font-semibold text-[#F6F6F3] transition-colors hover:bg-[#1B2238]"
            >
              Login
            </a>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#14171C] md:hidden"
          >
            {menuOpen ? <IconClose className="h-5 w-5" /> : <IconMenu className="h-5 w-5" />}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-[#E4E1D8] bg-[#F6F6F3] px-5 py-4 md:hidden">
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={closeMenu}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-[#4B5160] hover:bg-[#EDEBE3] hover:text-[#14171C]"
                >
                  {link.label}
                </a>
              ))}
              <a
                href="/login"
                onClick={closeMenu}
                className="mt-2 rounded-lg bg-[#26304D] px-3 py-2.5 text-center text-sm font-semibold text-[#F6F6F3]"
              >
                Login
              </a>
            </nav>
          </div>
        )}
      </header>

      <main>
        {/* ============================================================ */}
        {/* 2. HERO                                                       */}
        {/* ============================================================ */}
        <section className="mx-auto max-w-6xl px-5 pb-20 pt-16 sm:px-8 sm:pt-24">
          <div className="grid items-center gap-14 lg:grid-cols-[1.05fr,0.95fr]">
            <Reveal>
              <p className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-[0.18em] text-[#8A8672]">
                Content scheduling, automated
              </p>

              <h1 className="mt-4 font-['Space_Grotesk'] text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.25rem]">
                Manage and automate your social media content
              </h1>

              <p className="mt-5 max-w-xl text-base leading-relaxed text-[#4B5160] sm:text-lg">
                Plan, schedule, and publish your social media content from one
                centralized platform. Connect your social accounts, upload
                your media, and automate publishing across supported
                platforms.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a
                  href="/signup"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#26304D] px-5 py-3 text-sm font-semibold text-[#F6F6F3] transition-colors hover:bg-[#1B2238]"
                >
                  Get Started
                  <IconArrowRight className="h-4 w-4" />
                </a>

                <a
                  href="#features"
                  className="inline-flex items-center gap-2 rounded-lg border border-[#D7D3C7] bg-transparent px-5 py-3 text-sm font-semibold text-[#14171C] transition-colors hover:bg-[#EDEBE3]"
                >
                  Learn More
                </a>
              </div>

              <p className="mt-5 font-['IBM_Plex_Mono'] text-xs text-[#8A8672]">
                Schedule once. Publish automatically.
              </p>
            </Reveal>

            <Reveal className="lg:justify-self-end" style={{ transitionDelay: '80ms' }}>
              <HeroMockup />
            </Reveal>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 3. WHAT IS YOUR PLATFORM                                      */}
        {/* ============================================================ */}
        <section className="border-y border-[#E4E1D8] bg-white">
          <div className="mx-auto max-w-4xl px-5 py-20 sm:px-8">
            <Reveal>
              <p className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-[0.18em] text-[#8A8672]">
                What we do
              </p>
              <h2 className="mt-3 font-['Space_Grotesk'] text-3xl font-semibold tracking-tight sm:text-4xl">
                One platform for social media management
              </h2>
              <p className="mt-5 text-base leading-relaxed text-[#4B5160] sm:text-lg">
                Our platform helps businesses and organizations manage their
                social media publishing from a centralized dashboard. Users
                can connect supported social media accounts, upload photos
                and videos, create captions, schedule content, and monitor
                publishing activity from one place.
              </p>
            </Reveal>

            <Reveal
              className="mt-8 rounded-xl border border-[#26304D]/15 bg-[#26304D]/[0.04] p-6"
              style={{ transitionDelay: '80ms' }}
            >
              <div className="flex items-start gap-3.5">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#26304D] text-[#F6F6F3]">
                  <IconTikTok className="h-4 w-4" />
                </span>
                <p className="text-sm leading-relaxed text-[#2A2E38] sm:text-base">
                  The platform integrates with{' '}
                  <span className="font-semibold">TikTok</span> to allow
                  authorized users to publish supported content directly to
                  their TikTok accounts through TikTok's official APIs.
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 4. FEATURES                                                   */}
        {/* ============================================================ */}
        <section id="features" className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <Reveal className="max-w-2xl">
            <p className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-[0.18em] text-[#8A8672]">
              Features
            </p>
            <h2 className="mt-3 font-['Space_Grotesk'] text-3xl font-semibold tracking-tight sm:text-4xl">
              Everything you need to manage your content
            </h2>
          </Reveal>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <Reveal
                key={f.title}
                className={`rounded-xl border p-6 ${
                  f.featured
                    ? 'border-[#26304D]/25 bg-[#26304D]/[0.035]'
                    : 'border-[#E4E1D8] bg-white'
                }`}
                style={{ transitionDelay: `${i * 45}ms` }}
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#26304D] text-[#F6F6F3]">
                    <f.icon className="h-5 w-5" />
                  </span>

                  {f.featured && (
                    <span className="rounded-full bg-[#26304D] px-2.5 py-1 font-['IBM_Plex_Mono'] text-[10px] font-medium uppercase tracking-wide text-[#F6F6F3]">
                      Official API
                    </span>
                  )}
                </div>

                <h3 className="mt-4 font-['Space_Grotesk'] text-lg font-semibold">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#4B5160]">
                  {f.desc}
                </p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ============================================================ */}
        {/* 5. HOW IT WORKS                                               */}
        {/* ============================================================ */}
        <section id="how-it-works" className="border-y border-[#E4E1D8] bg-white">
          <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
            <Reveal className="max-w-2xl">
              <p className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-[0.18em] text-[#8A8672]">
                Process
              </p>
              <h2 className="mt-3 font-['Space_Grotesk'] text-3xl font-semibold tracking-tight sm:text-4xl">
                How it works
              </h2>
            </Reveal>

            <div className="relative mt-14">
              <div className="absolute left-0 right-0 top-5 hidden h-px bg-[#E4E1D8] lg:block" />

              <div className="grid gap-8 lg:grid-cols-4 lg:gap-6">
                {STEPS.map((step, i) => (
                  <Reveal
                    key={step.n}
                    className="relative"
                    style={{ transitionDelay: `${i * 70}ms` }}
                  >
                    <div className="flex items-center gap-3 lg:block">
                      <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#26304D] bg-[#F6F6F3] font-['IBM_Plex_Mono'] text-xs font-semibold text-[#26304D] lg:mb-5">
                        {step.n}
                      </span>
                      <h3 className="font-['Space_Grotesk'] text-lg font-semibold lg:hidden">
                        {step.title}
                      </h3>
                    </div>

                    <h3 className="mt-4 hidden font-['Space_Grotesk'] text-lg font-semibold lg:block">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#4B5160]">
                      {step.desc}
                    </p>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 6. TIKTOK INTEGRATION                                         */}
        {/* ============================================================ */}
        <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <Reveal>
              <p className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-[0.18em] text-[#8A8672]">
                TikTok integration
              </p>
              <h2 className="mt-3 font-['Space_Grotesk'] text-3xl font-semibold tracking-tight sm:text-4xl">
                Publish content to TikTok
              </h2>
              <p className="mt-5 text-base leading-relaxed text-[#4B5160] sm:text-lg">
                Our platform integrates with TikTok's official Content
                Posting API to provide authorized users with a streamlined
                way to publish content from their social media management
                dashboard.
              </p>

              <ul className="mt-8 space-y-5">
                {TIKTOK_POINTS.map((point) => (
                  <li key={point.title} className="flex gap-3.5">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#26304D] text-[#F6F6F3]">
                      <point.icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="font-semibold text-[#14171C]">{point.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-[#4B5160]">
                        {point.desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              <a
                href="/platform"
                className="mt-8 inline-flex items-center gap-2 rounded-lg border border-[#D7D3C7] px-5 py-3 text-sm font-semibold text-[#14171C] transition-colors hover:bg-[#EDEBE3]"
              >
                Learn More About Our Platform
                <IconArrowRight className="h-4 w-4" />
              </a>
            </Reveal>

            <Reveal style={{ transitionDelay: '80ms' }}>
              <TikTokFlowMockup />
            </Reveal>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 7. SUPPORTED PLATFORMS                                        */}
        {/* ============================================================ */}
        <section id="platforms" className="border-y border-[#E4E1D8] bg-white">
          <div className="mx-auto max-w-5xl px-5 py-20 text-center sm:px-8">
            <Reveal>
              <p className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-[0.18em] text-[#8A8672]">
                Coverage
              </p>
              <h2 className="mt-3 font-['Space_Grotesk'] text-3xl font-semibold tracking-tight sm:text-4xl">
                Manage multiple social platforms
              </h2>
            </Reveal>

            <Reveal
              className="mt-10 flex flex-wrap items-center justify-center gap-3"
              style={{ transitionDelay: '80ms' }}
            >
              {PLATFORMS.map((p) => (
                <span
                  key={p.label}
                  className="inline-flex items-center gap-2.5 rounded-full border border-[#E4E1D8] bg-[#F6F6F3] px-5 py-3"
                >
                  <span className="flex h-6 w-6 items-center justify-center text-[#26304D]">
                    <p.icon className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-medium">{p.label}</span>
                </span>
              ))}
            </Reveal>

            <Reveal style={{ transitionDelay: '140ms' }}>
              <p className="mx-auto mt-8 max-w-xl text-sm leading-relaxed text-[#4B5160] sm:text-base">
                Connect your authorized accounts and manage your publishing
                workflow from one centralized dashboard.
              </p>
            </Reveal>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 8. SECURITY & PRIVACY                                         */}
        {/* ============================================================ */}
        <section className="bg-[#1B2238]">
          <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
            <Reveal className="max-w-2xl">
              <p className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-[0.18em] text-[#8FA0D9]">
                Trust
              </p>
              <h2 className="mt-3 font-['Space_Grotesk'] text-3xl font-semibold tracking-tight text-[#F6F6F3] sm:text-4xl">
                Built with security in mind
              </h2>
              <p className="mt-5 text-base leading-relaxed text-[#B7BCCB] sm:text-lg">
                We take the security and privacy of connected social media
                accounts seriously. Account authorization is handled through
                the respective platform's official authentication
                mechanisms, and access credentials are securely managed by
                our backend.
              </p>
            </Reveal>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {SECURITY_CARDS.map((c, i) => (
                <Reveal
                  key={c.title}
                  className="rounded-xl border border-white/10 bg-white/[0.04] p-6"
                  style={{ transitionDelay: `${i * 60}ms` }}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-[#F6F6F3]">
                    <c.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-['Space_Grotesk'] text-lg font-semibold text-[#F6F6F3]">
                    {c.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#B7BCCB]">
                    {c.desc}
                  </p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 9. DASHBOARD PREVIEW                                          */}
        {/* ============================================================ */}
        <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <Reveal className="max-w-2xl">
            <p className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-[0.18em] text-[#8A8672]">
              Product
            </p>
            <h2 className="mt-3 font-['Space_Grotesk'] text-3xl font-semibold tracking-tight sm:text-4xl">
              Manage everything from one dashboard
            </h2>
            {/* TODO: swap DashboardMockup below for a real product screenshot
                before submitting for TikTok review — reviewers respond
                better to actual UI than to a mockup. */}
          </Reveal>

          <Reveal className="mt-10" style={{ transitionDelay: '80ms' }}>
            <DashboardMockup />
          </Reveal>
        </section>

        {/* ============================================================ */}
        {/* 10. WHO IS IT FOR                                             */}
        {/* ============================================================ */}
        <section className="border-y border-[#E4E1D8] bg-white">
          <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
            <Reveal className="max-w-2xl">
              <p className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-[0.18em] text-[#8A8672]">
                Who it's for
              </p>
              <h2 className="mt-3 font-['Space_Grotesk'] text-3xl font-semibold tracking-tight sm:text-4xl">
                Designed for teams that manage social media
              </h2>
            </Reveal>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {AUDIENCES.map((a, i) => (
                <Reveal
                  key={a.title}
                  className="rounded-xl border border-[#E4E1D8] p-6"
                  style={{ transitionDelay: `${i * 60}ms` }}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#26304D] text-[#F6F6F3]">
                    <a.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-['Space_Grotesk'] text-lg font-semibold">
                    {a.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#4B5160]">
                    {a.desc}
                  </p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 11. CALL TO ACTION                                            */}
        {/* ============================================================ */}
        <section className="bg-[#26304D]">
          <Reveal className="mx-auto max-w-3xl px-5 py-20 text-center sm:px-8">
            <h2 className="font-['Space_Grotesk'] text-3xl font-semibold tracking-tight text-[#F6F6F3] sm:text-4xl">
              Ready to simplify your social media publishing?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-[#B7BCCB] sm:text-lg">
              Connect your accounts, organize your content, and manage your
              publishing workflow from one place.
            </p>
            <a
              href="/signup"
              className="mt-8 inline-flex items-center gap-2 rounded-lg bg-[#F6F6F3] px-6 py-3 text-sm font-semibold text-[#26304D] transition-colors hover:bg-white"
            >
              Get Started
              <IconArrowRight className="h-4 w-4" />
            </a>
          </Reveal>
        </section>
      </main>

      {/* ============================================================ */}
      {/* 12. FOOTER                                                    */}
      {/* ============================================================ */}
      <footer id="contact" className="bg-[#14171C] text-[#B7BCCB]">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.3fr,1fr,1fr,1fr]">
            <div>
              <a href="#top" className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F6F6F3] text-[#14171C]">
                  <img src={logo} alt="Logo" className="h-full w-full object-contain" />
                </span>
                <span className="font-['Space_Grotesk'] text-lg font-semibold text-[#F6F6F3]">
                  {APP_NAME}
                </span>
              </a>
              <p className="mt-4 max-w-xs text-sm leading-relaxed">
                Social media management and content publishing platform.
              </p>
            </div>

            <div>
              <p className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-[0.14em] text-[#6B7284]">
                Product
              </p>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-white">How It Works</a></li>
                <li><a href="#platforms" className="hover:text-white">Supported Platforms</a></li>
              </ul>
            </div>

            <div>
              <p className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-[0.14em] text-[#6B7284]">
                Company
              </p>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li><a href="/about" className="hover:text-white">About</a></li>
                <li><a href="#contact" className="hover:text-white">Contact</a></li>
              </ul>
            </div>

            <div>
              <p className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-[0.14em] text-[#6B7284]">
                Legal
              </p>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li>
                  <a href="/privacy" className="font-medium text-[#F6F6F3] underline decoration-[#6B7284] underline-offset-4 hover:decoration-white">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="/terms" className="font-medium text-[#F6F6F3] underline decoration-[#6B7284] underline-offset-4 hover:decoration-white">
                    Terms of Service
                  </a>
                </li>
              </ul>

              <p className="mt-6 font-['IBM_Plex_Mono'] text-xs uppercase tracking-[0.14em] text-[#6B7284]">
                Support
              </p>
              <p className="mt-4 text-sm">
                <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-white">
                  {SUPPORT_EMAIL}
                </a>
              </p>
            </div>
          </div>

          <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-8 text-xs text-[#6B7284] sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 {APP_NAME}. All rights reserved.</p>
            <div className="flex items-center gap-5">
              <a href="/privacy" className="hover:text-white">Privacy Policy</a>
              <span aria-hidden="true">·</span>
              <a href="/terms" className="hover:text-white">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Mockups                                                              */
/* ------------------------------------------------------------------ */

function HeroMockup() {
  return (
    <div className="w-full max-w-md rounded-2xl border border-[#E4E1D8] bg-white p-1.5 shadow-[0_1px_2px_rgba(20,23,28,0.04),0_20px_40px_-24px_rgba(20,23,28,0.25)]">
      <div className="rounded-xl border border-[#E4E1D8] p-5">
        <p className="font-['Space_Grotesk'] text-sm font-semibold">
          Create New Post
        </p>

        <div className="mt-4 flex h-28 items-center justify-center rounded-lg border border-dashed border-[#D7D3C7] bg-[#F6F6F3]">
          <IconImage className="h-6 w-6 text-[#B8B4A6]" />
        </div>

        <p className="mt-4 font-['IBM_Plex_Mono'] text-[11px] uppercase tracking-wide text-[#8A8672]">
          Caption
        </p>
        <p className="mt-1 truncate text-sm text-[#4B5160]">
          Your scheduled content...
        </p>

        <p className="mt-4 font-['IBM_Plex_Mono'] text-[11px] uppercase tracking-wide text-[#8A8672]">
          Platforms
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {['TikTok', 'Instagram', 'Facebook'].map((p) => (
            <span
              key={p}
              className="inline-flex items-center gap-1 rounded-full bg-[#26304D]/[0.06] px-2.5 py-1 text-xs font-medium text-[#26304D]"
            >
              <IconCheck className="h-3 w-3" />
              {p}
            </span>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-lg bg-[#F6F6F3] px-3 py-2.5">
          <IconClock className="h-3.5 w-3.5 shrink-0 text-[#8A8672]" />
          <span className="font-['IBM_Plex_Mono'] text-xs text-[#4B5160]">
            Aug 25, 2026 · 09:00 AM
          </span>
        </div>

        <button
          type="button"
          className="mt-4 w-full rounded-lg bg-[#26304D] py-2.5 text-sm font-semibold text-[#F6F6F3]"
        >
          Schedule Post
        </button>
      </div>
    </div>
  );
}

function TikTokFlowMockup() {
  const flow = [
    { icon: IconPlug, label: 'Authorize' },
    { icon: IconImage, label: 'Prepare' },
    { icon: IconSend, label: 'Publish' },
  ];

  return (
    <div className="rounded-2xl border border-[#E4E1D8] bg-white p-7">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#26304D] text-[#F6F6F3]">
          <IconTikTok className="h-4.5 w-4.5" />
        </span>
        <p className="font-['Space_Grotesk'] text-sm font-semibold">
          Content Posting API
        </p>
      </div>

      <div className="mt-7 space-y-0">
        {flow.map((step, i) => (
          <div key={step.label} className="flex gap-4">
            <div className="flex flex-col items-center">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#26304D] text-[#26304D]">
                <step.icon className="h-4 w-4" />
              </span>
              {i < flow.length - 1 && (
                <span className="my-1 h-8 w-px flex-1 bg-[#E4E1D8]" />
              )}
            </div>
            <div className="pb-6">
              <p className="pt-1.5 text-sm font-semibold">{step.label}</p>
              <p className="mt-0.5 font-['IBM_Plex_Mono'] text-[11px] text-[#8A8672]">
                {i === 0 && 'via TikTok official OAuth'}
                {i === 1 && 'photo & video, per API support'}
                {i === 2 && 'on your scheduled time'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DashboardMockup() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#E4E1D8] bg-white shadow-[0_1px_2px_rgba(20,23,28,0.04),0_24px_48px_-28px_rgba(20,23,28,0.25)]">
      <div className="flex items-center gap-1.5 border-b border-[#E4E1D8] bg-[#F6F6F3] px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-[#E4E1D8]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#E4E1D8]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#E4E1D8]" />
        <span className="ml-3 font-['IBM_Plex_Mono'] text-[11px] text-[#8A8672]">
          Dashboard
        </span>
      </div>

      <div className="grid grid-cols-[160px,1fr]">
        <div className="hidden border-r border-[#E4E1D8] bg-[#FAFAF8] p-4 sm:block">
          <nav className="space-y-1">
            {DASHBOARD_NAV.map((item, i) => (
              <div
                key={item}
                className={`rounded-lg px-3 py-2 text-sm ${
                  i === 5
                    ? 'bg-[#26304D] font-medium text-[#F6F6F3]'
                    : 'text-[#4B5160]'
                }`}
              >
                {item}
              </div>
            ))}
          </nav>
        </div>

        <div className="p-5 sm:p-7">
          <p className="font-['Space_Grotesk'] text-base font-semibold">
            Scheduled Posts
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {QUEUE_ITEMS.map((item) => (
              <div
                key={item.platform}
                className="rounded-xl border border-[#E4E1D8] p-4"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#26304D]/[0.06] text-[#26304D]">
                  <item.icon className="h-4 w-4" />
                </span>
                <p className="mt-3 text-sm font-semibold">{item.platform}</p>
                <p className="mt-1 font-['IBM_Plex_Mono'] text-xs text-[#8A8672]">
                  {item.time}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Fonts + motion rules                                                 */
/* ------------------------------------------------------------------ */

function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');

      html { scroll-behavior: smooth; }

      .reveal {
        opacity: 0;
        transform: translateY(14px);
        transition: opacity 0.5s ease, transform 0.5s ease;
      }
      .reveal-visible {
        opacity: 1;
        transform: translateY(0);
      }

      a:focus-visible, button:focus-visible {
        outline: 2px solid #26304D;
        outline-offset: 2px;
      }

      @media (prefers-reduced-motion: reduce) {
        html { scroll-behavior: auto; }
        .reveal {
          opacity: 1 !important;
          transform: none !important;
          transition: none !important;
        }
      }
    `}</style>
  );
}