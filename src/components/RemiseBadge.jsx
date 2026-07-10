import { remiseMeta, REMISE_INDEFINIE } from '../utils/constants.js';

// Pastille colorée de remise (lecture seule)
export default function RemiseBadge({ value }) {
  const meta = remiseMeta(value) || REMISE_INDEFINIE;
  return (
    <span className="badge" style={{ backgroundColor: meta.color }}>
      {meta.short || meta.label}
    </span>
  );
}
