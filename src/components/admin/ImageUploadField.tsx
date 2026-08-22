import { useId, useRef, useState } from "react";
import { ImagePlus, Loader2, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { uploadFile } from "@/lib/admin/api";
import { Button } from "@/components/ui/button";

const MAX_BYTES = 25 * 1024 * 1024; // mirrors file-service FILE_MAX_UPLOAD_BYTES (25MB)
const ACCEPTED = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"];

export interface ImageUploadFieldProps {
  /** Current image URL (e.g. the stored photo_url), or empty when unset. */
  value: string;
  /** Called with the uploaded file's public URL, or "" when cleared. */
  onChange: (url: string) => void;
  label?: string;
  hint?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Accessible drag-and-drop image upload. Uploads to the file-service and emits
 * the resulting public URL. Supports click, keyboard, drag-drop, and paste.
 */
export function ImageUploadField({
  value,
  onChange,
  label = "Photo",
  hint = "PNG, JPG, WEBP or GIF · up to 25MB",
  disabled = false,
  className,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setUploading] = useState(false);
  const [isDragging, setDragging] = useState(false);
  const descId = useId();

  const busy = disabled || isUploading;

  async function ingest(file: File | undefined | null) {
    if (!file) return;
    if (!file.type.startsWith("image/") || (file.type && !ACCEPTED.includes(file.type))) {
      toast.error("Please choose an image file (PNG, JPG, WEBP, GIF, SVG).");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Image is too large (max 25MB).");
      return;
    }
    setUploading(true);
    try {
      const { url } = await uploadFile(file);
      onChange(url);
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function openPicker() {
    if (!busy) inputRef.current?.click();
  }

  function clear() {
    onChange("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className={cn("min-w-0", className)}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>

      {value ? (
        // ─ Filled: preview with replace / remove ─
        <div className="mt-1 flex items-center gap-3 rounded-lg border border-border/60 bg-muted/20 p-2.5">
          <img
            src={value}
            alt="Selected"
            className="h-14 w-14 shrink-0 rounded-md border border-border/60 object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">Image attached</p>
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary underline-offset-2 hover:underline"
            >
              View image
            </a>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button type="button" variant="outline" size="sm" onClick={openPicker} disabled={busy}>
              {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Replace"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={clear}
              disabled={busy}
              aria-label="Remove image"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        // ─ Empty: dropzone ─
        <div
          role="button"
          tabIndex={busy ? -1 : 0}
          aria-label={`Upload ${label.toLowerCase()}. Drag and drop an image, or activate to browse.`}
          aria-describedby={descId}
          aria-disabled={busy}
          aria-busy={isUploading}
          onClick={openPicker}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openPicker();
            }
          }}
          onDragOver={(e) => {
            if (busy) return;
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (!busy) void ingest(e.dataTransfer.files?.[0]);
          }}
          onPaste={(e) => {
            const item = Array.from(e.clipboardData.items).find((i) => i.type.startsWith("image/"));
            if (item) void ingest(item.getAsFile());
          }}
          className={cn(
            "mt-1 flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-6 text-center transition-colors outline-none",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            busy
              ? "cursor-not-allowed border-border/60 bg-muted/20 opacity-70"
              : "cursor-pointer hover:border-primary/50 hover:bg-muted/30",
            isDragging ? "border-primary bg-primary/10" : "border-border/70 bg-muted/20",
          )}
        >
          {isUploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : isDragging ? (
            <UploadCloud className="h-6 w-6 text-primary" />
          ) : (
            <ImagePlus className="h-6 w-6 text-muted-foreground" />
          )}
          <div>
            <p className="text-sm font-medium text-foreground">
              {isUploading ? "Uploading…" : isDragging ? "Drop to upload" : "Drag & drop an image"}
            </p>
            <p id={descId} className="mt-0.5 text-xs text-muted-foreground">
              {hint}
            </p>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={openPicker} disabled={busy}>
            Browse files
          </Button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        className="sr-only"
        tabIndex={-1}
        disabled={busy}
        onChange={(e) => {
          void ingest(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}
