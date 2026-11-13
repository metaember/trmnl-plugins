const columns = 84;
const rows = 54;
const mapWidth = 560;
const mapHeight = 350;

const gaussian = (distance, width) => Math.exp(-((distance / width) ** 2));
const contourBudget = 3420;
const features = [
  ['ICE RIDGE', 'FRACTURE ZONE', 'PRESSURE DOMES'],
  ['CRATER RIM', 'TWIN IMPACTS', 'CRATER CHAIN'],
  ['CANYON EDGE', 'TABLELAND', 'BRANCHING GULLIES'],
  ['DUNE FIELD', 'DUNE BASINS', 'CROSS DUNES'],
];

function heightfield(world, seed, variant) {
  let state = Math.imul(seed + 1, 0x9e3779b1) >>> 0;
  const sample = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
  const phase = sample() * 2 * Math.PI;
  const angle = sample() * 2 * Math.PI;
  const shiftX = (sample() - 0.5) * 0.21;
  const shiftY = (sample() - 0.5) * 0.21;
  const scale = 0.88 + 0.28 * sample();
  const strike = 0.9 + 0.4 * sample();
  const bendStrength = 0.06 + 0.05 * sample();
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return (u, v) => {
    const east = c * (u - 0.5) - s * (v - 0.5);
    const north = s * (u - 0.5) + c * (v - 0.5);
    const x = scale * east + shiftX + bendStrength * Math.sin(5 * north + phase);
    const y = scale * north + shiftY + bendStrength * Math.sin(6 * east - phase);
    const wave = Math.sin(9 * x + 7 * y + phase);
    const detail = 0.023 * Math.sin(35 * x - 20 * y + phase)
      + 0.016 * Math.cos(49 * y + 17 * x - phase)
      + 0.011 * Math.sin(61 * x + 56 * y + 2 * phase)
      + 0.008 * Math.sin(85 * y - 38 * x + phase);
    const hill = (cx, cy, wx, wy) => gaussian(x - cx, wx) * gaussian(y - cy, wy);

    if (world === 0) {
      const bend = y + 0.57 * strike * x + 0.08 * Math.sin(11 * x + phase);
      if (variant === 1) {
        return -0.91 * gaussian(bend, 0.075) - 0.57 * gaussian(y - 0.77 * x - 0.17, 0.065)
          + 0.38 * hill(-0.25, 0.20, 0.28, 0.17) + 0.19 * wave + detail;
      }
      if (variant === 2) {
        return 0.95 * hill(-0.22, 0.06, 0.25, 0.20) + 0.83 * hill(0.22, -0.16, 0.24, 0.18)
          + 0.66 * hill(0.19, 0.32, 0.16, 0.24) - 0.26 * gaussian(bend, 0.065) + 0.17 * wave + detail;
      }
      const ridge = gaussian(bend, 0.115) * (0.92 + 0.14 * Math.cos(16 * x - phase));
      const fault = gaussian(bend - 0.16 - 0.037 * wave, 0.046);
      const spur = gaussian(y - 0.21 + 0.30 * x, 0.20) * gaussian(x - 0.29, 0.21);
      return ridge - 0.32 * fault + 0.45 * spur + 0.16 * wave + 0.25 * y + detail;
    }

    if (world === 1) {
      const impact = (cx, cy, size) => {
        const dx = x - cx;
        const dy = (y - cy) * 0.82;
        const radius = Math.hypot(dx, dy * strike) / size;
        const rim = 1 + 0.045 * Math.sin(Math.atan2(dy, dx) * 6 + phase);
        return 0.47 * gaussian(radius - rim, 0.13) - 0.74 * gaussian(radius, 0.67);
      };
      if (variant === 1) return impact(-0.19, 0.10, 0.26) + 0.88 * impact(0.24, -0.12, 0.25) + 0.24 * x + detail;
      if (variant === 2) {
        return 0.81 * impact(-0.32, -0.17, 0.16) + impact(-0.08, -0.02, 0.19)
          + 0.85 * impact(0.14, 0.09, 0.14) + 0.69 * impact(0.35, 0.25, 0.16) - 0.19 * y + detail;
      }
      return impact(-0.08, 0.02, 0.27 + 0.022 * Math.sin(phase))
        + 0.69 * impact(0.28, -0.27, 0.14)
        + 0.37 * impact(-0.35, 0.34, 0.12)
        + 0.20 * x + 0.07 * wave + detail;
    }

    if (world === 2) {
      const valley = y - 0.30 * strike * x - 0.13 * Math.sin(8 * x + phase);
      const branch = y + 0.57 * x - 0.13 - 0.045 * Math.sin(14 * x - phase);
      if (variant === 1) {
        return 0.94 * Math.tanh(2.7 * hill(-0.17, 0.03, 0.32, 0.24))
          + 0.67 * Math.tanh(2.9 * hill(0.30, 0.24, 0.20, 0.19)) - 0.27 * gaussian(branch, 0.09) + 0.20 * y + detail;
      }
      if (variant === 2) {
        const fork = y - 0.03 - 0.75 * Math.abs(x + 0.07) - 0.04 * Math.sin(13 * x + phase);
        return -0.93 * gaussian(fork, 0.087) - 0.64 * gaussian(valley + 0.23, 0.08)
          - 0.38 * gaussian(branch, 0.065) + 0.24 * wave + detail;
      }
      const ravine = gaussian(valley, 0.12) + 0.37 * gaussian(branch, 0.055) * gaussian(x - 0.26, 0.23);
      const mesa = gaussian(x + 0.26, 0.19) * gaussian(y - 0.27, 0.19);
      return -ravine + 0.37 * mesa + 0.25 * Math.sin(7 * y - phase) + 0.24 * x + detail;
    }

    const warp = 1.3 * Math.sin(7 * x + 4 * y + phase) + 0.45 * Math.sin(15 * x - phase);
    const dunes = Math.sin(30 * y + 19 * x + warp);
    if (variant === 1) return 0.43 * dunes - 0.82 * hill(0.03, 0.03, 0.38, 0.29) + 0.25 * wave + detail;
    if (variant === 2) {
      const crosswind = Math.sin(27 * x - 21 * y + warp);
      return (0.49 + 0.12 * wave) * dunes + 0.38 * crosswind + 0.14 * wave + detail;
    }
    return (0.63 + 0.19 * Math.cos(8 * x + phase)) * dunes + 0.27 * wave + 0.32 * x + detail;
  };
}

