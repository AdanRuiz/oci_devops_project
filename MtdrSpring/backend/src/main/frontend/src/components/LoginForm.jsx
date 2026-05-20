import { Link, useNavigate } from 'react-router-dom';
import { primaryAuthButtonClass } from '../constants/authStyles';
import InputField from './InputField';

function LoginForm() {
  const navigate = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault();
    navigate('/app');
  };

  return (
    <>
      <form className="mt-8 space-y-6 text-left" onSubmit={handleSubmit}>
        <InputField
          label="Email"
          type="email"
          placeholder="you@company.com"
          variant="underline"
        />
        <InputField
          label="Password"
          type="password"
          placeholder="••••••••"
          variant="underline"
        />

        <button type="submit" className={primaryAuthButtonClass}>
          Sign in
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-[#2a1814]/60">
        Need help?{' '}
        <a
          href="mailto:support@lumen.app"
          className="font-medium text-[#2a1814] underline decoration-[#2a1814]/30 underline-offset-2 transition hover:decoration-[#2a1814]"
        >
          Contact support
        </a>
      </p>

      <p className="mt-4 text-center text-xs text-[#2a1814]/45">
        <Link to="/app" className="hover:text-[#2a1814]">
          Developer
        </Link>
        <span className="mx-2">·</span>
        <Link to="/dashboard" className="hover:text-[#2a1814]">
          Dashboard
        </Link>
      </p>
    </>
  );
}

export default LoginForm;
