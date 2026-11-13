import { createHash } from 'node:crypto';
import { fleet } from './fleet.mjs';
import { expansionScreens } from './expansion.mjs';

export const screenNames = [
  'boarding_pass', 'departure_board', 'system_status', 'mission_brief',
  'docking_clearance', 'signal_intercept', 'surface_survey',
];

const destinations = [
  ['EUR', 'Europa Landing'], ['KBA', 'Kuiper Alpha'], ['MAR', 'Mars Colony'],
  ['ZMB', 'Zvezda Moonbase'], ['NTK', 'New Tokyo'], ['ALP', 'Alpha Centauri'],
  ['VEG', 'Vega Outpost'], ['SIR', 'Sirius Platform'], ['TIT', 'Titan Research'],
  ['ENC', 'Enceladus Lab'], ['CAL', 'Callisto Mining'],
];
const systemNames = ['LIFE SUPPORT', 'PROPULSION', 'NAVIGATION', 'COMMUNICATION', 'POWER SYSTEMS', 'HULL INTEGRITY'];
const boardModes = [
  { title: 'DEPARTURES', place: 'DESTINATION', time: 'DEPARTING', statuses: ['ON TIME', 'BOARDING', 'ON TIME', 'DELAYED', 'FINAL CALL'] },
  { title: 'ARRIVALS', place: 'ORIGIN', time: 'ARRIVING', statuses: ['ON TIME', 'LANDED', 'ON TIME', 'DELAYED', 'AT GATE'] },
  { title: 'TRANSFERS', place: 'CONNECTION', time: 'DEPARTING', statuses: ['ON TIME', 'CONNECTING', 'ON TIME', 'GATE CHANGE', 'FINAL CALL'] },
];
const temperatureProfiles = {
  STEADY: [0, 2, 1, 3, 1],
  WARMUP: [-16, -12, -7, 3, 15],
  COOLDOWN: [17, 10, 3, -1, -5],
  CYCLING: [-8, 10, -8, 10, -8],
  SURGE: [-5, -2, 21, 9, 14],
  RECOVERY: [16, 21, 8, 3, 0],
};
const objectives = ['ESTABLISH RESEARCH OUTPOST', 'SURVEY THE OUTER MOONS', 'MAP ASTEROID BELT SECTOR 7', 'RESUPPLY EUROPA LANDING'];
const pad = value => String(value).padStart(2, '0');

function shipForDay(day) {
  // Use each ship once in a shuffled cycle. Changing the cycle seed keeps
  // the lineup varied while retries on the same date select the same ship.
  const cycle = Math.floor(day / fleet.length);
  const order = createHash('sha256').update(`fleet:${cycle}`).digest();
  const index = ((day % fleet.length) + fleet.length) % fleet.length;
  return fleet.map((ship, position) => ({ ship, rank: order[position] }))
    .sort((left, right) => left.rank - right.rank)[index].ship;
}

export function telemetry(date) {
  const stamp = date.toISOString();
  const clock = stamp.slice(11, 19);
  return { clock, stamp: stamp.slice(0, 19).replace('T', ' '), millis: stamp.slice(20, 23) };
}

