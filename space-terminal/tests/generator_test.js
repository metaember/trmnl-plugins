import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { barcodeBars, boardingPass, screenPayload, terminalPayload } from '../generator.mjs';
import { screenNames } from '../screens.mjs';
import { fleet } from '../fleet.mjs';

test('the bundled TRMNL transform selects each preset and falls back to boarding pass', () => {
  const bundle = readFileSync(new URL('../src/transform.js', import.meta.url), 'utf8');
  const date = new Date('2026-11-14T00:00:00Z');
  const payload = terminalPayload(date);
  const presets = [...screenNames, 'rotation', 'unknown', undefined];
  const inputs = presets.map(terminal_screen => ({ trmnl: { plugin_settings: { custom_fields_values: { terminal_screen } } } }));
  const execution = spawnSync(process.execPath, ['-e', `
    const inputs = JSON.parse(require('node:fs').readFileSync(0, 'utf8'));
    const NativeDate = Date;
    globalThis.Date = class extends NativeDate {
      constructor(...args) { super(...(args.length ? args : [${date.getTime()}])); }
    };
    ${bundle}
    console.log(JSON.stringify(inputs.map(run)));
  `], { input: JSON.stringify([...inputs, {}]), encoding: 'utf8' });
  assert.equal(execution.status, 0, execution.stderr);
  const expected = [...presets, undefined].map(preset => screenPayload(payload, preset) ?? screenPayload(payload, 'boarding_pass'));
  assert.deepEqual(JSON.parse(execution.stdout), expected);
});

test('a fleet cycle visits every distinct hull once and is stable during the day', () => {
  const epochDay = 20_000 - 20_000 % fleet.length;
  const ships = new Set();
  for (let index = 0; index < fleet.length; index++) {
    const date = new Date((epochDay + index) * 86_400_000);
    const ship = terminalPayload(date).mission_brief.ship;
    assert.deepEqual(ship, terminalPayload(new Date(date.getTime() + 43_200_000)).mission_brief.ship);
    ships.add(ship.model);
  }
  assert.equal(ships.size, fleet.length);
  assert.equal(new Set(fleet.map(ship => ship.hull)).size, fleet.length);
});

test('seven successive dates rotate through the complete terminal', () => {
  const rotation = new Set();
  for (let day = 1; day <= screenNames.length; day++) {
    const payload = terminalPayload(new Date(Date.UTC(2026, 10, day)));
    rotation.add(payload.rotation);
    assert.equal(payload.departure_board.destinations.length, 5);
    assert.equal(new Set(payload.departure_board.destinations.map(row => row.code)).size, 5);
    const times = payload.departure_board.destinations.map(row => row.time);
    assert.deepEqual(times, [...times].sort());
    assert.equal(payload.system_status.systems.length, 6);
    assert.equal(payload.system_status.radiation.length, 12);
    assert.equal(Object.keys(payload.mission_brief.details).length, 6);
    const active = screenPayload(payload, 'rotation');
    assert.equal(active.active_screen, payload.rotation);
    for (const screen of screenNames) {
      const response = screenPayload(payload, screen);
      const key = screen === 'boarding_pass' ? 'ticket' : screen;
      assert.deepEqual(response, { active_screen: screen, [key]: payload[key] });
      assert.ok(Buffer.byteLength(JSON.stringify(response)) < 4096, screen);
    }
  }
  assert.deepEqual([...rotation].sort(), [...screenNames].sort());
});

test('new screens use the mission vessel, stable signals, and bounded map markers', () => {
  const date = new Date('2026-11-11T00:00:00Z');
  const payload = terminalPayload(date);
  const { docking_clearance: dock, signal_intercept: signal, surface_survey: survey } = payload;
  assert.equal(dock.vessel, payload.mission_brief.ship.model);
  assert.equal(dock.berth_angle % 30, 0);
  assert.match(dock.destination, new RegExp(`^${survey.world} `));
  assert.deepEqual(signal, terminalPayload(new Date('2026-11-11T23:59:59Z')).signal_intercept);
  assert.equal(signal.trace.split(' ').length, 126);
  assert.equal(survey.contours.length, 7);
  assert.equal(survey.shading.length, 2);
  assert.match(survey.shading[0], /^M.*Z$/);
  assert.ok(survey.interval > 0);
  assert.ok(survey.site_x > 0 && survey.site_x < 560 && survey.site_y > 0 && survey.site_y < 350);
  assert.equal(screenPayload(payload, 'unknown'), null);
});

