import { screenPayload, terminalPayload } from './generator.mjs';

export function run(input) {
  const requested = input.trmnl?.plugin_settings?.custom_fields_values?.terminal_screen;
  const payload = terminalPayload();
  return screenPayload(payload, requested) ?? screenPayload(payload, 'rotation');
}
