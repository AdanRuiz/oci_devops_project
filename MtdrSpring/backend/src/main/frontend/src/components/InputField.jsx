import React from 'react';

function InputField({ label, type, placeholder }) {
  return (
    <div>
      <label className="block text-sm text-gray-600 mb-1">
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-200"
      />
    </div>
  );
}

export default InputField;