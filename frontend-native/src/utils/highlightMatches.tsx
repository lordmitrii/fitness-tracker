export function highlightMatches(
  label: string,
  needle: string,
  className = ""
) {
  if (!needle) return label;
  const lower = label.toLowerCase();
  const idx = lower.indexOf(needle.toLowerCase());
  if (idx === -1) return label;

  return (
    <>
      {label.slice(0, idx)}
      <mark className={className}>{label.slice(idx, idx + needle.length)}</mark>
      {label.slice(idx + needle.length)}
    </>
  );
}
