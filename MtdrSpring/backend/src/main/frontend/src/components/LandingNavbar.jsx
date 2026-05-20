import { Link } from 'react-router-dom';

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'Product', href: '#product' },
  { label: 'Documentation', href: '#documentation' },
];

function LandingNavbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/80 bg-white/70 backdrop-blur-[8px] supports-[backdrop-filter]:bg-white/60">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/65 via-white/25 to-transparent"
      />
      <nav className="relative container mx-auto flex h-16 w-full items-center justify-between px-5 sm:px-8 lg:px-14 xl:px-20">
        <Link to="/" className="flex shrink-0 items-center" aria-label="JavaPlan home">
          <img
            src="/lettermark-b.svg"
            alt="JavaPlan"
            className="h-7 w-auto sm:h-8"
          />
        </Link>

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
