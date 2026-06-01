interface PageHeaderProps {
  devanagari: string;
  translit: string;
  title: string;
  description?: string;
}

export function PageHeader({
  devanagari,
  translit,
  title,
  description,
}: PageHeaderProps) {
  return (
    <div>
      <p className="text-theme-primary mb-1 font-serif text-sm font-medium tracking-wide opacity-80">
        {devanagari} · {translit}
      </p>
      <h1 className="text-theme-fg text-3xl font-bold">{title}</h1>
      {description && <p className="text-theme-fg-muted mt-1 text-sm">{description}</p>}
    </div>
  );
}