// Marching squares. Name crossings by their grid edge, so adjacent cells
// share endpoints without matching rounded floating point coordinates.
function isolines(field, threshold) {
  const graph = new Map();
  const point = new Map();
  const edge = (a, b) => {
    const key = Math.min(a, b) + ':' + Math.max(a, b);
    if (!point.has(key)) {
      const t = (threshold - field[a]) / (field[b] - field[a]);
      const ax = a % (columns + 1);
      const ay = Math.floor(a / (columns + 1));
      const bx = b % (columns + 1);
      const by = Math.floor(b / (columns + 1));
      point.set(key, [(ax + (bx - ax) * t) * mapWidth / columns, (ay + (by - ay) * t) * mapHeight / rows]);
      graph.set(key, new Set());
    }
    return key;
  };
  const join = (a, b) => {
    graph.get(a).add(b);
    graph.get(b).add(a);
  };

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < columns; x++) {
      const top = y * (columns + 1) + x;
      const bottom = top + columns + 1;
      const cell = [top, top + 1, bottom + 1, bottom];
      const hits = [];
      for (let i = 0; i < 4; i++) {
        const a = cell[i];
        const b = cell[(i + 1) % 4];
        if ((field[a] > threshold) !== (field[b] > threshold)) hits.push(edge(a, b));
      }
      if (hits.length === 2) join(...hits);
      if (hits.length === 4) {
        const center = cell.reduce((sum, index) => sum + field[index], 0) / 4;
        if ((center > threshold) === (field[cell[0]] > threshold)) {
          join(hits[0], hits[1]);
          join(hits[2], hits[3]);
        } else {
          join(hits[0], hits[3]);
          join(hits[1], hits[2]);
        }
      }
    }
  }

  const paths = [];
  const trace = start => {
    const line = [point.get(start)];
    let current = start;
    while (graph.get(current).size) {
      const next = graph.get(current).values().next().value;
      graph.get(current).delete(next);
      graph.get(next).delete(current);
      current = next;
      line.push(point.get(current));
    }
    if (line.length >= 5) paths.push({ line, closed: current === start });
  };
  for (const [key, edges] of graph) if (edges.size === 1) trace(key);
  for (const [key, edges] of graph) if (edges.size) trace(key);
  return paths;
}

