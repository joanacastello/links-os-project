import ScreenBackButton from '../ScreenBackButton';

interface ProjectStat {
  label: string;
  value: string;
}

type ProjectShowcaseScreenProps = Readonly<{
  onBack: () => void;
  iconSrc: string;
  iconAlt: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  stats: ProjectStat[];
  features: string[];
  previewImages: string[];
  description: string;
  stack: string;
}>;

export default function ProjectShowcaseScreen({
  onBack,
  iconSrc,
  iconAlt,
  title,
  subtitle,
  ctaLabel,
  ctaHref,
  stats,
  features,
  previewImages,
  description,
  stack,
}: ProjectShowcaseScreenProps) {
  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-white text-[#121212]">
      <header className="relative z-30 shrink-0 px-3 pb-2 pt-3 md:pb-4 md:pt-14">
        <div className="relative min-h-[44px]">
          <ScreenBackButton
            onBack={onBack}
            iconClassName="text-neutral-900"
            buttonClassName="hover:bg-black/5"
          />
        </div>
      </header>

      <div
        className="relative z-10 min-h-0 flex-1 overflow-y-auto px-5 pb-8 [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <section className="mt-1 flex items-center gap-3">
          <div className="h-[110px] w-[110px] shrink-0 overflow-hidden rounded-[24px] border border-black/10 bg-white shadow-[0_8px_22px_rgba(0,0,0,0.08)]">
            <img
              src={iconSrc}
              alt={iconAlt}
              width={256}
              height={256}
              decoding="async"
              draggable={false}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-[20px] font-bold leading-[0.98] tracking-tight">{title}</h1>
            <p className="mt-1 text-[13px] leading-tight text-neutral-600">{subtitle}</p>
            <a
              href={ctaHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex rounded-[999px] bg-[#0071ff] px-6 py-2 text-[15px] font-semibold leading-none text-white"
            >
              {ctaLabel}
            </a>
          </div>
        </section>

        <hr className="my-6 border-neutral-100" />

        <section className="grid grid-cols-3 divide-x divide-neutral-100">
          {stats.map((item) => (
            <div key={item.label} className="px-2 text-center">
              <p className="text-[11px] font-semibold uppercase leading-tight tracking-[0.04em] text-neutral-500">
                {item.label}
              </p>
              <p className="mt-1.5 text-[16px] font-semibold leading-none">{item.value}</p>
            </div>
          ))}
        </section>

        <hr className="my-6 border-neutral-100" />

        <section>
          <h2 className="text-[20px] font-bold leading-none tracking-tight">Features Top</h2>
          <ul className="mt-4 space-y-1.5">
            {features.map((feature) => (
              <li key={feature} className="flex gap-3 text-[14px] leading-snug">
                <span className="pt-[2px] text-neutral-400">—</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-6 -mx-5">
          <h2 className="px-5 text-[20px] font-bold leading-none tracking-tight">Previsualización</h2>
          <div
            className="mt-4 flex gap-3 overflow-x-auto pb-1 pl-5 pr-1 [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {previewImages.map((preview, idx) => (
              <img
                key={`${preview}-${idx}`}
                src={preview}
                alt={`${title} preview ${idx + 1}`}
                width={1080}
                height={2160}
                decoding="async"
                draggable={false}
                className="h-[300px] w-auto max-w-none shrink-0 rounded-[18px] border border-black/5 object-contain"
              />
            ))}
          </div>
        </section>

        <section className="mt-6">
          <h2 className="text-[20px] font-bold leading-none tracking-tight">Descripción</h2>
          <p className="mt-3 text-[13px] leading-[1.45] text-neutral-800">{description}</p>
          <p className="mt-4 text-[12px] leading-tight text-neutral-500">{stack}</p>
        </section>
      </div>
    </div>
  );
}
