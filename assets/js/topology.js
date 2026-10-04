// Draws the hero network diagram and animates traffic along its working links.
(() => {
  const svg = document.getElementById('topology');
  if (!svg) return;

  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    parent.appendChild(n);
    return n;
  };

  // A small campus network: WAN, edge routers, core pair, dual-homed access layer, endpoints.
  const nodes = {
    wan:   { x: 280, y: 34,  type: 'cloud',  name: 'Internet' },
    rtr1:  { x: 170, y: 124, type: 'router', name: 'edge-rtr-01' },
    rtr2:  { x: 390, y: 124, type: 'router', name: 'edge-rtr-02' },
    core1: { x: 170, y: 236, type: 'switch', name: 'core-sw-01', big: true },
    core2: { x: 390, y: 236, type: 'switch', name: 'core-sw-02', big: true },
    acc1:  { x: 64,  y: 350, type: 'switch', name: 'acc-sw-01' },
    acc2:  { x: 208, y: 350, type: 'switch', name: 'acc-sw-02' },
    acc3:  { x: 352, y: 350, type: 'switch', name: 'acc-sw-03', status: 'warn' },
    acc4:  { x: 496, y: 350, type: 'switch', name: 'acc-sw-04' },
    ap1:   { x: 64,  y: 456, type: 'ap',     name: 'ap-01' },
    srv1:  { x: 208, y: 456, type: 'server', name: 'esx-01' },
    srv2:  { x: 352, y: 456, type: 'server', name: 'esx-02' },
    ap2:   { x: 496, y: 456, type: 'ap',     name: 'ap-02' },
  };

  const links = [
    ['wan', 'rtr1'], ['wan', 'rtr2'],
    ['rtr1', 'core1'], ['rtr1', 'core2'], ['rtr2', 'core1'], ['rtr2', 'core2'],
    ['acc1', 'core1'], ['acc1', 'core2'], ['acc2', 'core1'], ['acc2', 'core2'],
    ['acc3', 'core1'], ['acc3', 'core2', 'down'], ['acc4', 'core1'], ['acc4', 'core2'],
    ['acc1', 'ap1'], ['acc2', 'srv1'], ['acc3', 'srv2'], ['acc4', 'ap2'],
  ];

  const defs = el('defs', {}, svg);
  const glow = el('filter', { id: 'glow', x: '-200%', y: '-200%', width: '500%', height: '500%' }, defs);
  el('feGaussianBlur', { stdDeviation: '2.5', result: 'blur' }, glow);
  const merge = el('feMerge', {}, glow);
  el('feMergeNode', { in: 'blur' }, merge);
  el('feMergeNode', { in: 'SourceGraphic' }, merge);

  const gLinks = el('g', {}, svg);
  const gPackets = el('g', {}, svg);
  const gNodes = el('g', {}, svg);

  const live = [];
  links.forEach(([a, b, state]) => {
    const A = nodes[a];
    const B = nodes[b];
    el('line', { x1: A.x, y1: A.y, x2: B.x, y2: B.y, class: state ? `link ${state}` : 'link' }, gLinks);
    if (!state) live.push([A, B]);
  });

  // Core interconnect: a doubled trunk with its speed label.
  const c1 = nodes.core1;
  const c2 = nodes.core2;
  [-3, 3].forEach((d) => {
    el('line', { x1: c1.x + 26, y1: c1.y + d, x2: c2.x - 26, y2: c2.y + d, class: 'link trunk' }, gLinks);
  });
  live.push([c1, c2]);
  el('text', { x: (c1.x + c2.x) / 2, y: c1.y - 10, class: 'speed' }, gLinks).textContent = '2×100G';

  // Device icons, loosely after the standard network diagram symbols.
  function drawNode(n) {
    const g = el('g', { transform: `translate(${n.x} ${n.y})`, class: n.type }, gNodes);
    let labelY = 30;
    let led = null;

    if (n.type === 'cloud') {
      el('path', { class: 'icon', d: 'M-30 10a12 12 0 0 1 2-23a16 16 0 0 1 29-7a13 13 0 0 1 24 7a11 11 0 0 1 3 23z' }, g);
      labelY = 28;
    } else if (n.type === 'router') {
      el('ellipse', { class: 'icon', cx: 0, cy: 0, rx: 19, ry: 13 }, g);
      el('path', { class: 'glyph', d: 'M-9-5-3-1M-9-5h4M-9-5v4M9 5 3 1M9 5h-4M9 5v-4M9-5 3-1M9-5h-4M9-5v4M-9 5-3 1M-9 5h4M-9 5v-4' }, g);
      led = [15, -10];
    } else if (n.type === 'switch') {
      const w = n.big ? 52 : 44;
      const h = n.big ? 26 : 22;
      const s = n.big ? 12 : 10;
      el('rect', { class: 'icon', x: -w / 2, y: -h / 2, width: w, height: h, rx: 4 }, g);
      el('path', { class: 'glyph', d: `M${-s} -4H${s}M${s - 4} -7L${s} -4L${s - 4} -1M${s} 4H${-s}M${-s + 4} 1L${-s} 4L${-s + 4} 7` }, g);
      led = [w / 2 - 2, -h / 2 + 2];
      labelY = h / 2 + 17;
    } else if (n.type === 'server') {
      el('rect', { class: 'icon', x: -12, y: -16, width: 24, height: 32, rx: 3 }, g);
      el('path', { class: 'glyph', d: 'M-6-8h12M-6-2h12M-6 4h6' }, g);
      led = [11, -15];
      labelY = 32;
    } else if (n.type === 'ap') {
      el('circle', { class: 'icon', cx: 0, cy: 4, r: 9 }, g);
      el('path', { class: 'glyph', d: 'M-9-8a13 13 0 0 1 18 0M-14-13a20 20 0 0 1 28 0' }, g);
      el('circle', { class: 'dot', cx: 0, cy: 4, r: 2 }, g);
    }

    if (led) {
      el('circle', { class: n.status === 'warn' ? 'led warn' : 'led', cx: led[0], cy: led[1], r: 4 }, g);
    }
    el('text', { x: 0, y: labelY, class: 'host' }, g).textContent = n.name;
  }
  Object.values(nodes).forEach(drawNode);

  // Traffic: packets travel along live links only.
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let packets = [];
  function spawn() {
    const [A, B] = live[Math.floor(Math.random() * live.length)];
    const forward = Math.random() > 0.5;
    packets.push({
      from: forward ? A : B,
      to: forward ? B : A,
      t: 0,
      speed: 0.006 + Math.random() * 0.008,
      dot: el('circle', { r: 2.6, class: 'packet' }, gPackets),
    });
  }

  function step() {
    if (Math.random() < 0.09 && packets.length < 12) spawn();
    packets = packets.filter((p) => {
      p.t += p.speed;
      if (p.t >= 1) {
        p.dot.remove();
        return false;
      }
      p.dot.setAttribute('cx', p.from.x + (p.to.x - p.from.x) * p.t);
      p.dot.setAttribute('cy', p.from.y + (p.to.y - p.from.y) * p.t);
      return true;
    });
  }

  // Pre-warm so the first frame already shows traffic.
  for (let i = 0; i < 300; i++) step();

  // requestAnimationFrame pauses in background tabs on its own.
  (function loop() {
    step();
    requestAnimationFrame(loop);
  })();
})();