function systemStatus(bytes, date) {
  const condition = bytes[16] % 12;
  const suspect = bytes[17] % systemNames.length;
  const auxiliary = (suspect + 1 + bytes[18] % (systemNames.length - 1)) % systemNames.length;
  const systems = systemNames.map((name, index) => {
    const sample = bytes[index + 19];
    let value = 80 + sample % 21;
    if (condition >= 7 && index === suspect) value = condition >= 10 ? 23 + sample % 25 : 51 + sample % 24;
    if (condition >= 10 && index === auxiliary) value = 53 + sample % 23;
    return { name, value, status: value < 50 ? 'CRITICAL' : value < 80 ? 'WARNING' : 'ONLINE', segments: Math.round(value / 10) };
  });
  const warnings = systems.filter(system => system.status !== 'ONLINE').sort((a, b) => a.value - b.value);
  const profile = Object.keys(temperatureProfiles)[condition >= 10 ? 4 + bytes[26] % 2 : bytes[26] % 4];
  const anchors = temperatureProfiles[profile];
  const base = 265 + bytes[28] % 28;
  const temperatures = Array.from({ length: 38 }, (_, index) => {
    const position = index * (anchors.length - 1) / 37;
    const left = Math.floor(position);
    const trend = anchors[left] + ((anchors[left + 1] ?? anchors[left]) - anchors[left]) * (position - left);
    return Math.round(base + trend + bytes[(index + 7) % 32] % 5 - 2);
  });
  const radiation = Array.from({ length: 12 }, (_, index) =>
    5 + bytes[(index + 8) % 32] % (condition >= 10 ? 43 : 24));
  return {
    systemStatus: condition >= 10 ? 'CRITICAL' : warnings.length ? 'CAUTION' : 'NOMINAL',
    systems, radiation,
    alerts: [
      ...(warnings.length ? warnings.map(system => `${system.name}: ${system.status}`) : ['ALL SYSTEMS NOMINAL']),
      'NEXT DIAGNOSTIC: 15:00 UTC',
    ],
    ...telemetry(date),
    dose: (radiation.at(-1) / 100).toFixed(2),
    temperature_profile: profile,
    temperature: temperatures.at(-1),
    temperature_trace: temperatures.map((value, index) => `${index * 10},${60 - Math.round((value - 240) * 0.67)}`).join(' '),
  };
}

export function terminalScreens(date) {
  const day = date.toISOString().slice(0, 10);
  const dayNumber = Math.floor(date.getTime() / 86_400_000);
  const bytes = createHash('sha256').update('terminal:' + day).digest();
  const ship = shipForDay(dayNumber);
  const objectiveIndex = bytes[24] % objectives.length;
  const mode = boardModes[((dayNumber % boardModes.length) + boardModes.length) % boardModes.length];
  const roster = destinations.map(([code, name], index) => ({ code, name, flight: 1100 + index * 37, rank: bytes[index] }))
    .sort((left, right) => left.rank - right.rank).slice(0, 5);
  const departures = roster.map(({ code, name, flight }, index) => {
    const minute = 360 + index * 90 + bytes[index + 1] % 90;
    return {
      code, name, flight, time: `${pad(Math.floor(minute / 60))}:${pad(minute % 60)}`,
      gate: 'ABCDE'[index] + pad(1 + bytes[index + 6] % 24),
      status: mode.statuses[bytes[index + 11] % mode.statuses.length],
    };
  });
  const risk = bytes[29] % 3;
  const fuel = 49 + bytes[28] % 52;
  const gauges = [
    { label: 'FUEL', value: fuel },
    { label: 'O2', value: 69 + bytes[2] % 32 },
    { label: 'POWER', value: 57 + bytes[4] % 44 },
    { label: 'HULL', value: 100 - bytes[5] % (10 + risk * 13) },
  ];
  return {
    rotation: screenNames[((dayNumber % screenNames.length) + screenNames.length) % screenNames.length],
    departure_board: {
      title: mode.title, place_heading: mode.place, time_heading: mode.time,
      subtitle: 'KÁRMÁN SPACELINES', destinations: departures,
      telemetry: { ...telemetry(date), temp: `-${160 + bytes[22] % 90}°C`, coordinates: 'R004 P028 Y144' },
    },
    system_status: systemStatus(bytes, date),
    mission_brief: {
      ship,
      gauges,
      missionCode: 'OPERATION ' + ['STARDUST', 'HORIZON', 'NOVA', 'PHOENIX'][bytes[23] % 4],
      details: {
        objective: objectives[objectiveIndex], duration: `${60 + bytes[25]} SOLS`,
        crew: `${3 + bytes[26] % 8} SPECIALISTS`, cargo: `${30 + bytes[27] % 90} METRIC TONS`,
        fuel: `${fuel}% CAPACITY`, risk: ['LOW', 'MODERATE', 'HIGH'][risk],
      },
    },
    ...expansionScreens(bytes, ship, [1, 3, 2, 0][objectiveIndex]),
  };
}
