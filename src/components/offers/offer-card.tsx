import {
  BuildingOffice2Icon,
  CalendarIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

import { Badge, Button, Card } from "@/components/ui";
import type { ScoredOfferItem } from "@/lib/scoring/types";

import {
  CONTRACT_TYPE_LABELS,
  REMOTE_MODE_LABELS,
  SOURCE_LABELS,
} from "./labels";
import { ScoreBadge } from "./score-badge";

export interface OfferCardProps {
  offer: ScoredOfferItem;
}

function formatOfferSalary(offer: ScoredOfferItem): string | null {
  if (offer.salaryText) return offer.salaryText;
  if (offer.salaryMin && offer.salaryMax) {
    return `${offer.salaryMin.toLocaleString("fr-FR")} – ${offer.salaryMax.toLocaleString("fr-FR")} €`;
  }
  if (offer.salaryMin) {
    return `À partir de ${offer.salaryMin.toLocaleString("fr-FR")} €`;
  }
  if (offer.salaryMax) {
    return `Jusqu'à ${offer.salaryMax.toLocaleString("fr-FR")} €`;
  }
  return null;
}

function formatOfferDate(date: Date | null): string | null {
  if (!date) return null;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function OfferCard({ offer }: OfferCardProps) {
  const salaryLabel = formatOfferSalary(offer);
  const dateLabel = formatOfferDate(offer.publishedAt ?? offer.lastSeenAt);

  return (
    <Card>
      <article className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <h2 className="text-lg font-semibold text-secondary-950 dark:text-white">
              <Link
                href={`/offres/${offer.id}`}
                className="rounded-sm hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:hover:text-primary-400"
              >
                {offer.title}
              </Link>
            </h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-secondary-600 dark:text-secondary-400">
              <span className="inline-flex items-center gap-1.5">
                <BuildingOffice2Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {offer.company}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPinIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {offer.locationLabel}
              </span>
              {dateLabel ? (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {dateLabel}
                </span>
              ) : null}
            </div>
          </div>

          <div className="shrink-0">
            <ScoreBadge score={offer.score} />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            {offer.contractType ? (
              <Badge color="gray">
                {CONTRACT_TYPE_LABELS[offer.contractType]}
              </Badge>
            ) : null}
            {offer.remoteMode ? (
              <Badge color="info">
                {REMOTE_MODE_LABELS[offer.remoteMode]}
              </Badge>
            ) : null}
            {salaryLabel ? <Badge color="gray">{salaryLabel}</Badge> : null}
            {offer.sources.map((src) => (
              <Badge key={src.source} color="light">
                {SOURCE_LABELS[src.source]}
              </Badge>
            ))}
          </div>

          <Button href={`/offres/${offer.id}`} color="light" size="sm">
            Voir le détail
          </Button>
        </div>
      </article>
    </Card>
  );
}
