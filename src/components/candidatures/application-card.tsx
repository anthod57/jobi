"use client";

import {
  CheckIcon,
  ClipboardDocumentIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  deleteApplicationAction,
  updateApplicationAction,
} from "@/app/candidatures/actions";
import {
  APPLICATION_STATUS_COLORS,
  APPLICATION_STATUS_LABELS,
  APPLICATION_TONE_LABELS,
  LLM_PROVIDER_LABELS,
} from "@/components/candidatures/labels";
import {
  CONTRACT_TYPE_LABELS,
  REMOTE_MODE_LABELS,
} from "@/components/offers/labels";
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
  ApplicationWithOffer,
} from "@/lib/candidatures/types";

export interface ApplicationCardProps {
  application: ApplicationWithOffer;
}

const STATUSES: readonly ApplicationStatus[] = [
  "draft",
  "validated",
  "sent",
  "archived",
];

function formatShortDate(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "short" }).format(date);
}

export function ApplicationCard({ application }: ApplicationCardProps) {
  const router = useRouter();
  const [status, setStatus] = useState<ApplicationStatus>(application.status);
  const [subject, setSubject] = useState(application.draftSubject);
  const [body, setBody] = useState(application.draftBody);
  const [notes, setNotes] = useState(application.notes);
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleStatusChange(nextStatus: ApplicationStatus) {
    setStatus(nextStatus);
    setFeedback(null);
    startTransition(async () => {
      const res = await updateApplicationAction({
        applicationId: application.id,
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

  function handleSave() {
    setFeedback(null);
    startTransition(async () => {
      const res = await updateApplicationAction({
        applicationId: application.id,
        draftSubject: subject,
        draftBody: body,
        notes,
      });
      if (!res.ok) {
        setFeedback({ ok: false, message: res.error });
        return;
      }
      setFeedback({ ok: true, message: "Modifications enregistrées." });
      setIsEditing(false);
      router.refresh();
    });
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(`Objet : ${subject}\n\n${body}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setFeedback({
        ok: false,
        message: "Impossible de copier dans le presse-papiers.",
      });
    }
  }

  function handleDelete() {
    setFeedback(null);
    startTransition(async () => {
      const res = await deleteApplicationAction(application.id);
      if (!res.ok) {
        setFeedback({ ok: false, message: res.error });
        setConfirmDelete(false);
        return;
      }
      router.refresh();
    });
  }

  const contractLabel = application.offerContractType
    ? CONTRACT_TYPE_LABELS[
        application.offerContractType as keyof typeof CONTRACT_TYPE_LABELS
      ]
    : null;
  const remoteLabel = application.offerRemoteMode
    ? REMOTE_MODE_LABELS[
        application.offerRemoteMode as keyof typeof REMOTE_MODE_LABELS
      ]
    : null;

  return (
    <Card>
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/offres/${application.offerId}`}
                className="text-base font-semibold text-secondary-950 hover:text-primary-700 hover:underline dark:text-white dark:hover:text-primary-400"
              >
                {application.offerTitle}
              </Link>
              <Badge color={APPLICATION_STATUS_COLORS[status]}>
                {APPLICATION_STATUS_LABELS[status]}
              </Badge>
            </div>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">
              {application.offerCompany || "Entreprise non précisée"} ·{" "}
              {application.offerLocationLabel || "Lieu non précisé"}
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {contractLabel ? <Badge color="gray">{contractLabel}</Badge> : null}
              {remoteLabel ? <Badge color="info">{remoteLabel}</Badge> : null}
              <Badge color="gray">
                {APPLICATION_TONE_LABELS[application.tone]}
              </Badge>
              <span className="text-xs text-secondary-500 dark:text-secondary-400">
                {LLM_PROVIDER_LABELS[application.provider]} · {application.model}{" "}
                · Màj {formatShortDate(application.updatedAt)}
                {application.sentAt
                  ? ` · Envoyée le ${formatShortDate(application.sentAt)}`
                  : ""}
              </span>
            </div>
          </div>

          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <div className="w-full sm:w-36">
              <Label
                htmlFor={`status-${application.id}`}
                className="sr-only"
              >
                Statut de la candidature
              </Label>
              <Select
                id={`status-${application.id}`}
                sizing="sm"
                value={status}
                disabled={isPending}
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
            <Button type="button" color="light" size="sm" onClick={handleCopy}>
              {copied ? (
                <CheckIcon className="mr-1 h-4 w-4" aria-hidden="true" />
              ) : (
                <ClipboardDocumentIcon
                  className="mr-1 h-4 w-4"
                  aria-hidden="true"
                />
              )}
              Copier
            </Button>
            <Button
              type="button"
              color="light"
              size="sm"
              onClick={() => setIsEditing((prev) => !prev)}
            >
              <PencilSquareIcon className="mr-1 h-4 w-4" aria-hidden="true" />
              {isEditing ? "Fermer" : "Éditer"}
            </Button>
            <Button
              type="button"
              color="failure"
              size="sm"
              disabled={isPending}
              onClick={() => setConfirmDelete(true)}
            >
              <TrashIcon className="mr-1 h-4 w-4" aria-hidden="true" />
              Supprimer
            </Button>
          </div>
        </div>

        {confirmDelete ? (
          <Alert variant="warning">
            <div className="space-y-2">
              <p>
                Supprimer définitivement cette candidature pour «{" "}
                {application.offerTitle} » ?
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  color="failure"
                  size="sm"
                  disabled={isPending}
                  onClick={handleDelete}
                >
                  {isPending ? "Suppression..." : "Confirmer la suppression"}
                </Button>
                <Button
                  type="button"
                  color="light"
                  size="sm"
                  disabled={isPending}
                  onClick={() => setConfirmDelete(false)}
                >
                  Annuler
                </Button>
              </div>
            </div>
          </Alert>
        ) : null}

        <div aria-live="polite" className="space-y-2">
          {copied ? <Alert variant="success">Copié !</Alert> : null}
          {feedback ? (
            <Alert variant={feedback.ok ? "success" : "failure"}>
              {feedback.message}
            </Alert>
          ) : null}
        </div>

        {!isEditing ? (
          <div className="space-y-2 rounded-lg border border-secondary-200 bg-secondary-50 p-3 dark:border-secondary-800 dark:bg-secondary-950">
            <p className="text-sm font-medium text-secondary-950 dark:text-white">
              Objet : {subject || "—"}
            </p>
            <p className="line-clamp-3 whitespace-pre-line text-sm text-secondary-700 dark:text-secondary-300">
              {body || "Aucun message."}
            </p>
            {notes ? (
              <p className="border-t border-secondary-200 pt-2 text-xs text-secondary-600 dark:border-secondary-800 dark:text-secondary-400">
                Notes : {notes}
              </p>
            ) : null}
          </div>
        ) : (
          <div className="space-y-3 border-t border-secondary-200 pt-3 dark:border-secondary-800">
            <div>
              <Label htmlFor={`subject-${application.id}`} className="mb-1.5 block">
                Objet
              </Label>
              <Input
                id={`subject-${application.id}`}
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor={`body-${application.id}`} className="mb-1.5 block">
                Message
              </Label>
              <textarea
                id={`body-${application.id}`}
                rows={7}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full rounded-lg border border-secondary-300 bg-white p-2.5 text-sm text-secondary-950 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-secondary-700 dark:bg-secondary-900 dark:text-white"
              />
            </div>
            <div>
              <Label htmlFor={`notes-${application.id}`} className="mb-1.5 block">
                Notes personnelles
              </Label>
              <textarea
                id={`notes-${application.id}`}
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex. : relance prévue lundi, contact RH..."
                className="w-full rounded-lg border border-secondary-300 bg-white p-2.5 text-sm text-secondary-950 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-secondary-700 dark:bg-secondary-900 dark:text-white"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                color="light"
                size="sm"
                onClick={() => setIsEditing(false)}
              >
                Annuler
              </Button>
              <Button
                type="button"
                color="primary"
                size="sm"
                disabled={isPending}
                onClick={handleSave}
              >
                {isPending ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
