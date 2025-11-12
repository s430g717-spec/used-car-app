const fs = require('fs');
const SvgPath = require('svgpath');

if (process.argv.length < 3) {
  console.error('Usage: node normalize-svg.js path/to/file.svg');
  process.exit(1);
}

const file = process.argv[2];
const svg = fs.readFileSync(file, 'utf8');

let vbMatch = svg.match(/viewBox=["']?([\d.\-]+)\s+([\d.\-]+)\s+([\d.\-]+)\s+([\d.\-]+)["']?/i);
let minX = 0, minY = 0, width = null, height = null;
if (vbMatch) {
  minX = parseFloat(vbMatch[1]);
  minY = parseFloat(vbMatch[2]);
  width = parseFloat(vbMatch[3]);
  height = parseFloat(vbMatch[4]);
} else {
  const wMatch = svg.match(/width=["']?([\d.]+)(px)?["']?/i);
  const hMatch = svg.match(/height=["']?([\d.]+)(px)?["']?/i);
  if (wMatch && hMatch) {
    width = parseFloat(wMatch[1]);
    height = parseFloat(hMatch[1]);
  } else {
    console.error('Cannot determine viewBox or width/height from SVG.');
    process.exit(1);
  }
}

const scaleX = 100 / width;
const scaleY = 100 / height;
const paths = [];
const pathRegex = /<path\b[^>]*\bd=["']([^"']+)["'][^>]*>/ig;
let m;
while ((m = pathRegex.exec(svg)) !== null) {
  const d = m[1];
  try {
    const transformed = new SvgPath(d)
      .translate(-minX, -minY)
      .scale(scaleX, scaleY)
      .abs()
      .toString();
    paths.push(transformed);
  } catch (e) {
    console.error('Failed to transform path:', e.message);
  }
}

const HOTSPOTS = [
  { id: 'front-bumper', label: 'Fバンパー', d: 'M33 10L67 10L67 16L33 16Z', labelPos: { x: 50, y: 13 } },
  { id: 'left-front-fender', label: '左Fフェンダー', d: 'M10 14C...Z', labelPos: { x: 20, y: 20 } },
  // ...他の部位も同様
];

console.log(JSON.stringify({ viewBoxFrom: { minX, minY, width, height }, scale: { scaleX, scaleY }, paths, HOTSPOTS }, null, 2));