var spaceTerminal = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // serverless.mjs
  var serverless_exports = {};
  __export(serverless_exports, {
    run: () => run
  });

  // generator.mjs
  var import_node_crypto2 = __require("node:crypto");

  // screens.mjs
  var import_node_crypto = __require("node:crypto");

  // fleet.mjs
  var fleet = [
    {
      model: "KS-1701",
      name: "KESTREL",
      role: "COURIER",
      hull: "M10 48 43 38 63 36 86 20 116 20 145 39 183 43 195 50 183 57 145 61 116 80 86 80 63 64 43 62 10 52Z M112 16H159L168 25 159 33H132Z M132 67H159L168 75 159 84H112Z",
      etch: "M20 50H177 M46 40 58 50 46 60 M67 37 88 26H111L124 39 M67 63 88 74H111L124 61 M146 23H157 M146 77H157 M150 47V53 M157 47V53 M164 47V53"
    },
    {
      model: "HA-2407",
      name: "MULE",
      role: "HEAVY FREIGHTER",
      hull: "M8 37 26 29H129L155 36H181L194 43V57L181 64H155L129 71H26L8 63Z M41 13H111L121 21V27H35V20Z M35 73H121V79L111 87H41L35 80Z M139 19H178L190 28 178 34H154Z M154 66H178L190 72 178 81H139Z",
      etch: "M17 48H29V52H17 M39 34V66 M61 34V66 M83 34V66 M105 34V66 M127 35V65 M146 42V58 M158 49H182 M45 20H105 M45 80H105"
    },
    {
      model: "SV-1138",
      name: "PARALLAX",
      role: "SURVEY SHIP",
      hull: "M14 45 32 38H61L74 31H105L117 43H172L188 34H195V66H188L172 57H117L105 69H74L61 62H32L14 55Z M68 14H132V26H68Z M68 74H132V86H68Z M92 24H105V38H92Z M92 62H105V76H92Z",
      etch: "M22 50H49 M57 44V56 M71 41H99V59H71 M78 43V57 M86 43V57 M119 50H178 M75 19H125 M75 81H125"
    },
    {
      model: "DS-2245",
      name: "CORMORANT",
      role: "LANDER",
      hull: "M9 50 52 33 73 30 108 9H151L137 32 168 32 188 43V57L168 68H137L151 91H108L73 70 52 67Z M164 20H179L189 28 179 34H157Z M157 66H179L189 72 179 80H164Z",
      etch: "M21 50 57 42H84V58H57Z M85 34 110 17H136 M85 66 110 83H136 M99 38H162L177 50 162 62H99 M116 41V59 M131 41V59 M147 41V59"
    },
    {
      model: "PC-0412",
      name: "LANTERN",
      role: "PASSENGER LINER",
      hull: "M7 50Q22 28 51 25H119L151 37H185L195 45V55L185 63H151L119 75H51Q22 72 7 50Z M113 16H162L177 27 162 34 136 29Z M136 71 162 66 177 73 162 84H113Z",
      etch: "M16 50H180 M34 37H115L143 45 M34 63H115L143 55 M48 40V45 M61 40V45 M74 40V45 M87 40V45 M100 40V45 M48 55V60 M61 55V60 M74 55V60 M87 55V60 M100 55V60 M153 23H165 M153 77H165"
    },
    {
      model: "AT-0804",
      name: "ANVIL",
      role: "ORBITAL TUG",
      hull: "M31 39H62L75 31H152L165 40H185L195 47V53L185 60H165L152 69H75L62 61H31L11 73H6V27H11Z M57 13H151L171 24 151 29H75Z M75 71H151L171 76 151 87H57Z",
      etch: "M13 33V67 M27 45V55 M41 44H60V56H41Z M77 38H143V62H77Z M96 41V59 M117 41V59 M155 43V57 M69 20H149 M69 80H149"
    },
    {
      model: "MR-4001",
      name: "SUNDOG",
      role: "MAPPING PROBE",
      hull: "M12 50 29 32H51L63 41H117L129 34H155L163 43H187L195 50 187 57H163L155 66H129L117 59H63L51 68H29Z M74 8H110V35H74Z M74 65H110V92H74Z M87 33H97V44H87Z M87 56H97V67H87Z",
      etch: "M28 50H54 M41 38V62 M69 50H119 M131 41H152V59H131Z M80 13V30 M87 13V30 M94 13V30 M101 13V30 M80 70V87 M87 70V87 M94 70V87 M101 70V87"
    },
    {
      model: "RV-2619",
      name: "CRESCENT",
      role: "RESCUE CUTTER",
      hull: "M10 50 58 41 86 21 121 12H167L191 25 174 32H144L125 40 119 50 125 60 144 68H174L191 75 167 88H121L86 79 58 59Z M68 45H166L181 50 166 55H68Z",
      etch: "M24 50H58 M66 48 93 28 126 19H164 M66 52 93 72 126 81H164 M97 36 114 31 120 35 M97 64 114 69 120 65 M145 25H160 M145 75H160"
    },
    {
      model: "TR-7730",
      name: "SPOOL",
      role: "DEEP-SPACE RELAY",
      hull: "M9 47 34 40H63L75 33H138L153 40H177L194 46V54L177 60H153L138 67H75L63 60H34L9 53Z M79 11H101V89H79Z M109 15H126V85H109Z M65 18H134V25H65Z M65 75H134V82H65Z",
      etch: "M18 50H59 M70 45V55 M87 15V37 M87 63V85 M116 20V37 M116 63V80 M78 50H145 M148 43V57 M157 48H182"
    },
    {
      model: "IC-9086",
      name: "ICEFIN",
      role: "OUTER-SYSTEM RUNNER",
      hull: "M8 50 37 40 71 41 119 9 169 16 149 29 176 36 195 48V52L176 64 149 71 169 84 119 91 71 59 37 60Z",
      etch: "M22 50H177 M39 45 59 50 39 55 M76 43 122 17 150 21 M76 57 122 83 150 79 M105 40 128 31 157 36 M105 60 128 69 157 64 M133 44V56 M146 44V56 M159 44V56"
    },
    {
      model: "CL-0516",
      name: "NURSERY",
      role: "HABITAT TENDER",
      hull: "M8 45 34 38H67L79 29H136L154 38H177L195 47V53L177 62H154L136 71H79L67 62H34L8 55Z M40 16H132L142 23 132 30H40L30 23Z M40 70H132L142 77 132 84H40L30 77Z",
      etch: "M17 50H51 M45 23H123 M45 77H123 M73 43H133V57H73Z M88 44V56 M103 44V56 M118 44V56 M146 45V55 M156 50H181"
    },
    {
      model: "XR-1605",
      name: "FARADAY",
      role: "EXPLORATION SHIP",
      hull: "M7 50 35 37H67L91 29H145L157 37H180L195 50 180 63H157L145 71H91L67 63H35Z M65 13H148L167 24 155 30 141 24H79L69 36H56Z M56 64H69L79 76H141L155 70 167 76 148 87H65Z",
      etch: "M17 50 38 42H52V58H38Z M63 50H169 M73 43 94 36H142 M73 57 94 64H142 M99 38V62 M113 38V62 M127 38V62 M143 42V58 M159 44H177 M159 56H177"
    }
  ];

  // terrain.mjs
  var columns = 84;
  var rows = 54;
  var mapWidth = 560;
  var mapHeight = 350;
  var gaussian = (distance, width) => Math.exp(-((distance / width) ** 2));
  var contourBudget = 3420;
  var features = [
    ["ICE RIDGE", "FRACTURE ZONE", "PRESSURE DOMES"],
    ["CRATER RIM", "TWIN IMPACTS", "CRATER CHAIN"],
    ["CANYON EDGE", "TABLELAND", "BRANCHING GULLIES"],
    ["DUNE FIELD", "DUNE BASINS", "CROSS DUNES"]
  ];
  function heightfield(world, seed, variant) {
    let state = Math.imul(seed + 1, 2654435761) >>> 0;
    const sample = () => {
      state = Math.imul(state, 1664525) + 1013904223 >>> 0;
      return state / 4294967296;
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
      const detail = 0.023 * Math.sin(35 * x - 20 * y + phase) + 0.016 * Math.cos(49 * y + 17 * x - phase) + 0.011 * Math.sin(61 * x + 56 * y + 2 * phase) + 8e-3 * Math.sin(85 * y - 38 * x + phase);
      const hill = (cx, cy, wx, wy) => gaussian(x - cx, wx) * gaussian(y - cy, wy);
      if (world === 0) {
        const bend = y + 0.57 * strike * x + 0.08 * Math.sin(11 * x + phase);
        if (variant === 1) {
          return -0.91 * gaussian(bend, 0.075) - 0.57 * gaussian(y - 0.77 * x - 0.17, 0.065) + 0.38 * hill(-0.25, 0.2, 0.28, 0.17) + 0.19 * wave + detail;
        }
        if (variant === 2) {
          return 0.95 * hill(-0.22, 0.06, 0.25, 0.2) + 0.83 * hill(0.22, -0.16, 0.24, 0.18) + 0.66 * hill(0.19, 0.32, 0.16, 0.24) - 0.26 * gaussian(bend, 0.065) + 0.17 * wave + detail;
        }
        const ridge = gaussian(bend, 0.115) * (0.92 + 0.14 * Math.cos(16 * x - phase));
        const fault = gaussian(bend - 0.16 - 0.037 * wave, 0.046);
        const spur = gaussian(y - 0.21 + 0.3 * x, 0.2) * gaussian(x - 0.29, 0.21);
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
        if (variant === 1) return impact(-0.19, 0.1, 0.26) + 0.88 * impact(0.24, -0.12, 0.25) + 0.24 * x + detail;
        if (variant === 2) {
          return 0.81 * impact(-0.32, -0.17, 0.16) + impact(-0.08, -0.02, 0.19) + 0.85 * impact(0.14, 0.09, 0.14) + 0.69 * impact(0.35, 0.25, 0.16) - 0.19 * y + detail;
        }
        return impact(-0.08, 0.02, 0.27 + 0.022 * Math.sin(phase)) + 0.69 * impact(0.28, -0.27, 0.14) + 0.37 * impact(-0.35, 0.34, 0.12) + 0.2 * x + 0.07 * wave + detail;
      }
      if (world === 2) {
        const valley = y - 0.3 * strike * x - 0.13 * Math.sin(8 * x + phase);
        const branch = y + 0.57 * x - 0.13 - 0.045 * Math.sin(14 * x - phase);
        if (variant === 1) {
          return 0.94 * Math.tanh(2.7 * hill(-0.17, 0.03, 0.32, 0.24)) + 0.67 * Math.tanh(2.9 * hill(0.3, 0.24, 0.2, 0.19)) - 0.27 * gaussian(branch, 0.09) + 0.2 * y + detail;
        }
        if (variant === 2) {
          const fork = y - 0.03 - 0.75 * Math.abs(x + 0.07) - 0.04 * Math.sin(13 * x + phase);
          return -0.93 * gaussian(fork, 0.087) - 0.64 * gaussian(valley + 0.23, 0.08) - 0.38 * gaussian(branch, 0.065) + 0.24 * wave + detail;
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
  function isolines(field, threshold) {
    const graph = /* @__PURE__ */ new Map();
    const point = /* @__PURE__ */ new Map();
    const edge = (a, b) => {
      const key = Math.min(a, b) + ":" + Math.max(a, b);
      if (!point.has(key)) {
        const t = (threshold - field[a]) / (field[b] - field[a]);
        const ax = a % (columns + 1);
        const ay = Math.floor(a / (columns + 1));
        const bx = b % (columns + 1);
        const by = Math.floor(b / (columns + 1));
        point.set(key, [(ax + (bx - ax) * t) * mapWidth / columns, (ay + (by - ay) * t) * mapHeight / rows]);
        graph.set(key, /* @__PURE__ */ new Set());
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
          if (field[a] > threshold !== field[b] > threshold) hits.push(edge(a, b));
        }
        if (hits.length === 2) join(...hits);
        if (hits.length === 4) {
          const center = cell.reduce((sum, index) => sum + field[index], 0) / 4;
          if (center > threshold === field[cell[0]] > threshold) {
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
    const trace = (start) => {
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
    return [
      ...simplify(line.slice(0, split + 1), tolerance).slice(0, -1),
      ...simplify(line.slice(split), tolerance)
    ];
  }
  function svgPaths(paths, tolerance, compact = false) {
    return paths.map(({ line, closed }) => {
      const step = compact ? 2 : 1;
      const points = simplify(line, tolerance).map(([x, y]) => [step * Math.round(x / step), step * Math.round(y / step)]);
      if (closed && points.length < 4) return "";
      const vertices = closed ? points.slice(0, -1) : points;
      if (points.length < 3) {
        return "M" + vertices.map((p) => p.join(" ")).join(" ") + (closed ? "Z" : "");
      }
      const midpoint = (a, b) => [Math.round((a[0] + b[0]) / 2), Math.round((a[1] + b[1]) / 2)];
      let current = closed ? midpoint(vertices.at(-1), vertices[0]) : vertices[0];
      let result = "M" + current.join(" ") + "q";
      const steps = closed ? vertices : vertices.slice(1, -1);
      for (const [index, control] of steps.entries()) {
        const next = vertices[(index + (closed ? 1 : 2)) % vertices.length];
        const end = midpoint(control, next);
        const destination = [end[0] - current[0], end[1] - current[1]];
        if (!compact || index === 0) {
          result += [control[0] - current[0], control[1] - current[1], ...destination].join(" ") + " ";
        } else {
          if (index === 1) result = result.trimEnd() + "t";
          result += destination.join(" ") + " ";
        }
        current = end;
      }
      return result.trimEnd().replace(/ (?=-)/g, "") + (closed ? "Z" : "L" + vertices.at(-1).join(" "));
    }).join("");
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
      if (x === 0 || x === columns || y === 0 || y === rows) return 0;
      const dx = (field[index + 1] - field[index - 1]) * columns / mapWidth;
      const dy = (field[index + stride] - field[index - stride]) * rows / mapHeight;
      const gx = 30 * dx / range;
      const gy = 30 * dy / range;
      const illumination = (0.65 + 0.54 * (gx + gy)) / Math.hypot(gx, gy, 1);
      return Math.max(0, 0.65 - illumination);
    });
    const smoothed = shade.map((value, i) => {
      const x = i % stride;
      const y = Math.floor(i / stride);
      if (x === 0 || x === columns || y === 0 || y === rows) return 0;
      return (4 * value + shade[i - 1] + shade[i + 1] + shade[i - stride] + shade[i + stride]) / 8;
    });
    return [[0.12, 1e3, 8], [0.28, 600, 7]].map(([threshold, minArea, minWidth]) => isolines(smoothed, threshold).filter((path) => shadeRegion(path, minArea, minWidth)));
  }
  function surveyTerrain(world, seed, relief, sites) {
    const variant = (seed >> 3) % features[world].length;
    const height = heightfield(world, seed, variant);
    const points = Array.from({ length: (columns + 1) * (rows + 1) }, (_, index) => [index % (columns + 1) / columns, Math.floor(index / (columns + 1)) / rows]);
    const field = points.map(([x, y]) => height(x, y));
    const min = Math.min(...field);
    const range = Math.max(...field) - min;
    const interval = Math.max(1, Math.round(relief / 14));
    const levels = Array.from({ length: Math.ceil(relief / interval) - 1 }, (_, level) => isolines(field, min + range * (level + 1) * interval / relief).map((path) => ({ ...path, length: contourLength(path) })));
    const bands = reliefBands(field, range);
    const shading = bands.map((paths) => {
      let band = "";
      for (const region of paths.sort((a, b) => b.line.length - a.line.length)) {
        const outline = svgPaths([region], 4);
        if (band.length + outline.length <= 560) band += outline;
      }
      return band;
    });
    const elevations = sites.map(({ x, y }) => Math.round(relief * (height(x / mapWidth, y / mapHeight) - min) / range));
    const budget = contourBudget - shading.join("").length;
    for (let tolerance = 2.2; ; tolerance *= 1.25) {
      const candidates = levels.map((paths) => paths.filter((path) => path.length >= 12).sort((a, b) => b.length - a.length).map((path) => ({ length: path.length, svg: svgPaths([path], tolerance, true) })).filter((path) => path.svg));
      const contours = candidates.map((paths) => paths[0]?.svg ?? "");
      let remaining = budget - contours.join("").length;
      if (remaining < 0) continue;
      const extra = candidates.flatMap((paths, level) => paths.slice(1).map((path) => ({ ...path, level }))).sort((a, b) => b.length - a.length);
      for (const { svg, level } of extra) {
        if (svg.length > remaining) continue;
        contours[level] += svg;
        remaining -= svg.length;
      }
      return { feature: features[world][variant], contours, shading, interval, elevations };
    }
  }

  // expansion.mjs
  var worlds = [
    { name: "EUROPA", port: "EUROPA LANDING", relief: 240 },
    { name: "LUNA", port: "LUNA CITY", relief: 620 },
    { name: "MARS", port: "MARS COLONY", relief: 480 },
    { name: "TITAN", port: "TITAN RESEARCH", relief: 160 }
  ];
  var berthSlots = [1, 2, 4, 5, 7, 8, 10, 11];
  var receivers = [
    { kind: "BURST", frequency: "1420.406", sources: ["UNKNOWN", "DEEP FIELD", "NIGHT RELAY"] },
    { kind: "PULSE TRAIN", frequency: "1665.402", sources: ["RELAY 04", "PULSAR PSR-19", "KEPLER ARRAY"] },
    { kind: "CHIRP", frequency: "1612.231", sources: ["TITAN RADAR", "ICE SHELF PROBE", "LUNA TELEMETRY"] },
    { kind: "CARRIER", frequency: "1720.530", sources: ["K\xC1RM\xC1N BEACON", "PORT CONTROL", "EUROPA UPLINK"] },
    { kind: "QUIET SCAN", frequency: "1424.200", sources: ["NO SOURCE", "BACKGROUND"] },
    { kind: "DISTRESS", frequency: "121.500", sources: ["DISTRESS BEACON"], distress: true }
  ];
  var pad = (value) => String(value).padStart(2, "0");
  function signalTrace(bytes, marker, kind) {
    let noiseSeed = bytes.readUInt32LE(24);
    const width = 28 + bytes[10] % 22;
    const carrier = 4 + bytes[12] % 6;
    return Array.from({ length: 126 }, (_, index) => {
      const x = index * 4;
      const offset = x - marker;
      noiseSeed = Math.imul(noiseSeed, 1664525) + 1013904223 >>> 0;
      const noise = (noiseSeed >>> 27) / 3 - 5;
      let wave = 0;
      switch (kind) {
        case "BURST":
          wave = 98 * Math.exp(-((offset / width) ** 2)) * Math.sin(offset / carrier);
          break;
        case "PULSE TRAIN":
          wave = 79 * Math.exp(-((Math.sin(offset / width) / 0.22) ** 2)) * Math.cos(x / carrier);
          break;
        case "CHIRP":
          wave = 81 * Math.exp(-((offset / 140) ** 4)) * Math.sin(x / 18 + x * x / (2100 + width * 31));
          break;
        case "CARRIER":
          wave = (30 + 23 * Math.sin(x / (width + 4))) * Math.sin(x / carrier);
          break;
        case "DISTRESS": {
          const units = Math.floor((x + bytes[12] % 12) / 13);
          const keyed = [0, 2, 4, 8, 9, 10, 12, 13, 14, 16, 17, 18, 22, 24, 26].includes(units);
          wave = keyed ? 83 * Math.cos(x / 5) : 0;
          break;
        }
        case "QUIET SCAN":
          wave = 5 * Math.sin(x / 18);
          break;
      }
      const y = 120 + Math.round(wave + noise);
      return `${x},${y}`;
    }).join(" ");
  }
  function expansionScreens(bytes, ship, worldIndex) {
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
        berth: `${"ABCD"[bytes[4] % 4]}-${pad(slot + 1)}`,
        destination: world.port,
        clearance: bytes[5] % 7 === 0 ? "HOLD FOR TRAFFIC" : "CLEARED FOR APPROACH",
        vessel: ship.model,
        side: slot < 6 ? "STARBOARD SIDE" : "PORT SIDE",
        bearing: String(slot * 30).padStart(3, "0") + "\xB0",
        berth_angle: slot * 30
      },
      signal_intercept: {
        frequency: receiver.frequency,
        kind: receiver.kind,
        source: receiver.sources[bytes[19] % receiver.sources.length],
        distress: receiver.distress ?? false,
        repeat_interval: `${pad(Math.floor(repeat / 60))}:${pad(repeat % 60)}`,
        trace: signalTrace(bytes, marker, receiver.kind),
        marker
      },
      surface_survey: {
        world: world.name,
        sector: pad(1 + bytes[9] % 24),
        relief,
        status: "SCAN COMPLETE",
        site_x,
        site_y,
        ...siteB ? { site_b: siteB } : {},
        ...surveyTerrain(worldIndex, bytes[15], relief, [
          { x: site_x, y: site_y },
          ...siteB ? [siteB] : []
        ])
      }
    };
  }

  // screens.mjs
  var screenNames = [
    "boarding_pass",
    "departure_board",
    "system_status",
    "mission_brief",
    "docking_clearance",
    "signal_intercept",
    "surface_survey"
  ];
  var destinations = [
    ["EUR", "Europa Landing"],
    ["KBA", "Kuiper Alpha"],
    ["MAR", "Mars Colony"],
    ["ZMB", "Zvezda Moonbase"],
    ["NTK", "New Tokyo"],
    ["ALP", "Alpha Centauri"],
    ["VEG", "Vega Outpost"],
    ["SIR", "Sirius Platform"],
    ["TIT", "Titan Research"],
    ["ENC", "Enceladus Lab"],
    ["CAL", "Callisto Mining"]
  ];
  var systemNames = ["LIFE SUPPORT", "PROPULSION", "NAVIGATION", "COMMUNICATION", "POWER SYSTEMS", "HULL INTEGRITY"];
  var boardModes = [
    { title: "DEPARTURES", place: "DESTINATION", time: "DEPARTING", statuses: ["ON TIME", "BOARDING", "ON TIME", "DELAYED", "FINAL CALL"] },
    { title: "ARRIVALS", place: "ORIGIN", time: "ARRIVING", statuses: ["ON TIME", "LANDED", "ON TIME", "DELAYED", "AT GATE"] },
    { title: "TRANSFERS", place: "CONNECTION", time: "DEPARTING", statuses: ["ON TIME", "CONNECTING", "ON TIME", "GATE CHANGE", "FINAL CALL"] }
  ];
  var temperatureProfiles = {
    STEADY: [0, 2, 1, 3, 1],
    WARMUP: [-16, -12, -7, 3, 15],
    COOLDOWN: [17, 10, 3, -1, -5],
    CYCLING: [-8, 10, -8, 10, -8],
    SURGE: [-5, -2, 21, 9, 14],
    RECOVERY: [16, 21, 8, 3, 0]
  };
  var objectives = ["ESTABLISH RESEARCH OUTPOST", "SURVEY THE OUTER MOONS", "MAP ASTEROID BELT SECTOR 7", "RESUPPLY EUROPA LANDING"];
  var pad2 = (value) => String(value).padStart(2, "0");
  function shipForDay(day) {
    const cycle = Math.floor(day / fleet.length);
    const order = (0, import_node_crypto.createHash)("sha256").update(`fleet:${cycle}`).digest();
    const index = (day % fleet.length + fleet.length) % fleet.length;
    return fleet.map((ship, position) => ({ ship, rank: order[position] })).sort((left, right) => left.rank - right.rank)[index].ship;
  }
  function telemetry(date) {
    const stamp = date.toISOString();
    const clock2 = stamp.slice(11, 19);
    return { clock: clock2, stamp: stamp.slice(0, 19).replace("T", " "), millis: stamp.slice(20, 23) };
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
      return { name, value, status: value < 50 ? "CRITICAL" : value < 80 ? "WARNING" : "ONLINE", segments: Math.round(value / 10) };
    });
    const warnings = systems.filter((system) => system.status !== "ONLINE").sort((a, b) => a.value - b.value);
    const profile = Object.keys(temperatureProfiles)[condition >= 10 ? 4 + bytes[26] % 2 : bytes[26] % 4];
    const anchors = temperatureProfiles[profile];
    const base = 265 + bytes[28] % 28;
    const temperatures = Array.from({ length: 38 }, (_, index) => {
      const position = index * (anchors.length - 1) / 37;
      const left = Math.floor(position);
      const trend = anchors[left] + ((anchors[left + 1] ?? anchors[left]) - anchors[left]) * (position - left);
      return Math.round(base + trend + bytes[(index + 7) % 32] % 5 - 2);
    });
    const radiation = Array.from({ length: 12 }, (_, index) => 5 + bytes[(index + 8) % 32] % (condition >= 10 ? 43 : 24));
    return {
      systemStatus: condition >= 10 ? "CRITICAL" : warnings.length ? "CAUTION" : "NOMINAL",
      systems,
      radiation,
      alerts: [
        ...warnings.length ? warnings.map((system) => `${system.name}: ${system.status}`) : ["ALL SYSTEMS NOMINAL"],
        "NEXT DIAGNOSTIC: 15:00 UTC"
      ],
      ...telemetry(date),
      dose: (radiation.at(-1) / 100).toFixed(2),
      temperature_profile: profile,
      temperature: temperatures.at(-1),
      temperature_trace: temperatures.map((value, index) => `${index * 10},${60 - Math.round((value - 240) * 0.67)}`).join(" ")
    };
  }
  function terminalScreens(date) {
    const day = date.toISOString().slice(0, 10);
    const dayNumber = Math.floor(date.getTime() / 864e5);
    const bytes = (0, import_node_crypto.createHash)("sha256").update("terminal:" + day).digest();
    const ship = shipForDay(dayNumber);
    const objectiveIndex = bytes[24] % objectives.length;
    const mode = boardModes[(dayNumber % boardModes.length + boardModes.length) % boardModes.length];
    const roster = destinations.map(([code, name], index) => ({ code, name, flight: 1100 + index * 37, rank: bytes[index] })).sort((left, right) => left.rank - right.rank).slice(0, 5);
    const departures = roster.map(({ code, name, flight }, index) => {
      const minute = 360 + index * 90 + bytes[index + 1] % 90;
      return {
        code,
        name,
        flight,
        time: `${pad2(Math.floor(minute / 60))}:${pad2(minute % 60)}`,
        gate: "ABCDE"[index] + pad2(1 + bytes[index + 6] % 24),
        status: mode.statuses[bytes[index + 11] % mode.statuses.length]
      };
    });
    const risk = bytes[29] % 3;
    const fuel = 49 + bytes[28] % 52;
    const gauges = [
      { label: "FUEL", value: fuel },
      { label: "O2", value: 69 + bytes[2] % 32 },
      { label: "POWER", value: 57 + bytes[4] % 44 },
      { label: "HULL", value: 100 - bytes[5] % (10 + risk * 13) }
    ];
    return {
      rotation: screenNames[(dayNumber % screenNames.length + screenNames.length) % screenNames.length],
      departure_board: {
        title: mode.title,
        place_heading: mode.place,
        time_heading: mode.time,
        subtitle: "K\xC1RM\xC1N SPACELINES",
        destinations: departures,
        telemetry: { ...telemetry(date), temp: `-${160 + bytes[22] % 90}\xB0C`, coordinates: "R004 P028 Y144" }
      },
      system_status: systemStatus(bytes, date),
      mission_brief: {
        ship,
        gauges,
        missionCode: "OPERATION " + ["STARDUST", "HORIZON", "NOVA", "PHOENIX"][bytes[23] % 4],
        details: {
          objective: objectives[objectiveIndex],
          duration: `${60 + bytes[25]} SOLS`,
          crew: `${3 + bytes[26] % 8} SPECIALISTS`,
          cargo: `${30 + bytes[27] % 90} METRIC TONS`,
          fuel: `${fuel}% CAPACITY`,
          risk: ["LOW", "MODERATE", "HIGH"][risk]
        }
      },
      ...expansionScreens(bytes, ship, [1, 3, 2, 0][objectiveIndex])
    };
  }

  // generator.mjs
  var ports = Object.entries({
    EAR: "EARTH",
    MER: "MERCURY",
    VEN: "VENUS",
    MAR: "MARS",
    JUP: "JUPITER",
    SAT: "SATURN",
    URA: "URANUS",
    NEP: "NEPTUNE",
    LUN: "LUNA",
    EUR: "EUROPA",
    GAN: "GANYMEDE",
    TIT: "TITAN",
    ENC: "ENCELADUS",
    CAL: "CALLISTO",
    PHO: "PHOBOS",
    ALP: "ALPHA CENTAURI",
    PRO: "PROXIMA",
    VEG: "VEGA",
    SIR: "SIRIUS",
    ARC: "ARCTURUS",
    POL: "POLARIS",
    BET: "BETELGEUSE"
  });
  var passengers = [
    "E. KERMAN",
    "A. ARMSTRONG",
    "B. ALDRIN",
    "C. COLLINS",
    "V. TERESHKOVA",
    "Y. GAGARIN",
    "S. RIDE"
  ];
  function barcodeBars(code, width) {
    const runs = [2, 1, 1, 2, 3, 2];
    for (let i = 0; i < code.length; i++) {
      const seed = code.charCodeAt(i) * (i + 1);
      runs.push(
        (seed & 3) + 1,
        (seed >> 2 & 1) + 1,
        (seed >> 3 & 3) + 1,
        (seed >> 5 & 1) + 1,
        (seed >> 6 & 3) + 1,
        (seed >> 8 & 1) + 1
      );
    }
    runs.push(2, 3, 3, 1, 1, 1, 2);
    const total = runs.reduce((sum, run2) => sum + run2, 0);
    const rounded = runs.map((run2) => Math.max(1, Math.round(run2 * width / total)));
    const fit = Math.min(1, width / rounded.reduce((sum, run2) => sum + run2, 0));
    const bars = [];
    let cursor = 0;
    for (const [index, run2] of rounded.entries()) {
      const x = Math.round(cursor * fit);
      cursor += run2;
      if (index % 2 === 0) bars.push({ x, width: Math.round(cursor * fit) - x });
    }
    return bars;
  }
  function clock(minutes) {
    return [Math.floor(minutes / 60), minutes % 60].map((part) => String(part).padStart(2, "0")).join(":");
  }
  function boardingPass(date = /* @__PURE__ */ new Date()) {
    const day = date.toISOString().slice(0, 10);
    const random = (0, import_node_crypto2.createHash)("sha256").update(day).digest();
    const originIndex = random.readUInt16BE(0) % ports.length;
    const offset = 1 + random.readUInt16BE(2) % (ports.length - 1);
    const [originCode, origin] = ports[originIndex];
    const [destinationCode, destination] = ports[(originIndex + offset) % ports.length];
    const flightNumber = 1e3 + random.readUInt16BE(4) % 9e3;
    const gate = "ABCDEFGHIJKL"[random[6] % 12] + String(1 + random[7] % 30).padStart(2, "0");
    const seat = String(1 + random[8] % 30) + "ABCDEF"[random[9] % 6];
    const departure = 360 + random.readUInt16BE(10) % 1020;
    const barcode = `${originCode}${destinationCode}${flightNumber}${seat}`;
    return {
      carrier: "K\xC1RM\xC1N SPACELINES",
      document_type: "BOARDING PASS",
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
      cabin_class: "EXPLORER",
      barcode,
      barcode_bars: barcodeBars(barcode, 560)
    };
  }
  function terminalPayload(date = /* @__PURE__ */ new Date()) {
    return { ticket: boardingPass(date), ...terminalScreens(date) };
  }
  function screenPayload(payload, requested) {
    const active = requested === "rotation" ? payload.rotation : requested;
    if (!screenNames.includes(active)) return null;
    const key = active === "boarding_pass" ? "ticket" : active;
    return { active_screen: active, [key]: payload[key] };
  }

  // serverless.mjs
  function run(input) {
    const requested = input.trmnl?.plugin_settings?.custom_fields_values?.terminal_screen;
    const payload = terminalPayload();
    return screenPayload(payload, requested) ?? screenPayload(payload, "boarding_pass");
  }
  return __toCommonJS(serverless_exports);
})();
function run(input) { return spaceTerminal.run(input); }
