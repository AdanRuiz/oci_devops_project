import { Link } from 'react-router-dom';
import './index.css';
import LandingFooter from './components/LandingFooter';
import LandingNavbar from './components/LandingNavbar';
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
      'Organiza el trabajo por iteraciones. Visualiza el sprint actual, filtra por fechas y expande cada bloque de tareas.',
  },
  {
    title: 'Tareas',
    description:
      'Crea, busca y elimina tareas con título, descripción, estado y prioridad. Asignación a sprints desde la misma vista.',
  },
  {
    title: 'Búsqueda y filtros',
    description:
      'Encuentra tareas al instante y controla qué sprints se muestran en pantalla sin perder el contexto del equipo.',
  },
];

const productRoles = [
  {
    title: 'Developer',
    path: '/app',
    description:
      'Vista operativa para el día a día: backlog por sprint, alta de tareas y seguimiento del trabajo activo.',
    cta: 'Entrar como Developer',
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
  'Clona el repositorio y levanta el backend Spring Boot en el puerto 8080.',
  'En desarrollo, ejecuta el frontend con pnpm install y pnpm run dev.',
  'Consulta la definición OpenAPI en los archivos Swagger incluidos en el proyecto.',
];

function Landing() {
  return (
    <div className="min-h-screen w-full bg-white text-[#2a1814]">
      <LandingNavbar />

      {/* Hero */}
      <section className="relative h-screen w-full overflow-hidden">
        <div className="absolute inset-0">
          <Grainient
            color1="#fbebde"
            color2="#c74634"
            color3="#d2cfde"
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

        <div
          className={`relative z-10 flex h-full w-full flex-col items-center justify-center py-24 pt-16 ${landingContainer} md:flex-row md:items-center md:justify-start`}
        >
          <div className="mb-16 flex flex-col items-center text-center md:mb-0 md:w-1/2 md:items-start md:pr-16 md:text-left lg:flex-grow lg:pr-24">
            <h1 className="title-font mb-4 text-4xl font-semibold tracking-tight text-[#2a1814] sm:text-5xl lg:text-6xl">
              Sprints y tareas, en un solo lugar
            </h1>
            <p className="max-w-xl text-sm font-medium tracking-wide text-[#2a1814]/70 sm:text-base">
              Planificación ágil para equipos de desarrollo
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-black/8 bg-white py-10 sm:py-12">
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
      </section>

      {/* Features */}
      <section id="features" className={landingSection}>
        <div className={landingContainer}>
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Features</h2>
            <p className="mt-4 text-base leading-relaxed text-[#2a1814]/70">
              Lo esencial para mover tu equipo sin cambiar de herramienta en cada sprint.
            </p>
          </div>
          <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ title, description }) => (
              <li
                key={title}
                className="rounded-2xl border border-black/8 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#2a1814]/70">{description}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Product */}
      <section id="product" className={`${landingSection} border-t border-black/8 bg-[#fafafa]`}>
        <div className={landingContainer}>
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Product</h2>
            <p className="mt-4 text-base leading-relaxed text-[#2a1814]/70">
              Dos experiencias según tu rol. Misma API, distintas pantallas.
            </p>
          </div>
          <div className="mt-14 grid gap-8 lg:grid-cols-2">
            {productRoles.map(({ title, path, description, cta }) => (
              <article
                key={title}
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
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Documentation */}
      <section id="documentation" className={landingSection}>
        <div className={landingContainer}>
          <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Documentation</h2>
              <p className="mt-4 text-base leading-relaxed text-[#2a1814]/70">
                Arranca el stack local y explora los endpoints REST documentados con OpenAPI.
              </p>
            </div>
            <div className="rounded-2xl border border-black/8 bg-[#fafafa] p-8">
              <ol className="space-y-4">
                {docSteps.map((step, index) => (
                  <li key={step} className="flex gap-4 text-sm leading-relaxed text-[#2a1814]/80">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2a1814] text-xs font-semibold text-white">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
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
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-black/8 bg-[#fafafa] py-20 sm:py-24">
        <div className={`${landingContainer} text-center`}>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Listo para planificar tu próximo sprint
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-[#2a1814]/70">
            Entra con tu rol y empieza a organizar tareas en minutos.
          </p>
          <Link
            to="/login"
            className={`mt-8 ${primaryAuthButtonLargeClass}`}
          >
            Log in
          </Link>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}

export default Landing;
