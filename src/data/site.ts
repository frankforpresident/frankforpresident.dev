export const site = {
  url: 'https://frankforpresident.dev',
  name: 'Frank Peters',
  handle: 'frankforpresident',
  role: 'Software engineer, Dolby Laboratories',
  tagline: 'I build the systems that carry live video.',
  location: 'Belgium',
  description:
    'Frank Peters is a software engineer at Dolby Laboratories working on low-latency live streaming infrastructure. TypeScript, Go, Kubernetes.',
} as const;

export const links = {
  github: 'https://github.com/frankforpresident',
  linkedin: 'https://www.linkedin.com/in/frank-peters-3b3a0bb3/',
  email: 'frank@frankforpresident.dev',
} as const;

export const about: readonly string[] = [
  'I work on the platform behind low-latency live streaming at Dolby Laboratories: control planes, delivery, and the infrastructure that keeps a stream sub-second worldwide.',
  'My day job is distributed systems in TypeScript and Go. My evenings are a Kubernetes cluster in my house that runs on GitOps and refuses to be touched by hand.',
  'I like software that is boring to operate: reproducible builds, declarative config, and a deploy story that fits on one line.',
];

export type WorkItem = {
  readonly title: string;
  readonly context: string;
  readonly summary: string;
  readonly tags: readonly string[];
  readonly href?: string;
};

export const work: readonly WorkItem[] = [
  {
    title: 'Dolby OptiView Live',
    context: 'Dolby Laboratories',
    summary:
      'Low-latency live streaming platform built on HESP. I work across the channel control plane, delivery services, and the infrastructure that runs them.',
    tags: ['TypeScript', 'Go', 'Kubernetes', 'Terraform'],
    href: 'https://optiview.dolby.com/products/live/',
  },
  {
    title: 'Computerheld',
    context: 'Own venture',
    summary:
      'IT services for people, not enterprises. Static Hugo site with a Go contact relay, containerised and deployed by Argo CD. No WordPress, no database, no PHP.',
    tags: ['Hugo', 'Go', 'nginx', 'Argo CD'],
    href: 'https://computerheld.be',
  },
  {
    title: 'home-automation',
    context: 'Homelab',
    summary:
      'Home Assistant, Zigbee and energy monitoring, all declared in a git repository. Argo CD syncs it onto a Kubernetes cluster at home, Renovate keeps it current, and nothing lands without a pull request.',
    tags: ['Kubernetes', 'GitOps', 'Home Assistant', 'Renovate'],
  },
  {
    title: 'traefik-plugin-validate-headers',
    context: 'Open source',
    summary:
      'Traefik middleware that rejects requests unless the configured headers are present and match. Small, focused, and used in production by strangers.',
    tags: ['Go', 'Traefik'],
    href: 'https://github.com/frankforpresident/traefik-plugin-validate-headers',
  },
  {
    title: 'transip-dynamic-dns',
    context: 'Open source',
    summary:
      'Keeps a TransIP DNS record pointed at a home connection that never agreed to keep the same IP address.',
    tags: ['Python', 'DNS'],
    href: 'https://github.com/frankforpresident/transip-dynamic-dns',
  },
];

export type StackGroup = { readonly label: string; readonly items: readonly string[] };

export const stack: readonly StackGroup[] = [
  { label: 'Languages', items: ['TypeScript', 'Go', 'Python', 'Bash'] },
  { label: 'Runtime', items: ['Node.js', 'Docker', 'nginx', 'Traefik'] },
  { label: 'Platform', items: ['Kubernetes', 'Argo CD', 'Terraform', 'GitHub Actions'] },
  { label: 'Observability', items: ['Grafana', 'Prometheus', 'Loki'] },
  { label: 'Streaming', items: ['HESP', 'LL-HLS', 'WebRTC', 'CMAF'] },
];
