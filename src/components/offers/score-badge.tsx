import { Badge } from "@/components/ui";

export function getScoreBadgeProps(score: number | null): {
  color: "success" | "warning" | "gray" | "info";
  label: string;
} {
  if (score === null) return { color: "info", label: "Profil requis" };
  if (score >= 75) return { color: "success", label: `${score} %` };
  if (score >= 50) return { color: "warning", label: `${score} %` };
  return { color: "gray", label: `${score} %` };
}

export interface ScoreBadgeProps {
  score: number | null;
}

export function ScoreBadge({ score }: ScoreBadgeProps) {
  const { color, label } = getScoreBadgeProps(score);
  const ariaLabel =
    score === null
      ? "Score indisponible : profil requis"
      : `Score de compatibilité : ${score} %`;

  return (
    <Badge color={color} aria-label={ariaLabel}>
      {label}
    </Badge>
  );
}
