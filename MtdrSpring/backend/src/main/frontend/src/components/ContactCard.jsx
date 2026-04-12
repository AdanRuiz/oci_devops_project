import React from "react";

function ContactCard() {
  return (
    <div className="mt-10 bg-gray-50 rounded-2xl p-5 shadow-sm">
      <h3 className="text-gray-800 font-medium mb-1">Contacto</h3>
      <p className="text-gray-500 text-sm">
        ¿Problemas para ingresar? Nuestro equipo está para ayudarte.
      </p>
      <p className="text-red-500 text-sm mt-2">
        soporte@acme.com
      </p>
    </div>
  );
}

export default ContactCard;