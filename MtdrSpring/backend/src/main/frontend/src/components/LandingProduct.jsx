import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { LandingScrollBlock, LandingScrollSection } from './LandingScrollMotion';
import { landingContainer, landingSection } from '../constants/landingLayout';

const productBlocks = [
  {
    id: 'developer',
    headline: 'Run the sprint from the floor',
    description:
      'Create tasks, filter sprints, and track what is open or done in one operational view built for daily dev work.',
    link: { label: 'Developer view', to: '/app' },
    images: [
      {
        src: '/hero-img.png',
        alt: 'Lumen developer view with sprint tasks and backlog',
        variant: 'single',
      },
    ],
  },
  {
    id: 'admin',
    headline: 'See what leads need to see',
    description:
      'Burndown, member output, sprint drill-down, and live activity in dashboards shaped for managers and team leads.',
    link: { label: 'Dashboard', to: '/dashboard' },
    images: [
      {
        src: '/manager2-p.png',
        alt: 'Lumen dashboard with sprint metrics and team charts',
        variant: 'primary',
      },
      {
        src: '/manager-p.png',
        alt: 'Lumen home dashboard with burndown and recent activity',
        variant: 'secondary',
      },
    ],
  },
];

function ProductVisual({ images }) {
  const isDuo = images.length > 1;

  return (
    <div className={`landing-product-visual${isDuo ? ' landing-product-visual--duo' : ''}`}>
      {images.map(({ src, alt, variant }) => (
        <div
          key={src}
          className={`landing-product-visual__shot landing-product-visual__shot--${variant}`}
        >
          <img src={src} alt={alt} className="landing-product-visual__img" loading="lazy" decoding="async" />
        </div>
      ))}
    </div>
  );
}

function LandingProduct() {
  return (
    <LandingScrollSection
      id="product"
      className={`scroll-mt-16 ${landingSection} border-t border-black/8 bg-[#fafafa]`}
    >
      <div className={`${landingContainer} space-y-24 sm:space-y-28 lg:space-y-32`}>
        {productBlocks.map(({ id, headline, description, link, images }, index) => (
          <LandingScrollBlock key={id} delay={index * 0.06}>
            <article className="landing-product-block">
              <div className="landing-product-copy">
                <h2 className="landing-product-headline">{headline}</h2>
                <div className="landing-product-aside">
                  <p className="landing-product-desc">{description}</p>
                  <Link to={link.to} className="landing-product-link group">
                    {link.label}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </div>
              <ProductVisual images={images} />
            </article>
          </LandingScrollBlock>
        ))}
      </div>
    </LandingScrollSection>
  );
}

export default LandingProduct;
