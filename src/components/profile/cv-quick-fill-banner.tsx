"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpTrayIcon,
  DocumentTextIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

import {
  applyStructuredCvToProfile,
  uploadCv,
} from "@/app/profil/actions";
import { Alert, Button, Card, FileInput, Label } from "@/components/ui";
import type { ProfileCvDto } from "@/lib/profile/repository";

export type CvQuickFillBannerProps = {
  cv: ProfileCvDto | null;
  hasLlmKey: boolean;
};

type FeedbackState = {
  variant: "success" | "failure";
  text: string;
} | null;

export function CvQuickFillBanner({ cv, hasLlmKey }: CvQuickFillBannerProps) {
  const router = useRouter();
  const [uploadedCv, setUploadedCv] = useState<ProfileCvDto | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  const activeCv = uploadedCv ?? cv;
  const canApply = Boolean(activeCv?.structuredSections);
  const fileInputId = "quick-fill-cv-file";

  const onUpload = async () => {
    if (!selectedFile) {
      setFeedback({
        variant: "failure",
        text: "Sélectionnez un fichier PDF ou DOCX.",
      });
      return;
    }

    setUploading(true);
    setFeedback(null);
    const formData = new FormData();
    formData.set("file", selectedFile);

    try {
      const result = await uploadCv(formData);
      if (result.ok) {
        setUploadedCv(result.cv);
        setSelectedFile(null);
        setFeedback({
          variant: "success",
          text: "CV importé et analysé.",
        });
        router.refresh();
        return;
      }
      setFeedback({ variant: "failure", text: result.error });
    } catch {
      setFeedback({
        variant: "failure",
        text: "Impossible d'importer le CV.",
      });
    } finally {
      setUploading(false);
    }
  };

  const onApply = async () => {
    setApplying(true);
    setFeedback(null);
    try {
      const result = await applyStructuredCvToProfile();
      if (result.ok) {
        setFeedback({
          variant: "success",
          text: "Profil pré-rempli depuis le CV.",
        });
        router.refresh();
        return;
      }
      setFeedback({ variant: "failure", text: result.error });
    } catch {
      setFeedback({
        variant: "failure",
        text: "Impossible de pré-remplir le profil.",
      });
    } finally {
      setApplying(false);
    }
  };

  return (
    <Card title="Action rapide : importer votre CV" className="mb-section">
      <div className="flex flex-col gap-stack">
        <p className="text-sm text-secondary-600 dark:text-secondary-400">
          {activeCv ? (
            <span className="inline-flex items-center gap-1.5">
              <DocumentTextIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                CV actuel : <strong>{activeCv.originalFilename}</strong>
                {hasLlmKey ? " (analyse IA activée)" : " (analyse locale)"}
              </span>
            </span>
          ) : (
            "Importez un CV PDF ou DOCX pour pré-remplir automatiquement votre profil."
          )}
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Label
              htmlFor={fileInputId}
              value="Importer un CV (PDF ou DOCX, max 5 Mo)"
              className="mb-1.5 block"
            />
            <FileInput
              id={fileInputId}
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              disabled={uploading || applying}
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              color="gray"
              isProcessing={uploading}
              disabled={applying}
              onClick={onUpload}
            >
              <ArrowUpTrayIcon className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Importer le CV
            </Button>
            <Button
              type="button"
              color="blue"
              isProcessing={applying}
              disabled={!canApply || uploading}
              onClick={onApply}
            >
              <SparklesIcon className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Remplir mon profil depuis le CV
            </Button>
          </div>
        </div>

        <div aria-live="polite">
          {feedback ? (
            <Alert variant={feedback.variant}>{feedback.text}</Alert>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
