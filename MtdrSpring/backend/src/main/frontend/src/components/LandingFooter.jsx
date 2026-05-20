import { Link } from 'react-router-dom';

const footerLinks = {
  Product: [
    { label: 'Features', href: '#features' },
    { label: 'Product', href: '#product' },
    { label: 'Documentation', href: '#documentation' },
  ],
  App: [
    { label: 'Developer', to: '/app' },
    { label: 'Dashboard', to: '/dashboard' },
    { label: 'Log in', to: '/login' },
  ],
  Resources: [
    { label: 'API (Swagger JSON)', href: '/swagger_APIs_definition.json', external: true },
    { label: 'API (Swagger YAML)', href: '/swagger_APIs_definition.yaml', external: true },
  ],
};

function LandingFooter() {
  return (
    <footer className="border-t border-black/10 bg-white text-[#2a1814]">
      <div className="container mx-auto px-5 py-14 sm:px-8 lg:px-14 xl:px-20">
        <div className="grid gap-10 md:grid-cols-[1.2fr_repeat(3,1fr)]">
          <div>
            <Link to="/" className="inline-flex items-center" aria-label="Lumen home">
              <img src="/lettermark-b.svg" alt="Lumen" className="h-7 w-auto" />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[#2a1814]/70">
              Sprint and task management for development teams. Built with React and Spring Boot.
            </p>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold text-[#2a1814]">{title}</h3>
              <ul className="mt-4 space-y-2.5">
                {links.map((item) => (
                  <li key={item.label}>
                    {'to' in item ? (
                      <Link
                        to={item.to}
                        className="text-sm text-[#2a1814]/70 transition-colors hover:text-[#2a1814]"
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <a
                        href={item.href}
                        {...(item.external ? { target: '_blank', rel: 'noreferrer' } : {})}
                        className="text-sm text-[#2a1814]/70 transition-colors hover:text-[#2a1814]"
                      >
                        {item.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-black/10 pt-8 text-sm text-[#2a1814]/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Lumen. Oracle UPL License.</p>
      
        </div>
      </div>
    </footer>
  );
}

export default LandingFooter;
