export default function StageBadge({ stage }) {
  return <span className={`badge stage-${stage.toLowerCase()}`}>{stage}</span>;
}
