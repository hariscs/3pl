"use client";

import { User } from "lucide-react";
import type { ChangeEvent } from "react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { readFileAsDataUrl, validatePhotoFile } from "@/lib/file";

function initials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function CrewProfilePhotoField({
  photoUrl,
  firstName,
  lastName,
  onChange,
}: {
  photoUrl?: string;
  firstName: string;
  lastName: string;
  onChange: (url: string | undefined) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");

  async function handleFile(file: File) {
    const validationError = validatePhotoFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    const dataUrl = await readFileAsDataUrl(file);
    onChange(dataUrl);
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  return (
    <div>
      <p className="text-sm font-semibold text-ink">Profile Photo</p>
      <div className="mt-2 flex items-center gap-4">
        {photoUrl ? (
          // biome-ignore lint/performance/noImgElement: data-URL preview, not eligible for next/image
          <img
            src={photoUrl}
            alt=""
            className="h-16 w-16 shrink-0 rounded-full border border-manila-dark object-cover"
          />
        ) : initials(firstName, lastName) ? (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-manila-dark bg-manila text-sm font-semibold text-steel">
            {initials(firstName, lastName)}
          </div>
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-manila-dark bg-manila text-steel-light">
            <User size={24} />
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => inputRef.current?.click()}
            >
              {photoUrl ? "Replace" : "Upload"}
            </Button>
            {photoUrl && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => onChange(undefined)}
              >
                Remove
              </Button>
            )}
          </div>
          <p className="text-xs text-steel-light">
            JPG, PNG, or WebP · Max 5 MB
          </p>
          {error && <p className="text-xs font-medium text-stamp">{error}</p>}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
