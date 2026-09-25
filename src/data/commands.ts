import { about, links, site, stack, work } from './site';

export type LineKind = 'out' | 'dim' | 'accent' | 'error';

export type Line = {
  readonly text: string;
  readonly kind?: LineKind;
  readonly href?: string;
};

export type CommandContext = {
  /** Open a URL in a new tab. */
  readonly open: (href: string) => void;
  /** Wipe the terminal transcript. */
  readonly clear: () => void;
  /** Flip between the light and dark theme. */
  readonly toggleTheme: () => string;
  /** Smooth-scroll to a section id, respecting reduced motion. */
  readonly goTo: (id: string) => void;
};

export type Command = {
  readonly name: string;
  readonly summary: string;
  /** Shown in `help` and the palette when false or undefined. */
  readonly hidden?: boolean;
  readonly aliases?: readonly string[];
  readonly run: (ctx: CommandContext, args: readonly string[]) => readonly Line[];
};

/** Set to a path under `public/` once a CV is ready to publish. */
export const cvUrl: string | null = null;

const out = (text: string): Line => ({ text });
const dim = (text: string): Line => ({ text, kind: 'dim' });
const accent = (text: string): Line => ({ text, kind: 'accent' });
const blank: Line = { text: '' };

const wrap = (text: string, width = 74): Line[] => {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if (current && current.length + word.length + 1 > width) {
      lines.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) lines.push(current);
  return lines.map(out);
};

export const commands: readonly Command[] = [
  {
    name: 'help',
    summary: 'List everything this prompt understands',
    aliases: ['?'],
    run: () => [
      dim('Available commands. Press Tab to complete, Up for history.'),
      blank,
      ...commands
        .filter((command) => !command.hidden)
        .map((command) => out(`  ${command.name.padEnd(10)} ${command.summary}`)),
      blank,
      dim('Everything here is also on the page below. Press Ctrl+K for the palette.'),
    ],
  },
  {
    name: 'about',
    summary: 'Who I am and what I work on',
    aliases: ['bio'],
    run: (ctx) => {
      ctx.goTo('about');
      return [accent(`${site.name}, ${site.role}`), blank, ...about.flatMap((p) => [...wrap(p), blank])];
    },
  },
  {
    name: 'work',
    summary: 'Selected projects',
    aliases: ['projects'],
    run: (ctx) => {
      ctx.goTo('work');
      return work.flatMap((item) => [
        accent(`${item.title}  (${item.context})`),
        ...wrap(item.summary),
        dim(`  ${item.tags.join(' · ')}`),
        ...(item.href ? [{ text: `  ${item.href}`, kind: 'dim' as const, href: item.href }] : []),
        blank,
      ]);
    },
  },
  {
    name: 'stack',
    summary: 'Tools I reach for',
    aliases: ['skills'],
    run: (ctx) => {
      ctx.goTo('stack');
      return stack.map((group) => out(`  ${group.label.padEnd(14)} ${group.items.join(', ')}`));
    },
  },
  {
    name: 'github',
    summary: 'Open my GitHub profile',
    run: (ctx) => {
      ctx.open(links.github);
      return [dim(`Opening ${links.github}`)];
    },
  },
  {
    name: 'linkedin',
    summary: 'Open my LinkedIn profile',
    run: (ctx) => {
      ctx.open(links.linkedin);
      return [dim(`Opening ${links.linkedin}`)];
    },
  },
  {
    name: 'email',
    summary: 'Send me a message',
    aliases: ['contact', 'mail'],
    run: (ctx) => {
      ctx.open(`mailto:${links.email}`);
      return [dim(`Opening your mail client for ${links.email}`)];
    },
  },
  {
    name: 'cv',
    summary: 'Download my CV',
    aliases: ['resume'],
    run: (ctx) => {
      if (cvUrl) {
        ctx.open(cvUrl);
        return [dim(`Downloading ${cvUrl}`)];
      }
      return [
        out('No CV published yet.'),
        { text: `Mail ${links.email} and you get one the same day.`, kind: 'dim', href: `mailto:${links.email}` },
        { text: `In the meantime: ${links.linkedin}`, kind: 'dim', href: links.linkedin },
      ];
    },
  },
  {
    name: 'theme',
    summary: 'Toggle light and dark',
    run: (ctx) => [dim(`Theme set to ${ctx.toggleTheme()}.`)],
  },
  {
    name: 'clear',
    summary: 'Clear the screen',
    aliases: ['cls'],
    run: (ctx) => {
      ctx.clear();
      return [];
    },
  },
  {
    name: 'whoami',
    summary: 'You, apparently',
    hidden: true,
    run: () => [out('guest'), dim('Nice to meet you.')],
  },
  {
    name: 'uptime',
    summary: 'How long this has been running',
    hidden: true,
    run: () => {
      const since = Date.UTC(1990, 0, 1);
      const years = (Date.now() - since) / (365.2425 * 24 * 3600 * 1000);
      return [out(` up ${years.toFixed(1)} years,  1 user,  load average: 0.31, 0.24, 0.19`)];
    },
  },
  {
    name: 'sudo',
    summary: 'Escalate',
    hidden: true,
    run: (_ctx, args) => [
      { text: `guest is not in the sudoers file. This incident has been reported.`, kind: 'error' },
      ...(args.length ? [dim(`(${args.join(' ')} was a bold thing to try)`)] : []),
    ],
  },
  {
    name: 'ls',
    summary: 'List sections',
    hidden: true,
    run: () => [out('about  work  stack  contact')],
  },
];

const index = new Map<string, Command>();
for (const command of commands) {
  index.set(command.name, command);
  for (const alias of command.aliases ?? []) index.set(alias, command);
}

export const names: readonly string[] = [...index.keys()].sort();

export const resolve = (name: string): Command | undefined => index.get(name.toLowerCase());

/** Longest common prefix completion over every command name and alias. */
export const complete = (partial: string): { value: string; matches: readonly string[] } => {
  const matches = names.filter((name) => name.startsWith(partial.toLowerCase()));
  if (matches.length === 0) return { value: partial, matches };
  let prefix = matches[0]!;
  for (const match of matches) {
    while (!match.startsWith(prefix)) prefix = prefix.slice(0, -1);
  }
  return { value: prefix, matches };
};

/** Cheap subsequence score so the palette can fuzzy match. */
export const score = (query: string, target: string): number => {
  if (!query) return 1;
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  if (t.startsWith(q)) return 1000 - t.length;
  let qi = 0;
  let hits = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti += 1) {
    if (t[ti] === q[qi]) {
      qi += 1;
      hits += 1;
    }
  }
  return qi === q.length ? hits * 10 - t.length : -1;
};

export const notFound = (name: string): readonly Line[] => {
  const near = names.filter((candidate) => score(name, candidate) > 0).slice(0, 3);
  return [
    { text: `command not found: ${name}`, kind: 'error' },
    ...(near.length ? [dim(`Did you mean: ${near.join(', ')}?`)] : [dim("Type 'help' for the list.")]),
  ];
};
