"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { uploadCv } from "@/app/profil/actions";
import { Alert, Button, Card, FileInput, Label } from "@/components/ui";
import type { ProfileCvDto } from "@/lib/profile/repository";

import { AtsDisplay } from "./ats-display";

type CvAtsSectionProps = {
  cv: ProfileCvDto | null;
  hasLlmKey?: boolean;
};

export function CvAtsSection({ cv, hasLlmKey = false }: CvAtsSectionProps) {
  const router = useRouter();
  const [uploadedCv, setUploadedCv] = useState<ProfileCvDto | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{
    variant: "success" | "failure";
    text: string;
  } | null>(null);

  const onUpload = async () => {
    if (!selectedFile) {
      setUploadMessage({
        variant: "failure",
        text: "Sélectionnez un fichier PDF ou DOCX.",
      });
      return;
    }

    setUploading(true);
    setUploadMessage(null);
    const formData = new FormData();
    formData.set("file", selectedFile);

    try {
      const result = await uploadCv(formData);
      if (result.ok) {
        setUploadedCv(result.cv);
        setUploadMessage({
          variant: "success",
          text: "CV importé et analysé.",
        });
        setSelectedFile(null);
        router.refresh();
        return;
      }

      setUploadMessage({ variant: "failure", text: result.error });
    } catch {
      setUploadMessage({
        variant: "failure",
        text: "Impossible d'importer le CV.",
      });
    } finally {
      setUploading(false);
    }
  };

  const fileInputId = "profile-cv-file";

  return (
    <Card title="CV & ATS" className="mt-section">
      <div className="flex flex-col gap-stack">
        <div>
          <Label
            htmlFor={fileInputId}
            value="Fichier CV (PDF ou DOCX, max 5 Mo)"
            className="mb-1.5 block"
          />
          <FileInput
            id={fileInputId}
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            disabled={uploading}
            onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
          />
        </div>
        <Button
          type="button"
          color="gray"
          className="w-full sm:w-fit"
          isProcessing={uploading}
          onClick={onUpload}
        >
          Importer le CV
        </Button>
        <div aria-live="polite">
          {uploadMessage ? (
            <Alert variant={uploadMessage.variant}>{uploadMessage.text}</Alert>
          ) : null}
        </div>
        <AtsDisplay cv={uploadedCv ?? cv} hasLlmKey={hasLlmKey} />
      </div>
    </Card>
  );
}
