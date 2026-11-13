import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

import { Button, Card, Input, Label, Select } from "@/components/ui";
import type { OfferFilters } from "@/lib/scoring/schemas";

import {
  CONTRACT_TYPE_LABELS,
  REMOTE_MODE_LABELS,
  SOURCE_LABELS,
} from "./labels";

export interface OfferFiltersBarProps {
  filters: OfferFilters;
}

export function OfferFiltersBar({ filters }: OfferFiltersBarProps) {
  const hasActiveFilters = Boolean(
    filters.q ||
      filters.contractType ||
      filters.remoteMode ||
      filters.source ||
      filters.minScore !== undefined ||
      filters.sort !== "score",
  );

  return (
    <Card>
      <form
        method="GET"
        action="/offres"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6"
        aria-label="Filtrer et trier les offres"
      >
        <div className="sm:col-span-2 lg:col-span-2">
          <Label htmlFor="filter-q" className="mb-1.5 block">
            Recherche
          </Label>
          <Input
            id="filter-q"
            name="q"
            type="search"
            defaultValue={filters.q}
            placeholder="Titre, entreprise, description…"
            icon={MagnifyingGlassIcon}
          />
        </div>

        <div>
          <Label htmlFor="filter-contract" className="mb-1.5 block">
            Contrat
          </Label>
          <Select
            id="filter-contract"
            name="contractType"
            defaultValue={filters.contractType ?? ""}
          >
            <option value="">Tous les contrats</option>
            {Object.entries(CONTRACT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="filter-remote" className="mb-1.5 block">
            Télétravail
          </Label>
          <Select
            id="filter-remote"
            name="remoteMode"
            defaultValue={filters.remoteMode ?? ""}
          >
            <option value="">Tous les modes</option>
            {Object.entries(REMOTE_MODE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="filter-source" className="mb-1.5 block">
            Source
          </Label>
          <Select
            id="filter-source"
            name="source"
            defaultValue={filters.source ?? ""}
          >
            <option value="">Toutes les sources</option>
            {Object.entries(SOURCE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="filter-min-score" className="mb-1.5 block">
            Score minimum
          </Label>
          <Select
            id="filter-min-score"
            name="minScore"
            defaultValue={
              filters.minScore !== undefined ? String(filters.minScore) : ""
            }
          >
            <option value="">Tous les scores</option>
            <option value="50">50 % et plus</option>
            <option value="75">75 % et plus</option>
          </Select>
        </div>

        <div className="sm:col-span-2 lg:col-span-3">
          <Label htmlFor="filter-sort" className="mb-1.5 block">
            Trier par
          </Label>
          <Select
            id="filter-sort"
            name="sort"
            defaultValue={filters.sort}
          >
            <option value="score">Score décroissant</option>
            <option value="date">Date de publication</option>
          </Select>
        </div>

        <div className="flex flex-wrap items-end justify-end gap-2 sm:col-span-2 lg:col-span-3">
          {hasActiveFilters ? (
            <Button href="/offres" color="light">
              Réinitialiser
            </Button>
          ) : null}
          <Button type="submit" color="primary">
            Appliquer
          </Button>
        </div>
      </form>
    </Card>
  );
}
