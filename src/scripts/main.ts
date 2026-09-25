import {
  commands,
  complete,
  notFound,
  resolve,
  score,
  type Command,
  type CommandContext,
  type Line,
} from '../data/commands';

const root = document.documentElement;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

const sleep = (ms: number) => new Promise((done) => setTimeout(done, reduceMotion.matches ? 0 : ms));

/* ------------------------------------------------------------------ theme */

const applyTheme = (dark: boolean) => {
  if (dark) root.dataset.theme = 'dark';
  else delete root.dataset.theme;
  localStorage.setItem('theme', dark ? 'dark' : 'light');
};

const toggleTheme = (): string => {
  const dark = root.dataset.theme !== 'dark';
  applyTheme(dark);
  return dark ? 'dark' : 'light';
};

document.getElementById('theme-toggle')?.addEventListener('click', () => toggleTheme());

/* ----------------------------------------------------------------- header */

const header = document.querySelector<HTMLElement>('.site-header');
if (header) {
  const sentinel = document.createElement('div');
  header.before(sentinel);
  new IntersectionObserver(
    ([entry]) => {
      header.dataset.stuck = String(!entry?.isIntersecting);
    },
    { threshold: 1 },
  ).observe(sentinel);
}

/* --------------------------------------------------------------- terminal */

const terminal = document.getElementById('terminal');
const body = document.getElementById('terminal-body');
const output = document.getElementById('terminal-output');
const form = document.getElementById('terminal-form') as HTMLFormElement | null;
const input = document.getElementById('terminal-input') as HTMLInputElement | null;

const context: CommandContext = {
  open: (href) => {
    if (href.startsWith('mailto:')) window.location.href = href;
    else window.open(href, '_blank', 'noopener,noreferrer');
  },
  clear: () => {
    if (output) output.replaceChildren();
  },
  toggleTheme,
  goTo: (id) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: reduceMotion.matches ? 'auto' : 'smooth',
      block: 'start',
    });
  },
};

const scrollToBottom = () => {
  if (body) body.scrollTop = body.scrollHeight;
};

const print = (lines: readonly Line[]) => {
  if (!output) return;
  for (const line of lines) {
    const p = document.createElement('p');
    p.className = line.kind ? `terminal-line ${line.kind}` : 'terminal-line';
    if (line.href) {
      const a = document.createElement('a');
      a.href = line.href;
      a.textContent = line.text;
      if (!line.href.startsWith('mailto:')) {
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
      }
      p.append(a);
    } else {
      p.textContent = line.text || '\u00a0';
    }
    output.append(p);
  }
  scrollToBottom();
};

const echo = (value: string) => {
  if (!output) return;
  const p = document.createElement('p');
  p.className = 'terminal-line';
  const prompt = document.createElement('span');
  prompt.className = 'terminal-prompt';
  prompt.textContent = 'guest@ffp:~$';
  const said = document.createElement('span');
  said.className = 'terminal-echo';
  said.textContent = ` ${value}`;
  p.append(prompt, said);
  output.append(p);
};

const history: string[] = [];
let cursor = -1;

const run = (raw: string) => {
  const value = raw.trim();
  echo(value);
  if (!value) return;
  if (history[history.length - 1] !== value) history.push(value);
  cursor = history.length;

  const [name, ...args] = value.split(/\s+/);
  const command = resolve(name ?? '');
  print(command ? command.run(context, args) : notFound(name ?? ''));
};

/** Run a command from outside the prompt (chip or palette). */
const runExternal = (name: string) => {
  run(name);
  if (input) input.focus({ preventScroll: true });
};

form?.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!input) return;
  run(input.value);
  input.value = '';
});

input?.addEventListener('keydown', (event) => {
  if (event.key === 'Tab') {
    event.preventDefault();
    const { value, matches } = complete(input.value.trim());
    if (matches.length === 0) return;
    input.value = value;
    if (matches.length > 1) {
      echo(input.value);
      print([{ text: matches.join('  '), kind: 'dim' }]);
    }
    return;
  }

  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    if (history.length === 0) return;
    event.preventDefault();
    cursor = event.key === 'ArrowUp' ? Math.max(0, cursor - 1) : Math.min(history.length, cursor + 1);
    input.value = history[cursor] ?? '';
    input.setSelectionRange(input.value.length, input.value.length);
    return;
  }

  if (event.key === 'l' && event.ctrlKey) {
    event.preventDefault();
    context.clear();
  }
});

