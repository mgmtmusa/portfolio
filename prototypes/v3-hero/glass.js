// Edge-refraction for a flat, thick, rounded glass pane.
// Builds a displacement map from the pane's own rounded rectangle: neutral in the centre,
// bending only the outer band. Applied with CSS `filter: url(#…)` to a copy of the content
// that sits inside the pane, so it works in Chromium, WebKit and Firefox alike.

/** Signed distance to a rounded rect centred at the origin (negative inside). */
function sdRoundRect(px, py, hw, hh, r) {
  const qx = Math.abs(px) - (hw - r);
  const qy = Math.abs(py) - (hh - r);
  const ox = Math.max(qx, 0), oy = Math.max(qy, 0);
  return Math.hypot(ox, oy) + Math.min(Math.max(qx, qy), 0) - r;
}

/**
 * @param {number} w pane width (CSS px)
 * @param {number} h pane height (CSS px)
 * @param {number} r corner radius
 * @param {number} band width of the bending rim (CSS px)
 * @param {boolean} outward sample from beyond the edge (compress) instead of inside (magnify)
 * @returns {string} PNG data URL. R = x offset, G = y offset, 128 = none.
 */
export function displacementMap(w, h, r, band = 16, outward = true) {
  const c = document.createElement('canvas');
  c.width = Math.round(w);
  c.height = Math.round(h);
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(c.width, c.height);
  const hw = c.width / 2, hh = c.height / 2;
  for (let y = 0; y < c.height; y++) {
    for (let x = 0; x < c.width; x++) {
      const px = x + 0.5 - hw, py = y + 0.5 - hh;
      const d = -sdRoundRect(px, py, hw, hh, r); // distance inside the edge
      let dx = 0, dy = 0;
      if (d >= 0 && d < band) {
        // inward normal from the SDF gradient
        const e = 0.5;
        const gx = sdRoundRect(px + e, py, hw, hh, r) - sdRoundRect(px - e, py, hw, hh, r);
        const gy = sdRoundRect(px, py + e, hw, hh, r) - sdRoundRect(px, py - e, hw, hh, r);
        const gl = Math.hypot(gx, gy) || 1;
        const t = 1 - d / band; // 0 at the inner edge of the rim, 1 at the glass edge
        const m = t * t * (3 - 2 * t); // smooth rise towards the edge, like a bevel
        // outward: the rim gathers what lies just beyond the edge and compresses it, like a slab edge.
        // Keep the filter scale under ~1.2 × band so the mapping never folds over itself.
        const dir = outward ? 1 : -1;
        dx = dir * (gx / gl) * m;
        dy = dir * (gy / gl) * m;
      }
      const i = (y * c.width + x) * 4;
      img.data[i] = Math.round(128 + dx * 127);
      img.data[i + 1] = Math.round(128 + dy * 127);
      img.data[i + 2] = 128;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c.toDataURL('image/png');
}

/** Creates (or updates) an SVG filter with the given id sized to one pane. */
export function ensureBendFilter(id, w, h, r, { band = 16, strength = 44 } = {}) {
  let svg = document.getElementById(`${id}-svg`);
  if (!svg) {
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = `${id}-svg`;
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.style.position = 'absolute';
    svg.innerHTML = `<defs><filter id="${id}" x="0" y="0" width="100%" height="100%" filterUnits="objectBoundingBox" primitiveUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feImage result="map" x="0" y="0" preserveAspectRatio="none"/>
      <feDisplacementMap in="SourceGraphic" in2="map" xChannelSelector="R" yChannelSelector="G"/>
    </filter></defs>`;
    document.body.appendChild(svg);
  }
  const img = svg.querySelector('feImage');
  img.setAttribute('width', String(Math.round(w)));
  img.setAttribute('height', String(Math.round(h)));
  const url = displacementMap(w, h, r, band);
  img.setAttribute('href', url);
  // WebKit only reads the XLink form on feImage.
  img.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', url);
  svg.querySelector('feDisplacementMap').setAttribute('scale', String(strength));
}
