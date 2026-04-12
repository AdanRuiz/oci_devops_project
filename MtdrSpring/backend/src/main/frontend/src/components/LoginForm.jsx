import React from "react";
import InputField from "./InputField";
import { Link } from "react-router-dom";

function LoginForm() {
  return (
    <>
      <form className="space-y-5">
        <InputField
          label="Correo Electrónico"
          type="email"
          placeholder="nombre@ejemplo.com"
        />
        <InputField
          label="Contraseña"
          type="password"
          placeholder="********"
        />
        <button
          type="button"
          className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-full text-lg shadow-md transition"
        >
          Iniciar Sesión
        </button>
      </form>
      
      <div className="flex gap-4 mt-6 text-sm text-gray-400">
        <Link to="/app" className="hover:text-red-500">
          Entrar como Dev
        </Link>
        <span>•</span>
        <Link to="/app" className="hover:text-red-500">
          Entrar como Manager
        </Link>
      </div>
    </>
  );
}

export default LoginForm;