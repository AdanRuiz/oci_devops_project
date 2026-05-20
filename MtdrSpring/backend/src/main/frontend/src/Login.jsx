import { Link } from 'react-router-dom';
import LoginForm from './components/LoginForm';
import LoginHeroPanel from './components/LoginHeroPanel';

function Login() {
  return (
    <section className="flex min-h-screen bg-white text-[#2a1814]">
      <div className="flex w-full flex-col items-center justify-center px-8 py-12 sm:px-12 md:w-1/2 lg:px-16 xl:px-24">
        <div className="w-full max-w-md text-left">
          <Link to="/" className="mb-8 inline-flex w-fit" aria-label="Lumen home">
            <img src="/lettermark-b.svg" alt="Lumen" className="h-10 w-auto sm:h-12" />
          </Link>

          <h1 className="text-3xl font-semibold tracking-tight text-[#2a1814] sm:text-4xl">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-[#2a1814]/60 sm:text-base">
            Welcome back! Please enter your details.
          </p>

          <LoginForm />
        </div>
      </div>

      <LoginHeroPanel />
    </section>
  );
}

export default Login;