function simplify(line, tolerance) {
  const first = line[0];
  const last = line.at(-1);
  const dx = last[0] - first[0];
  const dy = last[1] - first[1];
  const length = dx * dx + dy * dy;
  let greatest = tolerance * tolerance;
  let split = 0;
  for (let i = 1; i < line.length - 1; i++) {
    const [x, y] = line[i];
    const t = length ? Math.min(1, Math.max(0, ((x - first[0]) * dx + (y - first[1]) * dy) / length)) : 0;
    const distance = (x - first[0] - t * dx) ** 2 + (y - first[1] - t * dy) ** 2;
    if (distance > greatest) {
      greatest = distance;
      split = i;
    }
  }
  if (!split) return [first, last];
  return [...simplify(line.slice(0, split + 1), tolerance).slice(0, -1),
    ...simplify(line.slice(split), tolerance)];
}

function svgPaths(paths, tolerance, compact = false) {
  return paths.map(({ line, closed }) => {
    // Even control coordinates give integer midpoints. The next quadratic
    // can then reuse the reflected control point through SVG's smooth command.
    const step = compact ? 2 : 1;
    const points = simplify(line, tolerance)
      .map(([x, y]) => [step * Math.round(x / step), step * Math.round(y / step)]);
    if (closed && points.length < 4) return '';
    const vertices = closed ? points.slice(0, -1) : points;
    if (points.length < 3) {
      return 'M' + vertices.map(p => p.join(' ')).join(' ') + (closed ? 'Z' : '');
    }
    const midpoint = (a, b) => [Math.round((a[0] + b[0]) / 2), Math.round((a[1] + b[1]) / 2)];
    let current = closed ? midpoint(vertices.at(-1), vertices[0]) : vertices[0];
    let result = 'M' + current.join(' ') + 'q';
    const steps = closed ? vertices : vertices.slice(1, -1);
    for (const [index, control] of steps.entries()) {
      const next = vertices[(index + (closed ? 1 : 2)) % vertices.length];
      const end = midpoint(control, next);
      const destination = [end[0] - current[0], end[1] - current[1]];
      if (!compact || index === 0) {
        result += [control[0] - current[0], control[1] - current[1], ...destination].join(' ') + ' ';
      } else {
        if (index === 1) result = result.trimEnd() + 't';
        result += destination.join(' ') + ' ';
      }
      current = end;
    }
    return result.trimEnd().replace(/ (?=-)/g, '') + (closed ? 'Z' : 'L' + vertices.at(-1).join(' '));
  }).join('');
}

function shadeRegion(path, minArea, minWidth) {
  if (!path.closed) return false;
  let twiceArea = 0;
  let perimeter = 0;
  for (let i = 1; i < path.line.length; i++) {
    const [x, y] = path.line[i];
    const [px, py] = path.line[i - 1];
    twiceArea += px * y - x * py;
    perimeter += Math.hypot(x - px, y - py);
  }
  const area = Math.abs(twiceArea) / 2;
  return area >= minArea && 2 * area >= minWidth * perimeter;
}

function contourLength({ line }) {
  let length = 0;
  for (let i = 1; i < line.length; i++) {
    length += Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1]);
  }
  return length;
}

