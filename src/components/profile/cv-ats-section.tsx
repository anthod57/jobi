"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { uploadCv } from "@/app/profil/actions";
import { Alert, Button, Card, FileInput, Label } from "@/components/ui";
import type { ProfileCvDto } from "@/lib/profile/repository";

import { AtsDisplay } from "./ats-display";

type CvAtsSectionProps = {
  cv: ProfileCvDto | null;
};

export function CvAtsSection({ cv }: CvAtsSectionProps) {
  const router = useRouter();
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

    const result = await uploadCv(formData);
    setUploading(false);

    if (result.ok) {
      setUploadMessage({
        variant: "success",
        text: "CV importé et analysé.",
      });
      setSelectedFile(null);
      router.refresh();
      return;
    }

    setUploadMessage({ variant: "failure", text: result.error });
  };

  const fileInputId = "profile-cv-file";

  return (
    <Card title="CV & ATS" className="mt-section">
      <div className="flex flex-col gap-stack">
        <div>
          <Label
            htmlFor={fileInputId}
            value="Fichier CV (PDF ou DOCX, max 5 Mo)"
          />
          <FileInput
            id={fileInputId}
            className="mt-2"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            disabled={uploading}
            onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
          />
        </div>
        <Button
          type="button"
          color="gray"
          isProcessing={uploading}
          onClick={onUpload}
        >
          Importer le CV
        </Button>
        {uploadMessage ? (
          <Alert variant={uploadMessage.variant}>{uploadMessage.text}</Alert>
        ) : null}
        <AtsDisplay cv={cv} />
      </div>
    </Card>
  );
}
