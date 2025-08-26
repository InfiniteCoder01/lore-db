LeaderLine.positionByWindowResize = false;
let lines = [];
async function generate(block) {
    block.meta = block.meta || {};

    {
        const src = block.getAttribute('src');
        if (src) {
            // if (element.getAttribute('preload')) block.load();
            block.innerHTML = await (await fetch(src)).text();
        }
    }

    async function walk(element, callback) {
        for (const child of element.children) {
            const tag = child.tagName.toLowerCase();
            await callback(tag, child);
            if (tag != 'block') await walk(child, callback);
        }
    }

    let last = null;
    await walk(block, async (tag, el) => {
        if (tag == 'meta') {
            // Import meta into the element
            for (const attr of el.attributes)
                block.meta[attr.name] = attr.value;
        } else if (tag == 'block') {
            // Load/generate child
            el.meta = { ...block.meta };
            el.prevBlock = last || block.prevBlock;
            await generate(el);
            last = el;
        } else if (tag == 'connect') {
            // Connect to another block
            let [from, fromSocket] = (el.getAttribute('from') || '').split(':');
            let [to, toSocket] = (el.getAttribute('to') || '').split(':');

            if (from) from = document.getElementById(from);
            else if (to) from = block;
            else from = block.prevBlock;
            if (to) to = document.getElementById(to);
            else to = block;

            const line = new LeaderLine(from, to, {
                color: el.getAttribute('color') || block.meta.color,
                startSocket: fromSocket,
                endSocket: toSocket,
                dash: true,
                dropShadow: true,
            });

            line.middleLabel = LeaderLine.pathLabel(el.innerHTML || block.meta.name, {
                outlineColor: 'rgba(30, 30, 30, 0.5)',
                fontSize: 20,
                line,
            });
            el.innerHTML = '';

            line.element = document.body.children[document.body.children.length - 1];
            el.line = line;
            el.appendChild(line.element);
            lines.push(line);
        }
    });
}

(async function() {
    await generate(content);
    for (const line of lines) {
        line.position();
    }
})();