test('daily telemetry, receiver modes, and terrain vary within the polling budget', () => {
  const boards = new Set();
  const rosters = new Set();
  const states = new Set();
  const temperatures = new Set();
  const gauges = new Set();
  const signals = new Set();
  const sources = new Set();
  const features = new Map();
  for (let day = 1; day <= 90; day++) {
    const payload = terminalPayload(new Date(Date.UTC(2026, 10, day)));
    const { departure_board: board, system_status: status, mission_brief: brief,
      signal_intercept: signal, surface_survey: survey } = payload;
    boards.add(board.title);
    rosters.add(board.destinations.map(row => row.code).join());
    states.add(status.systemStatus);
    temperatures.add(status.temperature_profile);
    assert.equal(Number(status.dose), status.radiation.at(-1) / 100);
    assert.equal(brief.details.fuel, `${brief.gauges[0].value}% CAPACITY`);
    assert.ok(brief.gauges.every(({ value }) => value >= 0 && value <= 100));
    gauges.add(brief.gauges.slice(1).map(({ value }) => value).join());
    signals.add(signal.kind);
    sources.add(signal.source);
    if (signal.distress) assert.equal(signal.source, 'DISTRESS BEACON');
    assert.ok(signal.trace.split(' ').every(point => {
      const y = Number(point.split(',')[1]);
      return y >= 0 && y <= 240;
    }));
    if (!features.has(survey.world)) features.set(survey.world, new Set());
    features.get(survey.world).add(survey.feature);
    assert.ok(Buffer.byteLength(JSON.stringify(screenPayload(payload, 'surface_survey'))) < 4096);
  }
  assert.deepEqual([...boards].sort(), ['ARRIVALS', 'DEPARTURES', 'TRANSFERS']);
  assert.ok(rosters.size > 60);
  assert.deepEqual([...states].sort(), ['CAUTION', 'CRITICAL', 'NOMINAL']);
  assert.equal(temperatures.size, 6);
  assert.ok(gauges.size > 60);
  assert.equal(signals.size, 6);
  assert.ok(sources.size >= 12);
  assert.deepEqual([...features.values()].map(values => values.size), [3, 3, 3, 3]);
});

test('survey worlds produce distinct deterministic maps within the polling budget', () => {
  const samples = [
    ['2026-11-12', 'EUROPA'], ['2026-11-15', 'LUNA'],
    ['2026-11-16', 'MARS'], ['2026-11-13', 'TITAN'],
  ];
  const maps = new Set();
  for (const [day, world] of samples) {
    const preview = time => screenPayload(terminalPayload(new Date(day + time)), 'surface_survey');
    const payload = preview('T00:00:00Z');
    const { surface_survey: survey } = payload;
    assert.equal(survey.world, world);
    assert.deepEqual(payload, preview('T23:59:59Z'));
    assert.ok(Buffer.byteLength(JSON.stringify(payload)) < 4096);
    assert.ok(survey.contours.every(path => path.startsWith('M')));
    assert.equal(survey.shading.length, 2);
    assert.match(survey.shading[0], /^M.*Z$/);
    assert.ok(survey.shading.every(path => !path || /^M.*Z$/.test(path)));
    if (world === 'EUROPA') assert.equal(survey.shading[0].split('M').length - 1, 1);
    assert.equal(survey.elevations.length, survey.site_b ? 2 : 1);
    assert.ok(survey.elevations.every(elevation => elevation >= 0 && elevation <= survey.relief));
    if (survey.site_b) {
      assert.ok(survey.site_b.x > survey.site_x + 60);
      assert.ok(survey.site_b.x + 104 < 560 && survey.site_b.y > 39);
    }
    maps.add(survey.contours.join(''));
  }
  assert.equal(maps.size, samples.length);
  assert.ok(terminalPayload(new Date('2026-11-12')).surface_survey.site_b);
  assert.equal(terminalPayload(new Date('2026-11-16')).surface_survey.site_b, undefined);
});

test('a ticket is stable within its UTC date and rotates on the next date', () => {
  const morning = boardingPass(new Date('2026-11-11T00:00:00Z'));
  assert.deepEqual(morning, boardingPass(new Date('2026-11-11T23:59:59Z')));
  const tomorrow = boardingPass(new Date('2026-11-12T00:00:00Z'));
  assert.notEqual(morning.flight, tomorrow.flight);
  assert.notDeepEqual(morning.barcode_bars, tomorrow.barcode_bars);
});

test('a year of tickets has coherent routes, times, and in-bounds bars', () => {
  const minutes = (clock) => {
    const [hours, mins] = clock.split(':').map(Number);
    return hours * 60 + mins;
  };
  for (let day = 1; day <= 365; day++) {
    const ticket = boardingPass(new Date(Date.UTC(2026, 0, day)));
    assert.notEqual(ticket.origin_code, ticket.destination_code);
    assert.equal(minutes(ticket.departure) - minutes(ticket.boarding), 30);
    assert.equal(ticket.barcode,
      ticket.origin_code + ticket.destination_code + ticket.flight.slice(2) + ticket.seat);
    assert.deepEqual(ticket.barcode_bars, barcodeBars(ticket.barcode, 560));
    let previousEnd = -1;
    for (const { x, width } of ticket.barcode_bars) {
      assert.ok(x > previousEnd && width > 0 && x + width <= 560, ticket.barcode);
      previousEnd = x + width;
    }
  }
});

test('the original Europa ticket retains its barcode rhythm', () => {
  const bars = barcodeBars('KS170120267A12B', 560);
  assert.equal(bars.length, 52);
  assert.deepEqual(bars.slice(0, 3), [{ x: 0, width: 5 }, { x: 8, width: 3 }, { x: 16, width: 8 }]);
  assert.deepEqual(bars.at(-1), { x: 546, width: 5 });
});
