export function choicePool(options, favorNew = false) {
  const keys = Object.keys(options);
  if (favorNew) keys.sort((a, b) => options[a].order - options[b].order);
  let total = 0;
  return keys.map((key, index) => {
    const start = total;
    const weight = favorNew && keys.length > 1 ? 1 + 2 * index / (keys.length - 1) : 1;
    total += weight;
    return { key, weight, start, end: total };
  });
}

export function pickFrom(pool, roll) {
  const last = pool.at(-1);
  return pool.find(({ end }) => roll * last.end < end)?.key ?? last.key;
}

export function rollAgain(pool, previous, random = Math.random()) {
  const alternatives = pool.filter(({ key }) => key !== previous);
  if (!alternatives.length) return 0;
  let point = random * alternatives.reduce((total, { weight }) => total + weight, 0);
  const next = alternatives.find(({ weight }) => {
    point -= weight;
    return point < 0;
  }) ?? alternatives.at(-1);
  return (next.start + next.end) / (2 * pool.at(-1).end);
}
