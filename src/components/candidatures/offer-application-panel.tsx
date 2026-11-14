"use client";

import {
  CheckIcon,
  ClipboardDocumentIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import {
  generateDraftAction,
  updateApplicationAction,
} from "@/app/candidatures/actions";
import {
  APPLICATION_STATUS_COLORS,
  APPLICATION_STATUS_LABELS,
  APPLICATION_TONE_LABELS,
} from "@/components/candidatures/labels";
import {
  Alert,
  Badge,
  Button,
  Card,
  Input,
  Label,
  Select,
} from "@/components/ui";
import type {
  ApplicationStatus,
  ApplicationTone,
  ApplicationWithOffer,
} from "@/lib/candidatures/types";

export interface OfferApplicationPanelProps {
  offerId: number;
  llmConfigured: boolean;
  activeProviderLabel: string;
  initialApplication: ApplicationWithOffer | null;
}

const TONES: readonly ApplicationTone[] = [
  "professional",
  "direct",
  "enthusiastic",
];

const STATUSES: readonly ApplicationStatus[] = [
  "draft",
  "validated",
  "sent",
  "archived",
];

export function OfferApplicationPanel({
  offerId,
  llmConfigured,
  activeProviderLabel,
  initialApplication,
}: OfferApplicationPanelProps) {
  const router = useRouter();
  const [tone, setTone] = useState<ApplicationTone>(
    initialApplication?.tone ?? "professional",
  );
  const [customInstructions, setCustomInstructions] = useState(
    initialApplication?.customInstructions ?? "",
  );
  const [subject, setSubject] = useState(
    initialApplication?.draftSubject ?? "",
  );
  const [body, setBody] = useState(initialApplication?.draftBody ?? "");
  const [status, setStatus] = useState<ApplicationStatus>(
    initialApplication?.status ?? "draft",
  );
  const [isDirty, setIsDirty] = useState(false);
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);
  const [feedback, setFeedback] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [isGenerating, startGenerate] = useTransition();
  const [isSaving, startSave] = useTransition();

  useEffect(() => {
    if (!initialApplication) return;
    setTone(initialApplication.tone);
    setCustomInstructions(initialApplication.customInstructions);
    setSubject(initialApplication.draftSubject);
    setBody(initialApplication.draftBody);
    setStatus(initialApplication.status);
    setIsDirty(false);
  }, [initialApplication]);

  function runGenerate() {
    setConfirmRegenerate(false);
    setFeedback(null);
    startGenerate(async () => {
      const res = await generateDraftAction({
        offerId,
        tone,
        customInstructions,
      });
      if (!res.ok) {
        setFeedback({ ok: false, message: res.error });
        return;
      }
      setIsDirty(false);
      setFeedback({ ok: true, message: "Brouillon généré avec succès." });
      router.refresh();
    });
  }

  function handleGenerateClick() {
    if (initialApplication && isDirty) {
      setConfirmRegenerate(true);
      return;
    }
    runGenerate();
  }

  function handleSaveDraft() {
    if (!initialApplication) return;
    setFeedback(null);
    startSave(async () => {
      const res = await updateApplicationAction({
        applicationId: initialApplication.id,
        draftSubject: subject,
        draftBody: body,
      });
      if (!res.ok) {
        setFeedback({ ok: false, message: res.error });
        return;
      }
      setIsDirty(false);
      setFeedback({ ok: true, message: "Brouillon enregistré." });
      router.refresh();
    });
  }

  function handleStatusChange(nextStatus: ApplicationStatus) {
    if (!initialApplication) return;
    setStatus(nextStatus);
    setFeedback(null);
    startSave(async () => {
      const res = await updateApplicationAction({
        applicationId: initialApplication.id,
        status: nextStatus,
      });
      if (!res.ok) {
        setFeedback({ ok: false, message: res.error });
        return;
      }
      setFeedback({
        ok: true,
        message: `Statut mis à jour : ${APPLICATION_STATUS_LABELS[nextStatus]}.`,
      });
      router.refresh();
    });
  }

  async function handleCopy() {
    const text = `Objet : ${subject}\n\n${body}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setFeedback({
        ok: false,
        message: "Impossible de copier dans le presse-papiers.",
      });
    }
  }

  return (
    <Card>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-secondary-950 dark:text-white">
              Préparer ma candidature
            </h2>
            {initialApplication ? (
              <Badge color={APPLICATION_STATUS_COLORS[status]}>
                {APPLICATION_STATUS_LABELS[status]}
              </Badge>
            ) : null}
          </div>
          {initialApplication ? (
            <Link
              href="/candidatures"
              className="text-sm font-medium text-primary-700 hover:underline dark:text-primary-400"
            >
              Voir mes candidatures →
            </Link>
          ) : null}
        </div>

        {llmConfigured ? (
          <Alert variant="info">
            Confidentialité : seul votre profil utile (sans coordonnées) et le
            descriptif de l&apos;offre sont envoyés à {activeProviderLabel}.
          </Alert>
        ) : (
          <Alert variant="warning">
            Aucune clé API LLM configurée pour le fournisseur actif.{" "}
            <Link href="/parametres" className="font-semibold underline">
              Configurer dans Paramètres
            </Link>
            .
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <Label htmlFor="application-tone" className="mb-1 block">
              Ton
            </Label>
            <Select
              id="application-tone"
              value={tone}
              onChange={(e) => setTone(e.target.value as ApplicationTone)}
            >
              {TONES.map((t) => (
                <option key={t} value={t}>
                  {APPLICATION_TONE_LABELS[t]}
                </option>
              ))}
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="application-instructions" className="mb-1 block">
              Consigne particulière (optionnel)
            </Label>
            <Input
              id="application-instructions"
              type="text"
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="Ex. : mettre en avant mon expérience Next.js et PostgreSQL"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            color="primary"
            disabled={!llmConfigured || isGenerating}
            onClick={handleGenerateClick}
          >
            <SparklesIcon className="mr-1.5 h-4 w-4" aria-hidden="true" />
            {isGenerating
              ? "Génération en cours..."
              : initialApplication
                ? "Régénérer le brouillon"
                : "Générer le brouillon"}
          </Button>
        </div>

        {confirmRegenerate ? (
          <Alert variant="warning">
            <div className="space-y-2">
              <p>
                Le brouillon a été modifié localement. La régénération
                remplacera vos modifications non enregistrées.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  color="warning"
                  size="sm"
                  onClick={runGenerate}
                >
                  Confirmer la régénération
                </Button>
                <Button
                  type="button"
                  color="light"
                  size="sm"
                  onClick={() => setConfirmRegenerate(false)}
                >
                  Annuler
                </Button>
              </div>
            </div>
          </Alert>
        ) : null}

        <div aria-live="polite" className="space-y-2">
          {feedback ? (
            <Alert variant={feedback.ok ? "success" : "failure"}>
              {feedback.message}
            </Alert>
          ) : null}
          {copied ? (
            <Alert variant="success">Copié !</Alert>
          ) : null}
        </div>

        {initialApplication ? (
          <div className="space-y-4 border-t border-secondary-200 pt-4 dark:border-secondary-800">
            <div>
              <Label htmlFor="draft-subject" className="mb-1 block">
                Objet
              </Label>
              <Input
                id="draft-subject"
                type="text"
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  setIsDirty(true);
                }}
              />
            </div>

            <div>
              <Label htmlFor="draft-body" className="mb-1 block">
                Message
              </Label>
              <textarea
                id="draft-body"
                rows={10}
                value={body}
                onChange={(e) => {
                  setBody(e.target.value);
                  setIsDirty(true);
                }}
                className="w-full rounded-lg border border-secondary-300 bg-white p-2.5 text-sm text-secondary-950 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-secondary-700 dark:bg-secondary-900 dark:text-white"
              />
            </div>

            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="w-48">
                <Label htmlFor="application-status" className="mb-1 block">
                  Statut
                </Label>
                <Select
                  id="application-status"
                  value={status}
                  disabled={isSaving}
                  onChange={(e) =>
                    handleStatusChange(e.target.value as ApplicationStatus)
                  }
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {APPLICATION_STATUS_LABELS[s]}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  color="light"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <CheckIcon className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  ) : (
                    <ClipboardDocumentIcon
                      className="mr-1.5 h-4 w-4"
                      aria-hidden="true"
                    />
                  )}
                  Copier
                </Button>
                <Button
                  type="button"
                  color="primary"
                  disabled={isSaving}
                  onClick={handleSaveDraft}
                >
                  {isSaving ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
