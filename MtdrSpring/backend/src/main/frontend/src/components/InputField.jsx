function InputField({ label, type, placeholder, id, variant = 'boxed', centered = false }) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-');

  if (variant === 'underline') {
    return (
      <div>
        <label
          htmlFor={inputId}
          className={`mb-2 block text-sm text-[#2a1814]/60 ${centered ? 'text-center' : ''}`}
        >
          {label}
        </label>
        <input
          id={inputId}
          type={type}
          placeholder={placeholder}
          className={`w-full border-0 border-b border-[#2a1814]/20 bg-transparent py-2.5 text-[#2a1814] placeholder:text-[#2a1814]/35 focus:border-[#2a1814] focus:outline-none focus:ring-0 ${centered ? 'text-center' : ''}`}
        />
      </div>
    );
  }

  return (
    <div>
      <label htmlFor={inputId} className="mb-1 block text-sm text-gray-600">
        {label}
      </label>
      <input
        id={inputId}
        type={type}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-200"
      />
    </div>
  );
}

export default InputField;
