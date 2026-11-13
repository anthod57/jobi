import {
  ArrowLeftIcon,
  ArrowTopRightOnSquareIcon,
  BuildingOffice2Icon,
  CalendarIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  CONTRACT_TYPE_LABELS,
  REMOTE_MODE_LABELS,
  SOURCE_LABELS,
} from "@/components/offers/labels";
import { ScoreBadge } from "@/components/offers/score-badge";
import { ScoreBreakdownCard } from "@/components/offers/score-breakdown-card";
import { Badge, Button, Card } from "@/components/ui";
import { getScoredOfferById } from "@/lib/scoring/score-repository";

export const dynamic = "force-dynamic";

function parseOfferId(rawId: string): number | null {
  if (!/^\d+$/.test(rawId)) return null;
  const id = Number(rawId);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function formatOfferSalary(
  salaryMin: number | null,
  salaryMax: number | null,
  salaryText: string | null,
): string | null {
  if (salaryText) return salaryText;
  if (salaryMin && salaryMax) {
    return `${salaryMin.toLocaleString("fr-FR")} – ${salaryMax.toLocaleString("fr-FR")} €`;
  }
  if (salaryMin) {
    return `À partir de ${salaryMin.toLocaleString("fr-FR")} €`;
  }
  if (salaryMax) {
    return `Jusqu'à ${salaryMax.toLocaleString("fr-FR")} €`;
  }
  return null;
}

function formatOfferDate(date: Date | null): string | null {
  if (!date) return null;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

function isSafeExternalUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const offerId = parseOfferId(id);
  if (!offerId) return { title: "Offre introuvable — Jobi" };

  const offer = await getScoredOfferById(offerId);
  if (!offer) return { title: "Offre introuvable — Jobi" };

  return { title: `${offer.title} — Jobi` };
}

export default async function OfferDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const offerId = parseOfferId(id);
  if (!offerId) notFound();

  const offer = await getScoredOfferById(offerId);
  if (!offer) notFound();

  const salaryLabel = formatOfferSalary(
    offer.salaryMin,
    offer.salaryMax,
    offer.salaryText,
  );
  const dateLabel = formatOfferDate(offer.publishedAt ?? offer.lastSeenAt);
  const safeSources = offer.sources.filter((src) => isSafeExternalUrl(src.url));

  return (
    <div className="space-y-section">
      <div>
        <Button href="/offres" color="light" size="sm">
          <ArrowLeftIcon className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Retour aux offres
        </Button>
      </div>

      <div className="flex flex-col gap-4 border-b border-secondary-200 pb-5 dark:border-secondary-800">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-secondary-950 dark:text-white">
              {offer.title}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-secondary-600 dark:text-secondary-400">
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

        <div className="flex flex-wrap items-center gap-2">
          {offer.contractType ? (
            <Badge color="gray">
              {CONTRACT_TYPE_LABELS[offer.contractType]}
            </Badge>
          ) : null}
          {offer.remoteMode ? (
            <Badge color="info">{REMOTE_MODE_LABELS[offer.remoteMode]}</Badge>
          ) : null}
          {salaryLabel ? <Badge color="gray">{salaryLabel}</Badge> : null}
          {offer.department ? (
            <Badge color="light">Dép. {offer.department}</Badge>
          ) : null}
        </div>

        {safeSources.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {safeSources.map((src) => (
              <a
                key={`${src.source}-${src.url}`}
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-secondary-200 bg-white px-3 py-1.5 text-sm font-medium text-secondary-800 hover:bg-secondary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-100 dark:hover:bg-secondary-700"
              >
                Voir sur {SOURCE_LABELS[src.source]}
                <ArrowTopRightOnSquareIcon
                  className="h-4 w-4 shrink-0"
                  aria-hidden="true"
                />
              </a>
            ))}
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card title="Description du poste">
            <div className="whitespace-pre-line text-sm leading-relaxed text-secondary-700 dark:text-secondary-300">
              {offer.description}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <ScoreBreakdownCard score={offer.score} breakdown={offer.breakdown} />
        </div>
      </div>
    </div>
  );
}
