import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './index.css';
import LandingFooter from './components/LandingFooter';
import LandingNavbar from './components/LandingNavbar';
import {
  LandingScrollBlock,
  LandingScrollCard,
  LandingScrollSection,
  LandingScrollStagger,
  LandingScrollStaggerGrid,
  LandingScrollStaggerItem,
  LandingScrollStaggerList,
  LandingScrollStaggerListItem,
} from './components/LandingScrollMotion';
import Grainient from '@/components/Grainient/Grainient';
import {
  primaryAuthButtonCompactClass,
  primaryAuthButtonLargeClass,
} from './constants/authStyles';
import { landingContainer, landingSection } from './constants/landingLayout';

const features = [
  {
    title: 'Sprints',
    description:
      'Organize work by iteration. View the current sprint, filter by dates, and expand each task block.',
  },
  {
    title: 'Tasks',
    description:
      'Create, search, and delete tasks with title, description, status, and priority. Assign to sprints from the same view.',
  },
  {
    title: 'Search & filters',
    description:
      'Find tasks instantly and control which sprints appear on screen without losing team context.',
  },
];

const productRoles = [
  {
    title: 'Developer',
    path: '/app',
    description:
      'Day-to-day operational view: sprint backlog, task creation, and active work tracking.',
    cta: 'Enter as Developer',
  },
  {
    title: 'Dashboard',
    path: '/dashboard',
    description:
      'Management view to track sprint burndown, member performance, and team activity.',
    cta: 'Open dashboard',
  },
];

const docSteps = [
  'Clone the repository and start the Spring Boot backend on port 8080.',
  'For local development, run the frontend with pnpm install and pnpm run dev.',
  'Review the OpenAPI definition in the Swagger files included in the project.',
];