/* Clicking anywhere in the transcript focuses the prompt, like a real terminal. */
body?.addEventListener('mousedown', (event) => {
  if (window.getSelection()?.toString()) return;
  if ((event.target as HTMLElement).closest('a')) return;
  event.preventDefault();
  input?.focus({ preventScroll: true });
});

for (const chip of document.querySelectorAll<HTMLButtonElement>('.terminal-chips button')) {
  chip.addEventListener('click', () => runExternal(chip.dataset.command ?? ''));
}

const boot = async () => {
  if (!terminal || !input) return;
  terminal.dataset.ready = '';

  print([
    { text: 'Welcome. This prompt is real, but nothing here is hidden behind it:', kind: 'dim' },
    { text: 'every command just jumps to a section of the page below.', kind: 'dim' },
    { text: '' },
  ]);

  const demo = 'help';
  echo('');
  const last = output?.lastElementChild?.querySelector('.terminal-echo');
  for (const character of demo) {
    if (last) last.textContent += character;
    scrollToBottom();
    await sleep(70);
  }
  await sleep(240);
  print(resolve(demo)!.run(context, []));
};

void boot();

/* -------------------------------------------------------- command palette */

const palette = document.getElementById('palette') as HTMLDialogElement | null;
const paletteInput = document.getElementById('palette-input') as HTMLInputElement | null;
const paletteList = document.getElementById('palette-list');

let visible: Command[] = [];
let active = 0;

const renderPalette = () => {
  if (!paletteList || !paletteInput) return;
  const query = paletteInput.value.trim();
  visible = commands
    .filter((command) => !command.hidden)
    .map((command) => ({ command, rank: score(query, `${command.name} ${command.summary}`) }))
    .filter((entry) => entry.rank > 0)
    .sort((a, b) => b.rank - a.rank)
    .map((entry) => entry.command);

  active = 0;
  paletteList.replaceChildren();

  if (visible.length === 0) {
    const empty = document.createElement('li');
    empty.textContent = 'No matching command';
    paletteList.append(empty);
    return;
  }

  visible.forEach((command, i) => {
    const item = document.createElement('li');
    item.id = `palette-option-${i}`;
    item.role = 'option';
    item.ariaSelected = String(i === active);
    const name = document.createElement('b');
    name.textContent = command.name;
    const summary = document.createElement('span');
    summary.textContent = command.summary;
    item.append(name, summary);
    item.addEventListener('mousemove', () => setActive(i));
    item.addEventListener('click', () => choose(i));
    paletteList.append(item);
  });
  setActive(0);
};

const setActive = (i: number) => {
  if (!paletteList || visible.length === 0) return;
  active = (i + visible.length) % visible.length;
  const items = [...paletteList.children];
  items.forEach((item, index) => item.setAttribute('aria-selected', String(index === active)));
  items[active]?.scrollIntoView({ block: 'nearest' });
  paletteInput?.setAttribute('aria-activedescendant', `palette-option-${active}`);
};

const choose = (i: number) => {
  const command = visible[i];
  palette?.close();
  if (command) {
    terminal?.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'center' });
    runExternal(command.name);
  }
};

const openPalette = () => {
  if (!palette || palette.open || !paletteInput) return;
  paletteInput.value = '';
  renderPalette();
  palette.showModal();
  paletteInput.focus();
};

paletteInput?.addEventListener('input', renderPalette);

paletteInput?.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    setActive(active + 1);
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    setActive(active - 1);
  } else if (event.key === 'Enter') {
    event.preventDefault();
    choose(active);
  }
});

document.getElementById('palette-open')?.addEventListener('click', openPalette);

document.addEventListener('keydown', (event) => {
  if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
    event.preventDefault();
    if (palette?.open) palette.close();
    else openPalette();
  }
});

root.dataset.ready = '';
