import { useState } from 'react';
import { CATEGORIES, PRESETS, PRESET_BY_ID, FIELD_META, createEventFromPreset } from '../lib/eventPresets';
import { END_AGE } from '../lib/simulate';
import { useDarkMode } from '../hooks/useDarkMode';
import { useElementWidth } from '../hooks/useElementWidth';
import { EVENT_CATEGORY_COLORS, pick } from '../lib/theme';

const inputClass =
  'w-full px-2 py-1.5 text-sm rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 tabular-nums';

const MIN_LANE_GAP_FRACTION = 0.035; // markers within this fraction of the age range stack into a new lane

export default function EventTimeline({ events, setEvents, currentAge }) {
  const isDark = useDarkMode();
  const [armedPresetId, setArmedPresetId] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [trackRef, trackWidth] = useElementWidth();

  const minAge = currentAge;
  const maxAge = END_AGE;
  const span = Math.max(1, maxAge - minAge);
  const ageToPct = (age) => ((age - minAge) / span) * 100;

  const handleTrackClick = (e) => {
    if (!armedPresetId) return;
    const preset = PRESET_BY_ID[armedPresetId];
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const age = Math.round(minAge + pct * span);
    const newEvent = createEventFromPreset(preset, Math.max(minAge, age));
    setEvents([...events, newEvent]);
    setArmedPresetId(null);
    setSelectedEventId(newEvent.id);
  };

  const sorted = [...events].sort((a, b) => a.age - b.age);
  const laneOf = {};
  const laneLastAge = [];
  const minSeparationAge = span * MIN_LANE_GAP_FRACTION;
  sorted.forEach((ev) => {
    let lane = 0;
    while (laneLastAge[lane] !== undefined && ev.age - laneLastAge[lane] < minSeparationAge) lane++;
    laneLastAge[lane] = ev.age;
    laneOf[ev.id] = lane;
  });
  const laneCount = Math.max(1, laneLastAge.length);

  const updateEvent = (id, patch) => setEvents(events.map((ev) => (ev.id === id ? { ...ev, ...patch } : ev)));
  const removeEvent = (id) => {
    setEvents(events.filter((ev) => ev.id !== id));
    if (selectedEventId === id) setSelectedEventId(null);
  };

  const selectedEvent = events.find((e) => e.id === selectedEventId);
  const selectedPreset = selectedEvent ? PRESET_BY_ID[selectedEvent.presetId] : null;

  const ageTicks = [];
  for (let a = minAge; a <= maxAge; a += 5) ageTicks.push(a);

  return (
    <div>
      <div className="flex flex-wrap gap-x-6 gap-y-3 mb-4">
        {Object.values(CATEGORIES).map((cat) => (
          <div key={cat.id}>
            <div
              className="text-xs font-medium mb-1.5"
              style={{ color: pick(EVENT_CATEGORY_COLORS[cat.id], isDark) }}
            >
              {cat.label}
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {PRESETS.filter((p) => p.category === cat.id).map((preset) => {
                const armed = armedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => setArmedPresetId(armed ? null : preset.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-sm transition-colors ${
                      armed
                        ? 'ring-2 ring-offset-1 ring-blue-500 border-blue-500 dark:ring-offset-slate-900'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span aria-hidden="true">{preset.emoji}</span>
                    <span className="text-slate-700 dark:text-slate-200">{preset.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {armedPresetId ? (
        <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">
          Click the timeline below to drop "{PRESET_BY_ID[armedPresetId].label}" at that age.
        </p>
      ) : (
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">
          Pick a card above, then click the timeline to drop it at an age. Click a dropped event to edit or remove it.
        </p>
      )}

      <div
        ref={trackRef}
        onClick={handleTrackClick}
        className={`relative rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 ${
          armedPresetId ? 'cursor-crosshair' : ''
        }`}
        style={{ height: 34 + laneCount * 34 + 24 }}
      >
        {ageTicks.map((tickAge) => (
          <span
            key={tickAge}
            className="absolute bottom-1 text-[10px] text-slate-400 dark:text-slate-500"
            style={{ left: `${ageToPct(tickAge)}%`, transform: 'translateX(-50%)' }}
          >
            {tickAge}
          </span>
        ))}
        <div className="absolute inset-x-0 bottom-6 h-px bg-slate-200 dark:bg-slate-700" />

        {trackWidth > 0 &&
          sorted.map((ev) => {
            const preset = PRESET_BY_ID[ev.presetId];
            const color = pick(EVENT_CATEGORY_COLORS[ev.category], isDark);
            const lane = laneOf[ev.id];
            return (
              <button
                key={ev.id}
                onClick={(e) => {
                  if (armedPresetId) return; // let the click through to the track while a tool is armed
                  e.stopPropagation();
                  setSelectedEventId(ev.id === selectedEventId ? null : ev.id);
                }}
                className="absolute flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium shadow-sm whitespace-nowrap"
                style={{
                  left: `${ageToPct(ev.age)}%`,
                  top: 6 + lane * 30,
                  transform: 'translateX(-50%)',
                  background: color,
                  color: 'white',
                  outline: selectedEventId === ev.id ? '2px solid white' : 'none',
                  outlineOffset: selectedEventId === ev.id ? '-3px' : '0',
                  pointerEvents: armedPresetId ? 'none' : 'auto',
                }}
              >
                <span aria-hidden="true">{preset?.emoji}</span>
                <span>{ev.label}</span>
              </button>
            );
          })}
      </div>

      {selectedEvent && selectedPreset && (
        <div className="mt-3 rounded-lg border border-slate-200 dark:border-slate-700 p-3">
          <div className="flex items-center justify-between mb-3 gap-2">
            <div className="flex items-center gap-2 flex-1">
              <span aria-hidden="true">{selectedPreset.emoji}</span>
              <input
                type="text"
                value={selectedEvent.label}
                onChange={(e) => updateEvent(selectedEvent.id, { label: e.target.value })}
                className="text-sm font-medium bg-transparent outline-none flex-1 text-slate-800 dark:text-slate-100"
              />
            </div>
            <button
              onClick={() => removeEvent(selectedEvent.id)}
              className="text-xs font-medium text-slate-400 hover:text-[#d03b3b]"
            >
              Remove
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <label className="block">
              <span className="block text-slate-400 dark:text-slate-500 mb-1">Age</span>
              <input
                type="number"
                value={selectedEvent.age}
                onChange={(e) => updateEvent(selectedEvent.id, { age: Number(e.target.value) })}
                className={inputClass}
              />
            </label>
            {selectedPreset.fields.map((field) => (
              <label key={field} className="block">
                <span className="block text-slate-400 dark:text-slate-500 mb-1">{FIELD_META[field].label}</span>
                <input
                  type="number"
                  value={selectedEvent[field]}
                  onChange={(e) => updateEvent(selectedEvent.id, { [field]: Number(e.target.value) })}
                  className={inputClass}
                />
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
