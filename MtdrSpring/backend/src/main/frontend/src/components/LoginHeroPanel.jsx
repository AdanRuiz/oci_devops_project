/** Swap `backgroundImage` when the hero photo is ready — slogan stays on top. */
export const LOGIN_HERO_SLOGAN =
  'Plan every sprint with clarity. Deliver with your team\'s momentum.';

const LOGIN_HERO_IMAGE = null;

function LoginHeroPanel() {
  return (
    <aside className="relative hidden min-h-screen md:block md:w-1/2">
      <div
        className="absolute inset-0 bg-[#2a1814]/5"
        style={
          LOGIN_HERO_IMAGE
            ? {
                backgroundImage: `url(${LOGIN_HERO_IMAGE})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : undefined
        }
        aria-hidden={!LOGIN_HERO_IMAGE}
      >
        {!LOGIN_HERO_IMAGE && (
          <div className="h-full w-full bg-gradient-to-br from-[#fbebde] via-[#d2cfde]/80 to-[#c74634]/25" />
        )}
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-[#2a1814]/75 via-[#2a1814]/20 to-transparent" />

      <div className="relative flex h-full min-h-screen flex-col justify-end p-10 lg:p-14 xl:p-16">
        <blockquote className="max-w-lg border-l-2 border-[#fbebde] pl-6">
          <p className="text-2xl font-medium leading-snug tracking-tight text-white sm:text-3xl lg:text-4xl">
            {LOGIN_HERO_SLOGAN}
          </p>
        </blockquote>
      </div>
    </aside>
  );
}

export default LoginHeroPanel;
