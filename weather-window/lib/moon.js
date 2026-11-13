import { getMoonIllumination, getMoonPosition } from "suncalc";

const phaseNames = [
  "New moon", "Waxing crescent", "First quarter", "Waxing gibbous",
  "Full moon", "Waning gibbous", "Last quarter", "Waning crescent",
];

export function moonAppearance(date, place, checkHorizon) {
  const { fraction, phase, angle } = getMoonIllumination(date);
  const position = place && getMoonPosition(date, place.latitude, place.longitude);
  const waxing = phase < 0.5;
  // SunCalc measures the bright limb anticlockwise from vertical. Canvas starts at right.
  const rotation = position ? -(90 + angle - position.parallacticAngle) * Math.PI / 180
    : waxing ? 0 : Math.PI;
  const aboveHorizon = !position || position.altitude > 0;

  return {
    fraction,
    phase: phaseNames[Math.round(phase * 8) % 8],
    rotation,
    aboveHorizon,
    visible: fraction >= 0.01 && (!checkHorizon || aboveHorizon),
  };
}

export function drawMoon(context, x, y, radius, moon) {
  // Trace the lit limb, then the terminator. Its signed width sets the lit area.
  const terminator = 1 - 2 * moon.fraction;
  context.save();
  context.translate(x, y);
  context.rotate(moon.rotation);
  context.beginPath();
  context.arc(0, 0, radius, -Math.PI / 2, Math.PI / 2);
  context.ellipse(0, 0, Math.abs(terminator) * radius, radius, 0, Math.PI / 2, -Math.PI / 2, terminator > 0);
  context.closePath();
  context.fillStyle = "#eeeeee";
  context.fill();
  context.restore();
}
