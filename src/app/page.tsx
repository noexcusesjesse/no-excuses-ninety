import Link from "next/link";
import { getSession } from "@/lib/auth";
import { ArrowRight, Dumbbell, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/logo";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const session = await getSession();
  const isLoggedIn = !!session.userId;

  // Logged-in users see the simple link grid (their portal)
  if (isLoggedIn) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-12 text-center">
        <Logo size="xl" className="mb-8" />
        <p className="max-w-xl text-balance text-base text-muted-foreground sm:text-lg">
          15-month No Excuses Reset. Daily check-in, workouts, and tracking — built
          for one client, calibrated for tirzepatide + resistance bands + Arizona heat.
        </p>
        <div className="mt-10 grid w-full gap-3 sm:grid-cols-2">
          {session.role === "client" && (
            <Link href="/app/dashboard" className="group flex items-center justify-between rounded-lg border border-border bg-card p-5 text-left transition-colors hover:border-primary">
              <div>
                <div className="flex items-center gap-2">
                  <Dumbbell className="h-4 w-4 text-primary" />
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Client view</span>
                </div>
                <p className="mt-2 text-lg font-medium">Today&apos;s plan</p>
                <p className="mt-1 text-sm text-muted-foreground">Workout, walk, hydration, check-in</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
            </Link>
          )}
          {session.role === "coach" && (
            <Link href="/coach" className="group flex items-center justify-between rounded-lg border border-border bg-card p-5 text-left transition-colors hover:border-primary">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Coach view</span>
                </div>
                <p className="mt-2 text-lg font-medium">Your roster</p>
                <p className="mt-1 text-sm text-muted-foreground">All clients, who&apos;s on track, who needs outreach</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
            </Link>
          )}
        </div>
      </main>
    );
  }

  // Logged-out users see the full marketing landing page
  return (
    <div className="landing-root">
      <header className="site-header">
        <nav className="nav container" aria-label="Main navigation">
          <a className="brand" href="#top" aria-label="LoadLine Fitness home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/loadline-fitness-logo.jpg" alt="LoadLine Fitness logo" />
          </a>
          <div className="nav-links">
            <a href="#about">About</a>
            <a href="#approach">Our Approach</a>
            <a href="#story">Our Story</a>
            <a href="#start">Get Started</a>
          </div>
        </nav>
      </header>

      <main id="top">
        <section className="hero">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="hero-image" src="/assets/loadline-fitness-banner.png" alt="LoadLine Fitness banner featuring the brand logo, fitness messaging, and a woman in a gym" />
          <div className="hero-overlay">
            <div className="container hero-content">
              <p className="eyebrow">HEALTH. FITNESS. WELL-BEING. LIFESTYLE.</p>
              <h1>Load the Standard.<br/><span>Live the Life.</span></h1>
              <p className="hero-copy">Real journeys. Real discipline. Real results.</p>
              <Link className="button button-primary" href="/login">Start Your Journey</Link>
            </div>
          </div>
        </section>

        <section id="about" className="section">
          <div className="container narrow">
            <p className="eyebrow blue">WHY LOADLINE</p>
            <h2>You don&apos;t need a perfect plan.<br/>You need a plan you can live with.</h2>
            <p>At LoadLine Fitness, we believe fitness should fit into your life—not take it over. Whether you&apos;re getting started, getting back on track, or pushing toward your next goal, we&apos;re here to help you build sustainable habits that create lasting change.</p>
            <div className="statement-grid">
              <div><strong>No gimmicks.</strong><span>Simple, practical guidance.</span></div>
              <div><strong>No shortcuts.</strong><span>Progress takes consistency.</span></div>
              <div><strong>No excuses.</strong><span>Show up and keep moving.</span></div>
            </div>
          </div>
        </section>

        <section id="approach" className="section section-dark">
          <div className="container">
            <p className="eyebrow">THE LOADLINE APPROACH</p>
            <h2>Build more than a body.</h2>
            <p className="section-lead">Health, fitness, well-being and lifestyle work together. We keep the focus on habits you can maintain and progress you can measure.</p>
            <div className="cards">
              <article className="card">
                <span className="icon">&#9829;</span>
                <h3>Health</h3>
                <p>Make better choices without turning your entire life upside down.</p>
              </article>
              <article className="card">
                <span className="icon">&#9670;</span>
                <h3>Fitness</h3>
                <p>Build strength, improve movement, and become more capable every day.</p>
              </article>
              <article className="card">
                <span className="icon">&#10022;</span>
                <h3>Well-being</h3>
                <p>Build confidence, discipline, and a stronger mindset alongside your physical progress.</p>
              </article>
              <article className="card">
                <span className="icon">&#9679;</span>
                <h3>Lifestyle</h3>
                <p>Create habits that continue working long after motivation fades.</p>
              </article>
            </div>
          </div>
        </section>

        <section id="story" className="section">
          <div className="container story">
            <div>
              <p className="eyebrow blue">REAL PEOPLE. REAL PROGRESS.</p>
              <h2>37 pounds down.<br/>Still going.</h2>
              <p>Our first client didn&apos;t need another crash diet or punishment-style workout. They needed consistency.</p>
              <p>Through sustainable habits, accountability, and a commitment to doing the work, they lost <strong>37 pounds</strong> and are already chasing the next 30-day goal.</p>
              <p className="highlight">That&apos;s what LoadLine Fitness is about. Not perfection. <strong>Progress.</strong></p>
            </div>
            <div className="story-card">
              <span className="number">37</span>
              <span className="unit">POUNDS LOST</span>
              <span className="small">and the journey continues</span>
            </div>
          </div>
        </section>

        <section className="section section-blue">
          <div className="container simple">
            <p className="eyebrow">KEEP IT SIMPLE. KEEP IT MOVING.</p>
            <h2>Small decisions. Repeated often.</h2>
            <p>You don&apos;t need complicated equipment or an extreme routine to make progress. Resistance bands. Strength training. Walking. Better food choices. Plenty of H<sub>2</sub>O. Consistency.</p>
          </div>
        </section>

        <section id="start" className="section cta">
          <div className="container narrow">
            <p className="eyebrow blue">YOUR NEXT CHAPTER</p>
            <h2>Start where you are.<br/>Then keep moving forward.</h2>
            <p>Maybe you&apos;ve been putting it off. Maybe you&apos;ve started before. Maybe you&apos;re ready to finally make fitness part of your lifestyle—not another temporary challenge.</p>
            <div className="cta-actions">
              <a className="button button-primary" href="https://www.instagram.com/LoadLineFitness/" target="_blank" rel="noopener noreferrer">Follow on Instagram</a>
              <a className="button button-outline" href="https://x.com/LoadLineFitness" target="_blank" rel="noopener noreferrer">Follow on X</a>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container footer-inner">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/loadline-fitness-logo.jpg" alt="LoadLine Fitness logo" className="footer-logo" />
            <p>Health. Fitness. Well-being. Lifestyle. &#128170;</p>
            <p className="tagline">Load the Standard. Live the Life.</p>
          </div>
          <div className="socials">
            <a href="https://www.instagram.com/LoadLineFitness/" target="_blank" rel="noopener noreferrer">Instagram</a>
            <a href="https://x.com/LoadLineFitness" target="_blank" rel="noopener noreferrer">X</a>
          </div>
        </div>
        <div className="container copyright">
          <span>&copy; {new Date().getFullYear()} LoadLine Fitness. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