function reliefBands(field, range) {
  const stride = columns + 1;
  const shade = field.map((_, index) => {
    const x = index % stride;
    const y = Math.floor(index / stride);
    // Close the clipped shade regions at the map boundary.
    if (x === 0 || x === columns || y === 0 || y === rows) return 0;
    const dx = (field[index + 1] - field[index - 1]) * columns / mapWidth;
    const dy = (field[index + stride] - field[index - stride]) * rows / mapHeight;
    // Diffuse lighting from the upper left, with exaggerated vertical scale
    // so gentle slopes still read on the small map.
    const gx = 30 * dx / range;
    const gy = 30 * dy / range;
    const illumination = (0.65 + 0.54 * (gx + gy)) / Math.hypot(gx, gy, 1);
    return Math.max(0, 0.65 - illumination);
  });
  // Soften isolated peaks in the lighting field before extracting the bands.
  // The elevation field and its contours keep their original detail.
  const smoothed = shade.map((value, i) => {
    const x = i % stride;
    const y = Math.floor(i / stride);
    if (x === 0 || x === columns || y === 0 || y === rows) return 0;
    return (4 * value + shade[i - 1] + shade[i + 1] + shade[i - stride] + shade[i + stride]) / 8;
  });
  // A long contour can still enclose very little ink. Reject both tiny
  // islands and thin slivers by projected area and effective width.
  return [[0.12, 1000, 8], [0.28, 600, 7]].map(([threshold, minArea, minWidth]) =>
    isolines(smoothed, threshold).filter(path => shadeRegion(path, minArea, minWidth)));
}

export function surveyTerrain(world, seed, relief, sites) {
  const variant = (seed >> 3) % features[world].length;
  const height = heightfield(world, seed, variant);
  const points = Array.from({ length: (columns + 1) * (rows + 1) }, (_, index) =>
    [index % (columns + 1) / columns, Math.floor(index / (columns + 1)) / rows]);
  const field = points.map(([x, y]) => height(x, y));
  const min = Math.min(...field);
  const range = Math.max(...field) - min;
  const interval = Math.max(1, Math.round(relief / 14));
  const levels = Array.from({ length: Math.ceil(relief / interval) - 1 }, (_, level) =>
    isolines(field, min + range * (level + 1) * interval / relief)
      .map(path => ({ ...path, length: contourLength(path) })));

  const bands = reliefBands(field, range);
  const shading = bands.map(paths => {
    let band = '';
    // Keep the outline of each retained region. Coarsening busy shade bands
    // further can bridge a bend and fill land on the wrong side of a ridge.
    for (const region of paths.sort((a, b) => b.line.length - a.line.length)) {
      const outline = svgPaths([region], 4);
      if (band.length + outline.length <= 560) band += outline;
    }
    return band;
  });
  const elevations = sites.map(({ x, y }) =>
    Math.round(relief * (height(x / mapWidth, y / mapHeight) - min) / range));

  // Give every elevation its longest line first, then spend the remaining
  // payload on the largest secondary features without flattening the curves.
  const budget = contourBudget - shading.join('').length;
  for (let tolerance = 2.2; ; tolerance *= 1.25) {
    const candidates = levels.map(paths => paths.filter(path => path.length >= 12)
      .sort((a, b) => b.length - a.length)
      .map(path => ({ length: path.length, svg: svgPaths([path], tolerance, true) }))
      .filter(path => path.svg));
    const contours = candidates.map(paths => paths[0]?.svg ?? '');
    let remaining = budget - contours.join('').length;
    if (remaining < 0) continue;
    const extra = candidates.flatMap((paths, level) =>
      paths.slice(1).map(path => ({ ...path, level }))).sort((a, b) => b.length - a.length);
    for (const { svg, level } of extra) {
      if (svg.length > remaining) continue;
      contours[level] += svg;
      remaining -= svg.length;
    }
    return { feature: features[world][variant], contours, shading, interval, elevations };
  }
}
