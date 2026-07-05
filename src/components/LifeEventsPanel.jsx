function newId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

const inputClass =
  'w-full px-2 py-1.5 text-sm rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 tabular-nums';

function EventRow({ event, onChange, onRemove }) {
  const isRecurring = event.type === 'recurring';
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 mb-3">
      <div className="flex items-center gap-2 mb-2">
        <input
          type="text"
          value={event.label}
          onChange={(e) => onChange({ label: e.target.value })}
          placeholder="Label"
          className={`${inputClass} flex-1`}
        />
        <select
          value={event.type}
          onChange={(e) => {
            const type = e.target.value;
            onChange(type === 'oneoff' ? { type, endAge: event.startAge } : { type });
          }}
          className={inputClass}
          style={{ width: 110 }}
        >
          <option value="recurring">Recurring</option>
          <option value="oneoff">One-off</option>
        </select>
        <button
          onClick={onRemove}
          aria-label={`Remove ${event.label || 'event'}`}
          className="text-slate-400 hover:text-[#d03b3b] px-2 py-1 text-sm"
        >
          ✕
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <label className="block">
          <span className="block text-slate-400 dark:text-slate-500 mb-1">{isRecurring ? 'Start age' : 'Age'}</span>
          <input
            type="number"
            value={event.startAge}
            onChange={(e) => {
              const startAge = Number(e.target.value);
              onChange(isRecurring ? { startAge } : { startAge, endAge: startAge });
            }}
            className={inputClass}
          />
        </label>
        {isRecurring ? (
          <label className="block">
            <span className="block text-slate-400 dark:text-slate-500 mb-1">End age</span>
            <input
              type="number"
              value={event.endAge}
              onChange={(e) => onChange({ endAge: Number(e.target.value) })}
              className={inputClass}
            />
          </label>
        ) : (
          <div />
        )}
        <label className="block">
          <span className="block text-slate-400 dark:text-slate-500 mb-1">{isRecurring ? '€ / month' : 'Total €'}</span>
          <input
            type="number"
            value={event.amount}
            onChange={(e) => onChange({ amount: Number(e.target.value) })}
            className={inputClass}
          />
        </label>
      </div>
    </div>
  );
}

export default function LifeEventsPanel({ events, setEvents, currentAge }) {
  const updateEvent = (id, patch) => setEvents(events.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  const removeEvent = (id) => setEvents(events.filter((e) => e.id !== id));
  const addChild = () =>
    setEvents([
      ...events,
      { id: newId(), label: 'Child', type: 'recurring', startAge: currentAge + 1, endAge: currentAge + 18, amount: 600 },
    ]);
  const addShock = () =>
    setEvents([
      ...events,
      { id: newId(), label: 'Unexpected expense', type: 'oneoff', startAge: currentAge + 1, endAge: currentAge + 1, amount: 10000 },
    ]);

  return (
    <div>
      {events.map((event) => (
        <EventRow key={event.id} event={event} onChange={(patch) => updateEvent(event.id, patch)} onRemove={() => removeEvent(event.id)} />
      ))}
      <div className="flex gap-2">
        <button
          onClick={addChild}
          className="text-xs font-medium px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
        >
          + Add child
        </button>
        <button
          onClick={addShock}
          className="text-xs font-medium px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
        >
          + Add one-off expense
        </button>
      </div>
    </div>
  );
}
