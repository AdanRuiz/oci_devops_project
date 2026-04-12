import React from "react";
import LoginForm from "./components/LoginForm";
import ContactCard from "./components/ContactCard";

function Login() {
  return (
    <section className="min-h-screen flex">
    
      <div className="w-full md:w-1/2 flex flex-col justify-center px-10 lg:px-20 bg-white">
        <h1 className="text-4xl font-semibold text-gray-900">
          Bienvenido
        </h1>
        <h2 className="text-4xl text-red-500 italic mb-4">
          de vuelta
        </h2>

        <p className="text-gray-500 mb-8">
          Ingresa a tu cuenta para continuar.
        </p>

        <LoginForm />
        <ContactCard />
      </div>

      <div className="hidden md:block md:w-1/2">
        <img
          src="https://dummyimage.com/720x600"
          alt="login"
          className="w-full h-full object-cover"
        />
      </div>
    </section>
    );
}

export default Login;