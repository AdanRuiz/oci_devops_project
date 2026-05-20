import { LandingScrollBlock, LandingScrollSection } from './LandingScrollMotion';
import { landingContainer, landingSection } from '../constants/landingLayout';

const featureColumns = [
  {
    id: 'sprint',
    title: 'Built for the sprint',
    description:
      'Organize iterations, filter by dates, and keep the backlog in view so the team always knows what belongs to this cycle.',
    imageSrc: '/sprint-f.png',
    imageAlt: 'Sprint timeline, weekly stacks, and backlog',
  },
  {
    id: 'dashboard',
    title: 'Lead with clarity',
    description:
      'Burndown, member output, and live activity in one dashboard built for leads who need signal, not another spreadsheet.',
    imageSrc: '/lead-f.png',
    imageAlt: 'Burndown chart, member output, and live activity feed',
  },
  {
    id: 'lumi',
    title: 'Meet Lumi',
    description:
      'Your AI copilot inside Lumen. Ask in plain language, dictate tasks, and keep context without leaving the workspace.',
    imageSrc: '/lumi.svg',
    imageAlt: 'Lumi AI assistant connected to sprint and dashboard views',
  },
];

function FeatureVisual({ imageSrc, imageAlt, compact }) {
  return (
    <div
      className={`landing-features-visual landing-features-visual--image${compact ? ' landing-features-visual--compact' : ''}`}
    >
      <div className="landing-features-visual__frame">
        <img
          src={imageSrc}
          alt={imageAlt}
          className="landing-features-visual__img"
          loading="lazy"
          decoding="async"
        />
      </div>
    </div>
  );
}

function LandingFeatures() {
  return (
    <LandingScrollSection id="features" className={`scroll-mt-16 ${landingSection} border-t border-black/8 bg-white`}>
      <div className={landingContainer}>
        <LandingScrollBlock className="landing-features-intro-wrap max-w-4xl">
          <p className="landing-features-intro text-[1.65rem] font-medium leading-[1.35] tracking-tight sm:text-3xl lg:text-[2.125rem] lg:leading-[1.32]">
            <span className="text-[#2a1814]">A workspace shaped for how squads really ship. </span>
            <span className="text-[#2a1814]/50">
              Purpose-built for developers and leads, Lumen unites sprints, dashboards, and Lumi so
              planning and delivery stay in one calm place.
            </span>
          </p>
        </LandingScrollBlock>

        <LandingScrollBlock delay={0.08} className="mt-16 sm:mt-20 lg:mt-24">
          <div className="landing-features-grid">
            {featureColumns.map(({ id, title, description, imageSrc, imageAlt }, index) => (
              <article
                key={id}
                className="landing-features-col"
                style={{ transitionDelay: `${80 + index * 70}ms` }}
              >
                <FeatureVisual
                  imageSrc={imageSrc}
                  imageAlt={imageAlt}
                  compact={id === 'lumi'}
                />
                <h3 className="landing-features-title">{title}</h3>
                <p className="landing-features-desc">{description}</p>
              </article>
            ))}
          </div>
        </LandingScrollBlock>
      </div>
    </LandingScrollSection>
  );
}

export default LandingFeatures;
