import { useId, useRef, useState } from "react";
import { ImagePlus, Loader2, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { uploadFile } from "@/lib/admin/api";
import { Button } from "@/components/ui/button";

const MAX_BYTES = 25 * 1024 * 1024;
const ACCEPTED = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"];

type Props = {
  previewUrl: string | null;
  onChange: (next: { fileId: string; previewUrl: string | null }) => void;
  disabled?: boolean;
  className?: string;
};

export function MarketPictureField({ previewUrl, onChange, disabled = false, className }: Props) {
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
      const uploaded = await uploadFile(file);
      onChange({ fileId: uploaded.id, previewUrl: uploaded.url });
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
    onChange({ fileId: "", previewUrl: null });
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className={cn("min-w-0", className)}>
      {previewUrl ? (
        <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/20 p-2.5">
          <img
            src={previewUrl}
            alt="Market preview"
            className="h-24 w-24 shrink-0 rounded-md border border-border/60 object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">Image attached</p>
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary underline-offset-2 hover:underline"
            >
              View image
            </a>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={openPicker} disabled={busy}>
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Replace"}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={clear} disabled={busy}>
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-4 py-6 text-center transition-colors",
            busy
              ? "cursor-not-allowed border-border/60 bg-muted/20 opacity-70"
              : "border-border/70 bg-muted/20",
            isDragging ? "border-primary bg-primary/10" : "",
          )}
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
              {isUploading ? "Uploading…" : isDragging ? "Drop to upload" : "Add a market picture"}
            </p>
            <p id={descId} className="mt-0.5 text-xs text-muted-foreground">
              Optional · PNG, JPG, WEBP or GIF · up to 25MB
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
        aria-describedby={descId}
        onChange={(e) => {
          void ingest(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}
