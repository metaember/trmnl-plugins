import { createHash } from 'node:crypto';
import { screenNames, terminalScreens } from './screens.mjs';

// Boarding-pass catalog from Space Terminal's RandomMissionProvider.
const ports = Object.entries({
  EAR: 'EARTH', MER: 'MERCURY', VEN: 'VENUS', MAR: 'MARS',
  JUP: 'JUPITER', SAT: 'SATURN', URA: 'URANUS', NEP: 'NEPTUNE',
  LUN: 'LUNA', EUR: 'EUROPA', GAN: 'GANYMEDE', TIT: 'TITAN',
  ENC: 'ENCELADUS', CAL: 'CALLISTO', PHO: 'PHOBOS',
  ALP: 'ALPHA CENTAURI', PRO: 'PROXIMA', VEG: 'VEGA', SIR: 'SIRIUS',
  ARC: 'ARCTURUS', POL: 'POLARIS', BET: 'BETELGEUSE',
});

const passengers = [
  'E. KERMAN', 'A. ARMSTRONG', 'B. ALDRIN', 'C. COLLINS',
  'V. TERESHKOVA', 'Y. GAGARIN', 'S. RIDE',
];

// Port of the Canvas renderer's decorative Code 128-style pattern.
export function barcodeBars(code, width) {
  const runs = [2, 1, 1, 2, 3, 2];
  for (let i = 0; i < code.length; i++) {
    const seed = code.charCodeAt(i) * (i + 1);
    runs.push(
      (seed & 3) + 1, ((seed >> 2) & 1) + 1, ((seed >> 3) & 3) + 1,
      ((seed >> 5) & 1) + 1, ((seed >> 6) & 3) + 1, ((seed >> 8) & 1) + 1,
    );
  }
  runs.push(2, 3, 3, 1, 1, 1, 2);
  const total = runs.reduce((sum, run) => sum + run, 0);
  const rounded = runs.map(run => Math.max(1, Math.round(run * width / total)));
  const fit = Math.min(1, width / rounded.reduce((sum, run) => sum + run, 0));
  const bars = [];
  let cursor = 0;
  for (const [index, run] of rounded.entries()) {
    const x = Math.round(cursor * fit);
    cursor += run;
    if (index % 2 === 0) bars.push({ x, width: Math.round(cursor * fit) - x });
  }
  return bars;
}

function clock(minutes) {
  return [Math.floor(minutes / 60), minutes % 60]
    .map(part => String(part).padStart(2, '0')).join(':');
}

export function boardingPass(date = new Date()) {
  const day = date.toISOString().slice(0, 10);
  const random = createHash('sha256').update(day).digest();
  const originIndex = random.readUInt16BE(0) % ports.length;
  const offset = 1 + random.readUInt16BE(2) % (ports.length - 1);
  const [originCode, origin] = ports[originIndex];
  const [destinationCode, destination] = ports[(originIndex + offset) % ports.length];
  const flightNumber = 1000 + random.readUInt16BE(4) % 9000;
  const gate = 'ABCDEFGHIJKL'[random[6] % 12] + String(1 + random[7] % 30).padStart(2, '0');
  const seat = String(1 + random[8] % 30) + 'ABCDEF'[random[9] % 6];
  const departure = 360 + random.readUInt16BE(10) % 1020;
  const barcode = `${originCode}${destinationCode}${flightNumber}${seat}`;

  return {
    carrier: 'KÁRMÁN SPACELINES',
    document_type: 'BOARDING PASS',
    passenger: passengers[random[12] % passengers.length],
    origin,
    origin_code: originCode,
    destination,
    destination_code: destinationCode,
    flight: `KS${flightNumber}`,
    gate,
    seat,
    departure: clock(departure),
    boarding: clock(departure - 30),
    cabin_class: 'EXPLORER',
    barcode,
    barcode_bars: barcodeBars(barcode, 560),
  };
}

export function terminalPayload(date = new Date()) {
  return { ticket: boardingPass(date), ...terminalScreens(date) };
}

export function screenPayload(payload, requested) {
  const active = requested === 'rotation' ? payload.rotation : requested;
  if (!screenNames.includes(active)) return null;
  const key = active === 'boarding_pass' ? 'ticket' : active;
  return { active_screen: active, [key]: payload[key] };
}
