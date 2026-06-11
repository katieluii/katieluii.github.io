import { Pill } from '../../Pill';

type Props = {
  /** Short type label, e.g. "TPP", "ETLM", "Thematic synthesis". */
  type: string;
  /** Optional secondary pills (indication, segment, etc.). */
  pills?: React.ReactNode;
  /** ISO date or display date the artifact was last updated. */
  updated?: string;
  /** The one-sentence bottom line — shown prominently. */
  verdict: string;
};

/**
 * Standard briefing header: type pill + "Updated {date}" meta, then the verdict
 * rendered as the prominent lead. Title/back nav are handled by ProjectPageLayout.
 */
export function ArtifactHeader({ type, pills, updated, verdict }: Props) {
  return (
    <header className="mb-8">
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <Pill variant="tech">{type}</Pill>
        {pills}
        {updated && (
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            Updated {updated.slice(0, 10)}
          </span>
        )}
      </div>
      <p className="text-lg sm:text-xl font-medium leading-snug text-zinc-900 dark:text-zinc-100 max-w-[72ch] border-l-4 border-zinc-900 dark:border-zinc-100 pl-4">
        {verdict}
      </p>
    </header>
  );
}

export default ArtifactHeader;
