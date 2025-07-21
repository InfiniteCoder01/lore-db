let timelines = [
  'avid', 'skyvid', 'avoid', 'aavid',
  'marm',
];

const eventMap = {};

(async function load() {
  LeaderLine.positionByWindowResize = false;

  const parser = new DOMParser();

  timelines = await Promise.all(timelines.map(id =>
    fetch(`timelines/${id}.html`)
    .then(response => response.text())
    .then(text => {
      const doc = parser.parseFromString(text, 'text/html');
      const timeline = Array.from(doc.body.children);

      timeline.id = id;
      timeline.meta = {};
      timeline.head = [];
      for (const el of doc.head.children) {
        if (el.tagName == 'META') {
          for (const attr of el.attributes) timeline.meta[attr.name] = attr.value;
        } else timeline.head.push(el);
      }

      for (const event of timeline) {
        if (event.id) {
          event.id = `${id}:${event.id}`;
          eventMap[event.id] = event;
        }
      }

      return timeline;
    })));

  regenerateContent();
  const zoom = 1.5;
  panzoom.zoom(zoom);
  panzoom.pan(window.innerWidth / zoom / 2, 0);
})();

let lines = [];
function regenerateContent() {
  for (const line of lines) {
    document.body.appendChild(line.element);
    line.remove();
  }
  lines = [];
  content.innerHTML = '';

  // Create events
  for (const timeline of timelines) {
    const container = document.createElement('div');
    container.append(...timeline.head);
    content.appendChild(container);

    for (const event of timeline) {
      event.predecessors = [];
      event.successors = [];
      event.visited = false;

      if (!event.getAttribute('link')) {
        event.div = document.createElement('div');
        event.div.id = event.id;
        event.div.className = `box ${event.className}`;
        event.div.innerHTML = event.innerHTML;
        event.div.style.top = '0px';
        event.div.style.left = '0px';
        container.appendChild(event.div);
      }
    }
  }

  // Generate references
  for (const timeline of timelines) {
    let last = null;
    for (let event of timeline) {
      if (event.getAttribute('prev')) last = eventMap[event.getAttribute('prev')];

      const link = event.getAttribute('link');
      if (link) event = eventMap[link];

      if (last) {
        event.predecessors.push(last);
        last.successors.push(event);

        const line = new LeaderLine(last.div, event.div, {
          color: timeline.meta.color,
          startSocket: 'bottom',
          endSocket: 'top',
          dash: true,
          dropShadow: true,
        });

        line.middleLabel = LeaderLine.pathLabel(timeline.meta.name, {
          outlineColor: 'rgba(30, 30, 30, 0.5)',
          fontSize: 20,
          line,
        });

        line.element = document.body.children[document.body.children.length - 1];
        lines.push(line);
      }

      last = event;
    }
  }

  // Topological sort of position dependence
  const order = [];
  for (const timeline of timelines) {
    function visit(event) {
      if (event.hasAttribute('link')) event = eventMap[event.getAttribute('link')];
      if (event.visited) return;
      event.visited = true;

      const positionDefined = event.hasAttribute('x');
      if (positionDefined) order.push(event);
      for (const predecessor of event.predecessors) visit(predecessor);
      if (!positionDefined) order.push(event);
    }

    for (const event of timeline) {
      if (event.hasAttribute('link')) continue;
      if (event.successors.length == 0) visit(event);
    }
  }

  // Layout
  let freeX = 0;
  for (const event of order) {
    // Position this event
    if (event.predecessors.length > 0) {
      event.div.style.left = `${parseInt(event.div.style.left) / event.predecessors.length}px`;
    } else {
      event.div.style.top = '0px';
      event.div.style.left = `${freeX}px`;
    }
    if (event.hasAttribute('x')) event.div.style.left = `${event.getAttribute('x') - event.div.offsetWidth / 2}px`;
    if (event.hasAttribute('y')) event.div.style.top = `${event.getAttribute('y')}px`;
    freeX = Math.max(freeX, parseInt(event.div.style.left) + event.div.offsetWidth + 50);

    // Compute starting X offset
    const PADDING = 50;
    let x = parseInt(event.div.style.left) + event.div.offsetWidth / 2;
    for (const successor of event.successors) {
      if (successor.hasAttribute('x')) continue;
      x -= (successor.div.offsetWidth + PADDING) / 2;
    }
    x += PADDING / 2;

    // Contribute to successors
    for (const successor of event.successors) {
      if (!successor.hasAttribute('x'))  {
        const left = parseInt(successor.div.style.left) + x;
        successor.div.style.left = `${left}px`;
        x += successor.div.offsetWidth + PADDING;
      }
      if (!successor.hasAttribute('y')) {
        const top = Math.max(parseInt(successor.div.style.top), parseInt(event.div.style.top) + event.div.offsetHeight + 100);
        successor.div.style.top = `${top}px`;
      }
    }
  }

  for (const line of lines) {
    line.position();
    content.appendChild(line.element);
  }
}
