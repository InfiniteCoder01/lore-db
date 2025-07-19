// ----------------------------------- Timestamps
const timestamps = [
  {
    title: 'Prequel',
    id: 'prequel',
  },
  {
    title: 'SBK1',
    id: 'sbk1',
  },
  {
    title: 'Avid Adventures',
    id: 'aa',
  },
];

const timestampMap = Object.fromEntries(timestamps.map(
  timestamp => [timestamp.id, timestamp]
));

// ----------------------------------- Events
function makeEvent(timestampId, html, maxWidth=500) {
  let div = document.createElement('div');
  div.className = 'box';
  div.style.position = 'absolute';
  div.style.maxWidth = `${maxWidth}px`;
  div.innerHTML = html;
  let event = {
    div,
    timestampId,
  };

  let timestamp = timestampMap[timestampId];
  if (!timestamp.events) timestamp.events = [];
  timestamp.events.push(event);

  return event;
}

// ----------------------------------- Timelines
const timelines = [
  {
    name: 'Avid',
    color: 'purple',
    events: [],
  },
  {
    name: 'Marm',
    color: 'orange',
    events: [],
  },
  {
    name: 'Avid',
    color: 'purple',
    events: [],
  }
];

timelines[0].events.push(
  makeEvent('prequel', `
  <a href="https://youtu.be/szGFe0vgsGI?t=92">100 days nightmare series</a>, where Avid first starts in a village he named "New Salem".
  <a href="https://youtu.be/szGFe0vgsGI?t=74">He also named an iron golem Jeremy</a>, who later dies during a blood moon.
  To protect this town from blood moons <a href="https://youtu.be/5dOLxIq2emM?t=945">Avid agrees to a deal with a powerful guy named Olm, The Old One.</a>
  He defeats the "Demon of Darkness" and <a href="https://youtu.be/5dOLxIq2emM?t=1442">goes to Limbo</a>, where there is no faith of returning.
  `),
  makeEvent('sbk1', `
  Limbo Avid gets split into the dusk black avid with sad white eyes and the other Avid (shown in <a href="https://youtu.be/mcfRVIzNq8c?t=306">a flashback from Marm saying "I've been in the void"</a>).
  Colorful Avid agrees to a deal with Olm to get out of limbo.
  `),
  makeEvent('sbk1', `
  <i>Looking for explanation of <a href="https://youtu.be/mcfRVIzNq8c?t=249">this</a> second, but looks like this is how Marmalade found out about the way Avid was sent to SBK1</i>
  `),
  makeEvent('sbk1', `
  <a href="https://youtu.be/6D3ThbTSULM?t=1674">He falls into the void in the first EP and lights up limbo on fire (?)</a>.
  He talks to Olm, gets transformed into a monkey and is sent back.
  `)
);

timelines[1].events.push(
  makeEvent('prequel', `
  ...Void screaming... TODO
  `),
);

const wafflehouse = makeEvent('sbk1', `
<a href="https://youtu.be/sam-a4NCUbQ?t=1754">Monkey Avid and Marmalade figured out how to get dusk Avid out of limbo through Leon's wafflehouse</a>.
He got transported into AA world and also got the enderman curse from Leon.
`, false);

timelines[0].events.push(wafflehouse);
timelines[1].events.push(wafflehouse);

timelines[2].events.push(
  wafflehouse,
  makeEvent('aa', `
  In the AA world he slowly frees from the enderman curse & dusk discoloration somehow (running quests as a good guy?)
  `),
);

const visit = makeEvent('aa', `
Marmalade visits avid in AA with void magic (shown in I Built a MEGA Island on Marm's channel + in Avid's AA video), and by the end of SBK1 she transports them both to AA world, where Avid would hide to this day (prooven by his comment).
`);

timelines[1].events.push(visit);
timelines[2].events.push(visit);

// ----------------------------------- Generation
function regenerateContent() {
  content.innerHTML = '';
  lineUpdates = [];

  // Add events
  for (const timestamp of timestamps) {
    timestamp.events = timestamp.events || [];
    for (const event of timestamp.events) {
      event.timelines = [];
      content.appendChild(event.div);
    }
  }

  // Layout timelines
  let x = 0;
  for (const timeline of timelines) {
    timeline.x = x;
    for (const event of timeline.events) event.timelines.push(timeline);
    x += 500;
  }

  for (const timeline of timelines) {
    let last = null, first = true;
    for (const event of timeline.events) {
      if (last) {
        const line = new LeaderLine(last.div, event.div, {
          color: timeline.color,
          startSocket: 'bottom',
          endSocket: 'top',
        });
        // if (!(last.timelines.length > 1 && event.timelines.length > 1)) {
        if (last.timelines.length > 1 || first) line.startLabel = LeaderLine.pathLabel(timeline.name);
        if (event.timelines.length > 1) line.endLabel = LeaderLine.pathLabel(timeline.name);
        // }
        lineUpdates.push(() => {
          line.position()
          line.size = 5 * transforms.scale;
          line.startSocketGravity = line.endSocketGravity = 100 * transforms.scale;
        });
        first = false;
      }
      last = event;
    }
  }

  // Layout timestamps
  let timestampY = 0;
  for (const timestamp of timestamps) {
    const LAYER_PADDING = 100;

    let timelineHeights = {};
    let height = 0;
    for (const event of timestamp.events) {
      let x = 0, y = 0;
      for (const timeline of event.timelines) {
        x += timeline.x;
        y = Math.max(y, (timelineHeights[timeline.name] + LAYER_PADDING) || 0);
      }

      x /= event.timelines.length;
      for (const timeline of event.timelines) timelineHeights[timeline.name] = y + event.div.offsetHeight;
      height = Math.max(height, y + event.div.offsetHeight);

      event.div.style.left = `${x - event.div.offsetWidth / 2}px`;
      event.div.style.top = `${y + timestampY}px`;
    }

    timestampY += height + LAYER_PADDING;
  }

  for (const update of lineUpdates) update();
}

regenerateContent();
