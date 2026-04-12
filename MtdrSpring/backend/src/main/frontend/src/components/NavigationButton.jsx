import { Link } from 'react-router-dom';

function NavigationButton({ to, children }) {
  return (
    <Link
      to={to}
      className="inline-flex text-white bg-red-500 border-0 py-2 px-6 focus:outline-none hover:bg-red-600 rounded text-lg"
    >
      {children}
    </Link>
  );
}

export default NavigationButton;