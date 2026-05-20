import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './index.css';
import LandingFooter from './components/LandingFooter';
import LandingNavbar from './components/LandingNavbar';
import LandingFeatures from './components/LandingFeatures';
import LandingProduct from './components/LandingProduct';
import {
  LandingScrollBlock,
  LandingScrollSection,
} from './components/LandingScrollMotion';
import Grainient from '@/components/Grainient/Grainient';
import {
  primaryAuthButtonLargeClass,
} from './constants/authStyles';
import { landingContainer } from './constants/landingLayout';

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
    <div className="landing-page-enter app-scrollbar relative min-h-screen w-full bg-white text-[#2a1814]">
      <div
        className="landing-hero-gradient pointer-events-none fixed inset-x-0 top-0 z-[1] h-screen overflow-hidden"
        aria-hidden
      >
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

      <section
        id="hero"
        className="relative z-10 w-full pt-28 pb-14 sm:pt-32 sm:pb-16 md:pb-20"
      >
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

      <div className="relative z-10 bg-white">
      <LandingScrollSection className="border-b border-black/8 py-10 sm:py-12">
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

      <LandingFeatures />

      <LandingProduct />

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
    </div>
  );
}

export default Landing;
