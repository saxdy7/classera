import Image from 'next/image';

const INTEGRATIONS = [
  { name: 'Slack', slug: 'slack' },
  { name: 'Zoom', slug: 'zoom' },
  { name: 'Google Classroom', slug: 'googleclassroom' },
  { name: 'Microsoft Teams', slug: 'microsoftteams' },
  { name: 'Notion', slug: 'notion' },
  { name: 'Figma', slug: 'figma' },
  { name: 'Google Drive', slug: 'googledrive' },
  { name: 'GitHub', slug: 'github' },
];

export default function PartnersSection() {
  return (
    <section className="max-w-7xl mx-auto pt-16 px-6 pb-20">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-semibold tracking-tight text-[var(--cl-ink)] dark:text-[var(--cl-on-dark)] sm:text-5xl">
          Trusted integrations
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-[var(--cl-body)] dark:text-[var(--cl-muted-soft)] leading-relaxed">
          Connects with the tools educators already use every day.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {INTEGRATIONS.map((tool) => (
          <div
            key={tool.slug}
            className="group flex h-24 items-center justify-center rounded-[var(--cl-r-xl)] border border-[var(--cl-hairline)] dark:border-[var(--cl-hairline-strong)] bg-[var(--cl-surface-card)] dark:bg-[var(--cl-surface-inverse)] transition-all duration-300 hover:border-[var(--cl-primary)] dark:hover:border-[var(--cl-primary)]"
          >
            <Image
              src={`https://cdn.simpleicons.org/${tool.slug}`}
              alt={tool.name}
              width={32}
              height={32}
              unoptimized
              className="h-8 w-8 opacity-60 grayscale transition-all duration-300 group-hover:opacity-100 group-hover:grayscale-0 dark:invert dark:group-hover:invert-0"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
