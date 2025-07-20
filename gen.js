const timelines = [
  'avid', 'skyvid',
  'marm',
]

async function regenerateContent() {
  content.innerHTML = '';

  let html = {};
  await Promise.all(timelines.map(async id => html[id] = $.parseHTML(await $.get(`timelines/${id}.html`))));

  // Create fields
  let eventMap = {};
  for (const timelineId of timelines) {
    const timeline = html[timelineId];

    timeline.meta = {};
    for (const event of timeline) {
      if (event.tagName != 'META') continue;
      for (const attr of event.attributes) timeline.meta[attr.name] = attr.value;
    }

    for (const event of timeline) {
      if (event.tagName != 'EVENT') continue;

      if (event.id) {
        event.id = `${timelineId}:${event.id}`;
        eventMap[event.id] = event;
      }

      event.predecessors = [];
      event.successors = [];

      if (!event.getAttribute('link')) {
        event.div = document.createElement('div');
        event.div.id = event.id;
        event.div.className = 'box';
        event.div.innerHTML = event.innerHTML;
        event.div.style.top = '0px';
        event.div.style.left = '0px';
        content.appendChild(event.div);
      }
    }
  }

  // Replace links
  for (const timelineId of timelines) {
    const timeline = html[timelineId];
    for (const idx in timeline) {
      if (timeline[idx].tagName != 'EVENT') continue;
      const link = timeline[idx].getAttribute('link');
      if (link) timeline[idx] = eventMap[link];
    }
  }

  // Generate references
  for (const timelineId of timelines) {
    const timeline = html[timelineId];
    let last = null;
    for (const event of timeline) {
      if (event.tagName != 'EVENT') continue;
      if (event.getAttribute('prev')) last = eventMap[event.getAttribute('prev')];

      if (last) {
        event.predecessors.push(last);
        last.successors.push(event);

        const line = new LeaderLine(last.div, event.div, {
          color: timeline.meta.color,
          startSocket: 'bottom',
          endSocket: 'top',
        });

        // if (last.timelines.length > 1 || first) line.startLabel = LeaderLine.pathLabel(timeline.name);
        // if (event.timelines.length > 1) line.endLabel = LeaderLine.pathLabel(timeline.name);

        content.addEventListener('panzoomchange', (event) => {
          const scale = event.detail.scale;
          line.position();
          line.size = 5 * scale;
          line.startSocketGravity = line.endSocketGravity = 100 * scale;
        });
      }

      last = event;
    }
  }

  // Topological sort
  let order = [];
  for (const timelineId of timelines) {
    function visit(event) {
      if (event.visited) return;
      event.visited = true;
      for (const predecessor of event.predecessors) visit(predecessor);
      order.push(event);
    }

    for (const event of html[timelineId]) {
      if (event.tagName != 'EVENT') continue;
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
      event.div.style.left = `${freeX}px`;
      freeX += event.div.offsetWidth + 50;
    }

    // Compute starting offset
    const PADDING = 50;
    let x = parseInt(event.div.style.left) + event.div.offsetWidth / 2 - (event.successors.length - 1) * PADDING / 2;
    for (const successor of event.successors) {
      x -= successor.div.offsetWidth / 2;
    }

    // Contribute to successors
    for (const successor of event.successors) {
      const left = parseInt(successor.div.style.left) + x;
      const top = Math.max(parseInt(successor.div.style.top), parseInt(event.div.style.top) + event.div.offsetHeight + 100);
      successor.div.style.left = `${left}px`;
      successor.div.style.top = `${top}px`;
      x += successor.div.offsetWidth + PADDING;
    }
  }

  panzoom.zoom(1);
}

regenerateContent();
