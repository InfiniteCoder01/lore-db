let transforms = {
  scale: 1,
  x: 0,
  y: 0,
};

function updateTransforms() {
  content.style.transform = `translate(${transforms.x}px, ${transforms.y}px) scale(${transforms.scale})`;
  for (const update of lineUpdates) update();
}

// -------------------------------------------------- Panning
let panning = null;
viewport.addEventListener('mousedown', (e) => {
  if (e.target != content && e.target != viewport) return;
  e.preventDefault();
  panning = {
    startX: e.clientX - transforms.x,
    startY: e.clientY - transforms.y,
  };
});

viewport.addEventListener('mousemove', (e) => {
  if (!panning) return;
  e.preventDefault();
  transforms.x = e.clientX - panning.startX;
  transforms.y = e.clientY - panning.startY;
  updateTransforms();
});

viewport.addEventListener('mouseup', (e) => {
  if (!panning) return;
  e.preventDefault();
  panning = null;
});

// -------------------------------------------------- Zooming
viewport.addEventListener('wheel', (e) => {
  e.preventDefault();
  const zoom = Math.pow(1.6, e.deltaY * -0.001);

  // Zoom relative to the mouse pointer
  const rect = content.getBoundingClientRect();
  const offsetX = e.clientX - (rect.left + rect.right) / 2;
  const offsetY = e.clientY - (rect.top + rect.bottom) / 2;

  transforms.x -= offsetX * (zoom - 1);
  transforms.y -= offsetY * (zoom - 1);
  transforms.scale *= zoom;

  updateTransforms();
});

updateTransforms();
