import { Link } from 'react-router-dom';

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'Product', href: '#product' },
  { label: 'Documentation', href: '#documentation' },
];

function scrollToHero(event) {
  event.preventDefault();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function LandingNavbar() {
  return (
    <header className="landing-header-glass landing-nav-enter relative sticky top-0 z-50 w-full border-b border-white/40 bg-white/30 backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-white/25">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/40 via-white/15 to-transparent"
      />
      <nav className="relative container mx-auto flex h-16 w-full items-center justify-between px-5 sm:px-8 lg:px-14 xl:px-20">
        <button
          type="button"
          onClick={scrollToHero}
          className="flex shrink-0 items-center border-0 bg-transparent p-0 transition-opacity hover:opacity-80"
          aria-label="Go to top"
        >
          <img
            src="/lettermark-b.svg"
            alt="Lumen"
            className="h-7 w-auto sm:h-8"
          />
        </button>

        <div className="flex items-center gap-6 sm:gap-8">
          <ul className="hidden items-center gap-1 md:flex">
            {navLinks.map(({ label, href }) => (
              <li key={label}>
                <a
                  href={href}
                  className="inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium text-[#2a1814] transition-colors duration-200 hover:bg-black/[0.06]"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>

          <span
            aria-hidden
            className="hidden h-4 w-px shrink-0 rounded-full bg-[#2a1814]/25 md:block"
          />

          <Link
            to="/login"
            className="inline-flex items-center justify-center rounded-full bg-[#2a1814] px-4 py-1.5 text-sm font-medium text-white shadow-sm ring-1 ring-white/25 transition hover:bg-[#3d2c28] hover:ring-white/40"
          >
            Log in
          </Link>
        </div>
      </nav>
    </header>
  );
}

export default LandingNavbar;
