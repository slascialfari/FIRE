export function FieldRow({ label, hint, children }) {
  return (
    <label className="block mb-4">
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
      </div>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{hint}</p>}
    </label>
  );
}

export function SliderNumberField({
  label,
  hint,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix = '',
  format,
}) {
  const display = format ? format(value) : `${value}${suffix}`;
  return (
    <FieldRow
      label={
        <span className="flex items-baseline justify-between w-full">
          <span>{label}</span>
          <span className="tabular-nums text-slate-500 dark:text-slate-400 font-normal">{display}</span>
        </span>
      }
      hint={hint}
    >
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 appearance-none cursor-pointer"
      />
    </FieldRow>
  );
}

export function NumberField({ label, hint, value, onChange, min = 0, step = 1, prefix = '' }) {
  return (
    <FieldRow label={label} hint={hint}>
      <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
        {prefix && (
          <span className="pl-3 text-sm text-slate-400 dark:text-slate-500 select-none">{prefix}</span>
        )}
        <input
          type="number"
          min={min}
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
          className="w-full px-3 py-2 text-sm bg-transparent outline-none text-slate-800 dark:text-slate-100 tabular-nums"
        />
      </div>
    </FieldRow>
  );
}

export function DateField({ label, hint, value, onChange }) {
  return (
    <FieldRow label={label} hint={hint}>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
      />
    </FieldRow>
  );
}

export function SelectField({ label, hint, value, onChange, options }) {
  return (
    <FieldRow label={label} hint={hint}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </FieldRow>
  );
}

export function ToggleField({ label, hint, checked, onChange }) {
  return (
    <label className="flex items-start justify-between gap-3 mb-4 cursor-pointer">
      <span>
        <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
        {hint && <span className="block mt-1 text-xs text-slate-400 dark:text-slate-500">{hint}</span>}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <span
        aria-hidden="true"
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500 peer-focus-visible:ring-offset-2 ${
          checked ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </span>
    </label>
  );
}

export function SectionCard({ title, description, children }) {
  return (
    <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 p-5 mb-4">
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1">{title}</h3>
      {description && <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">{description}</p>}
      {!description && <div className="mb-3" />}
      {children}
    </section>
  );
}
