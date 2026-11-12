import { surveyTerrain } from './terrain.mjs';

const worlds = [
  { name: 'EUROPA', port: 'EUROPA LANDING', relief: 240 },
  { name: 'LUNA', port: 'LUNA CITY', relief: 620 },
  { name: 'MARS', port: 'MARS COLONY', relief: 480 },
  { name: 'TITAN', port: 'TITAN RESEARCH', relief: 160 },
];
const berthSlots = [1, 2, 4, 5, 7, 8, 10, 11];
const receivers = [
  { kind: 'BURST', frequency: '1420.406', sources: ['UNKNOWN', 'DEEP FIELD', 'NIGHT RELAY'] },
  { kind: 'PULSE TRAIN', frequency: '1665.402', sources: ['RELAY 04', 'PULSAR PSR-19', 'KEPLER ARRAY'] },
  { kind: 'CHIRP', frequency: '1612.231', sources: ['TITAN RADAR', 'ICE SHELF PROBE', 'LUNA TELEMETRY'] },
  { kind: 'CARRIER', frequency: '1720.530', sources: ['KÁRMÁN BEACON', 'PORT CONTROL', 'EUROPA UPLINK'] },
  { kind: 'QUIET SCAN', frequency: '1424.200', sources: ['NO SOURCE', 'BACKGROUND'] },
  { kind: 'DISTRESS', frequency: '121.500', sources: ['DISTRESS BEACON'], distress: true },
];
const pad = value => String(value).padStart(2, '0');

function signalTrace(bytes, marker, kind) {
  let noiseSeed = bytes.readUInt32LE(24);
  const width = 28 + bytes[10] % 22;
  const carrier = 4 + bytes[12] % 6;
  return Array.from({ length: 126 }, (_, index) => {
    const x = index * 4;
    const offset = x - marker;
    noiseSeed = (Math.imul(noiseSeed, 1664525) + 1013904223) >>> 0;
    const noise = (noiseSeed >>> 27) / 3 - 5;
    let wave = 0;
    switch (kind) {
      case 'BURST':
        wave = 98 * Math.exp(-((offset / width) ** 2)) * Math.sin(offset / carrier);
        break;
      case 'PULSE TRAIN':
        wave = 79 * Math.exp(-((Math.sin(offset / width) / 0.22) ** 2)) * Math.cos(x / carrier);
        break;
      case 'CHIRP':
        wave = 81 * Math.exp(-((offset / 140) ** 4)) * Math.sin(x / 18 + x * x / (2100 + width * 31));
        break;
      case 'CARRIER':
        wave = (30 + 23 * Math.sin(x / (width + 4))) * Math.sin(x / carrier);
        break;
      case 'DISTRESS': {
        // Three short, three long, three short pulses with a gap between letters.
        const units = Math.floor((x + bytes[12] % 12) / 13);
        const keyed = [0, 2, 4, 8, 9, 10, 12, 13, 14, 16, 17, 18, 22, 24, 26].includes(units);
        wave = keyed ? 83 * Math.cos(x / 5) : 0;
        break;
      }
      case 'QUIET SCAN':
        wave = 5 * Math.sin(x / 18);
        break;
    }
    const y = 120 + Math.round(wave + noise);
    return `${x},${y}`;
  }).join(' ');
}

export function expansionScreens(bytes, ship, worldIndex) {
  const world = worlds[worldIndex];
  const slot = berthSlots[bytes[3] % berthSlots.length];
  const marker = 208 + bytes[7] % 89;
  const receiver = receivers[bytes[6] % receivers.length];
  const repeat = 18 + bytes[8] % 77;
  const site_x = 222 + bytes[13] % 86;
  const site_y = 138 + bytes[14] % 65;
  const siteB = bytes[16] % 3 === 0 ? { x: 368 + bytes[17] % 67, y: 132 + bytes[18] % 77 } : null;
  const relief = world.relief + (bytes[11] % 9 - 4) * 10;

  return {
    docking_clearance: {
      berth: `${'ABCD'[bytes[4] % 4]}-${pad(slot + 1)}`,
      destination: world.port,
      clearance: bytes[5] % 7 === 0 ? 'HOLD FOR TRAFFIC' : 'CLEARED FOR APPROACH',
      vessel: ship.model,
      side: slot < 6 ? 'STARBOARD SIDE' : 'PORT SIDE',
      bearing: String(slot * 30).padStart(3, '0') + '°',
      berth_angle: slot * 30,
    },
    signal_intercept: {
      frequency: receiver.frequency,
      kind: receiver.kind,
      source: receiver.sources[bytes[19] % receiver.sources.length],
      distress: receiver.distress ?? false,
      repeat_interval: `${pad(Math.floor(repeat / 60))}:${pad(repeat % 60)}`,
      trace: signalTrace(bytes, marker, receiver.kind),
      marker,
    },
    surface_survey: {
      world: world.name,
      sector: pad(1 + bytes[9] % 24),
      relief,
      status: 'SCAN COMPLETE',
      site_x,
      site_y,
      ...(siteB ? { site_b: siteB } : {}),
      ...surveyTerrain(worldIndex, bytes[15], relief, [
        { x: site_x, y: site_y }, ...(siteB ? [siteB] : []),
      ]),
    },
  };
}