function Landing() {
  useEffect(() => {
    const previous = history.scrollRestoration;
    history.scrollRestoration = 'manual';
    if (!window.location.hash) {
      window.scrollTo(0, 0);
    }
    return () => {
      history.scrollRestoration = previous;
    };
  }, []);

  return (
    <div className="landing-page-enter app-scrollbar min-h-screen w-full bg-white text-[#2a1814]">
      <div className="relative w-full">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-0 min-h-screen overflow-hidden">
          <Grainient
            color1="#fbebde"
            color2="#f66a48"
            color3="#B497cf"
            timeSpeed={0.25}
            colorBalance={-0.31}
            warpStrength={1.05}
            warpFrequency={5}
            warpSpeed={2}
            warpAmplitude={50}
            blendAngle={0}
            blendSoftness={0.05}
            rotationAmount={500}
            noiseScale={2}
            grainAmount={0.1}
            grainScale={2}
            grainAnimated={false}
            contrast={1.5}
            gamma={1}
            saturation={1}
            centerX={0}
            centerY={0}
            zoom={0.9}
          />
        </div>

        <LandingNavbar />

        <section id="hero" className="relative z-10 w-full pt-28 pb-14 sm:pt-32 sm:pb-16 md:pb-20">
          <div className={`${landingContainer} flex flex-col items-center text-center`}>
            <h1 className="landing-hero-enter title-font mb-5 max-w-4xl text-4xl font-semibold tracking-tight text-[#2a1814] sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
              Clarity for every sprint.
            </h1>
            <p className="landing-hero-enter-delayed mx-auto max-w-2xl text-base leading-relaxed text-[#2a1814]/75 sm:text-lg">
              Plan iterations, own the backlog, and see burndown and team activity in one place,
              from the developer view your squad uses daily to the dashboard leads rely on.
            </p>

            <div className="landing-hero-showcase mt-12 w-full max-w-5xl sm:mt-14">
              <div className="landing-hero-showcase__glow" aria-hidden />
              <div className="landing-hero-showcase__frame landing-hero-img-enter">
                <img
                  src="/hero-img.png"
                  alt="Lumen task dashboard preview"
                  className="landing-hero-showcase__img"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>
          </div>
        </section>
      </div>

      <LandingScrollSection className="border-b border-black/8 bg-white py-10 sm:py-12">
        <div className={`${landingContainer} flex flex-col items-center text-center`}>
          <p className="text-sm leading-relaxed text-[#2a1814]/70">
            Trusted by teams at
          </p>
          <img
            src="/oracle.svg"
            alt="Oracle"
            className="mt-4 h-5 w-auto sm:h-6"
          />
        </div>
      </LandingScrollSection>

      <LandingScrollSection id="features" className={landingSection}>
        <div className={landingContainer}>
          <LandingScrollBlock className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Features</h2>
            <p className="mt-4 text-base leading-relaxed text-[#2a1814]/70">
              Everything your team needs to move fast without switching tools every sprint.
            </p>
          </LandingScrollBlock>
          <LandingScrollStagger className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ title, description }, index) => (
              <LandingScrollStaggerItem
                key={title}
                index={index}
                className="rounded-2xl border border-black/8 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#2a1814]/70">{description}</p>
              </LandingScrollStaggerItem>
            ))}
          </LandingScrollStagger>
        </div>
      </LandingScrollSection>

      <LandingScrollSection
        id="product"
        className={`scroll-mt-16 ${landingSection} border-t border-black/8 bg-[#fafafa]`}
      >
        <div className={landingContainer}>
          <LandingScrollBlock className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Product</h2>
            <p className="mt-4 text-base leading-relaxed text-[#2a1814]/70">
              Two experiences based on your role. Same API, different screens.
            </p>
          </LandingScrollBlock>
          <LandingScrollStaggerGrid className="mt-14 grid gap-8 lg:grid-cols-2">
            {productRoles.map(({ title, path, description, cta }, index) => (
              <LandingScrollCard
                key={title}
                index={index}
                className="flex flex-col rounded-2xl border border-black/8 bg-white p-8 shadow-sm"
              >
                <h3 className="text-xl font-semibold">{title}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-[#2a1814]/70">{description}</p>
                <Link
                  to={path}
                  className={`mt-6 w-fit ${primaryAuthButtonCompactClass}`}
                >
                  {cta}
                </Link>
              </LandingScrollCard>
            ))}
          </LandingScrollStaggerGrid>
        </div>
      </LandingScrollSection>

      <LandingScrollSection id="documentation" className={`scroll-mt-16 ${landingSection}`}>
        <div className={landingContainer}>
          <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
            <LandingScrollBlock>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Documentation</h2>
              <p className="mt-4 text-base leading-relaxed text-[#2a1814]/70">
                Start the local stack and explore REST endpoints documented with OpenAPI.
              </p>
            </LandingScrollBlock>
            <LandingScrollBlock delay={0.08} className="rounded-2xl border border-black/8 bg-[#fafafa] p-8">
              <LandingScrollStaggerList className="space-y-4">
                {docSteps.map((step, index) => (
                  <LandingScrollStaggerListItem
                    key={step}
                    index={index}
                    className="flex gap-4 text-sm leading-relaxed text-[#2a1814]/80"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2a1814] text-xs font-semibold text-white">
                      {index + 1}
                    </span>
                    {step}
                  </LandingScrollStaggerListItem>
                ))}
              </LandingScrollStaggerList>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="/swagger_APIs_definition.yaml"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-full border border-black/15 px-4 py-2 text-sm font-medium transition hover:bg-black/[0.04]"
                >
                  Swagger YAML
                </a>
                <a
                  href="/swagger_APIs_definition.json"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-full border border-black/15 px-4 py-2 text-sm font-medium transition hover:bg-black/[0.04]"
                >
                  Swagger JSON
                </a>
              </div>
            </LandingScrollBlock>
          </div>
        </div>
      </LandingScrollSection>

      <LandingScrollSection className="border-t border-black/8 bg-[#fafafa] py-20 sm:py-24">
        <div className={`${landingContainer} text-center`}>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Ready to plan your next sprint
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-[#2a1814]/70">
            Sign in with your role and start organizing tasks in minutes.
          </p>
          <LandingScrollBlock
            delay={0.12}
            className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4"
          >
            <Link to="/login" className={primaryAuthButtonLargeClass}>
              Log in
            </Link>
            <a
              href="mailto:support@lumen.app"
              className="inline-flex items-center justify-center rounded-full border border-[#2a1814]/20 bg-white px-6 py-2.5 text-sm font-medium text-[#2a1814] transition hover:bg-black/[0.04]"
            >
              Contact us
            </a>
          </LandingScrollBlock>
        </div>
      </LandingScrollSection>

      <LandingScrollBlock>
        <LandingFooter />
      </LandingScrollBlock>
    </div>
  );
}

export default Landing;
