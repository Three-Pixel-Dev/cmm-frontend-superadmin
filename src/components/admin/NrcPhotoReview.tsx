import { useCallback, useEffect, useId, useState } from "react";
import { ExternalLink, ImageOff, Maximize2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type NrcSide = "front" | "back";

type NrcPhotoCardProps = {
  side: NrcSide;
  url: string;
  applicantName: string;
  onEnlarge: () => void;
};

function NrcPhotoCard({ side, url, applicantName, onEnlarge }: NrcPhotoCardProps) {
  const [failed, setFailed] = useState(false);
  const label = side === "front" ? "NRC front" : "NRC back";
  const alt = `${label} — ${applicantName}`;

  return (
    <figure className="flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card">
      <figcaption className="border-b border-border/40 px-4 py-2.5">
        <p className="text-sm font-medium text-foreground">{label}</p>
      </figcaption>
      <div className="relative flex min-h-[220px] items-center justify-center bg-muted/20 p-3 sm:min-h-[280px]">
        {failed ? (
          <div
            className="flex flex-col items-center gap-2 px-4 text-center text-sm text-muted-foreground"
            role="img"
            aria-label={`${label} could not be loaded`}
          >
            <ImageOff className="h-8 w-8" aria-hidden />
            <span>Image failed to load</span>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline"
            >
              Open URL
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          </div>
        ) : (
          <>
            <img
              src={url}
              alt={alt}
              className="max-h-[320px] w-full object-contain"
              onError={() => setFailed(true)}
            />
            <button
              type="button"
              onClick={onEnlarge}
              className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-background/90 px-2.5 py-1.5 text-xs font-medium shadow-sm backdrop-blur transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`View ${label} full size`}
            >
              <Maximize2 className="h-3.5 w-3.5" aria-hidden />
              Enlarge
            </button>
          </>
        )}
      </div>
      {!failed && (
        <div className="border-t border-border/40 px-4 py-2">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary underline-offset-2 hover:underline"
          >
            Open in new tab
            <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
        </div>
      )}
    </figure>
  );
}

export type NrcPhotoReviewProps = {
  frontUrl?: string;
  backUrl?: string;
  applicantName: string;
  nrcText?: string;
  className?: string;
};

export function NrcPhotoReview({
  frontUrl,
  backUrl,
  applicantName,
  nrcText,
  className,
}: NrcPhotoReviewProps) {
  const sectionId = useId();
  const [lightbox, setLightbox] = useState<{ side: NrcSide; url: string } | null>(null);

  const closeLightbox = useCallback(() => setLightbox(null), []);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, closeLightbox]);

  const hasPhotos = !!(frontUrl || backUrl);

  return (
    <section
      className={cn("rounded-xl border border-border/60 bg-card p-4 sm:p-5", className)}
      aria-labelledby={sectionId}
    >
      <div className="mb-4 space-y-1">
        <h2 id={sectionId} className="text-base font-semibold">
          NRC verification
        </h2>
        <p className="text-sm text-muted-foreground">
          Compare the name on the ID with the applicant&apos;s payment account details. Verify both
          sides before approving.
        </p>
        {nrcText && (
          <p className="text-sm">
            <span className="text-muted-foreground">Registered NRC: </span>
            <span className="font-medium tabular-nums">{nrcText}</span>
          </p>
        )}
      </div>

      {!hasPhotos ? (
        <p className="rounded-lg border border-dashed border-border/60 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
          No NRC photos were submitted with this application.
        </p>
      ) : (
        <div
          className={cn(
            "grid gap-4",
            frontUrl && backUrl ? "lg:grid-cols-2" : "max-w-xl",
          )}
          role="group"
          aria-label="NRC photo review"
        >
          {frontUrl && (
            <NrcPhotoCard
              side="front"
              url={frontUrl}
              applicantName={applicantName}
              onEnlarge={() => setLightbox({ side: "front", url: frontUrl })}
            />
          )}
          {backUrl && (
            <NrcPhotoCard
              side="back"
              url={backUrl}
              applicantName={applicantName}
              onEnlarge={() => setLightbox({ side: "back", url: backUrl })}
            />
          )}
        </div>
      )}

      <Dialog open={!!lightbox} onOpenChange={(open) => !open && closeLightbox()}>
        <DialogContent className="max-h-[95vh] max-w-4xl overflow-hidden p-0">
          <DialogHeader className="border-b border-border/40 px-5 py-4">
            <DialogTitle>
              {lightbox?.side === "front" ? "NRC front" : "NRC back"} — {applicantName}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Full-size NRC photo for admin review. Press Escape to close.
            </DialogDescription>
          </DialogHeader>
          <div className="flex max-h-[calc(95vh-5rem)] items-center justify-center overflow-auto bg-muted/20 p-4">
            {lightbox && (
              <img
                src={lightbox.url}
                alt={`${lightbox.side === "front" ? "NRC front" : "NRC back"} — ${applicantName}`}
                className="max-h-[calc(95vh-7rem)] w-full object-contain"
              />
            )}
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-border/40 px-5 py-3">
            {lightbox && (
              <a
                href={lightbox.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary underline-offset-2 hover:underline"
              >
                Open in new tab
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            )}
            <Button type="button" variant="outline" size="sm" onClick={closeLightbox} className="ml-auto gap-1">
              <X className="h-3.5 w-3.5" aria-hidden />
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
