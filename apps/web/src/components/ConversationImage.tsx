import { memo, useEffect, useState } from "react";
import { fetchLocalImageBlob } from "@/lib/api";

const LOCAL_PATH_PREFIXES = ["/Users/", "/tmp/", "/private/", "/var/", "/Volumes/"];

export type ConversationImageSource =
  | {
      type: "remote";
      url: string;
      label: string;
      title?: string;
    }
  | {
      type: "local";
      path: string;
      label: string;
      title?: string;
    };

type LocalImageLoadState =
  | {
      type: "idle";
    }
  | {
      type: "loading";
    }
  | {
      type: "loaded";
      url: string;
    }
  | {
      type: "failed";
    };

function decodePathname(pathname: string): string {
  try {
    return decodeURIComponent(pathname);
  } catch {
    return pathname;
  }
}

function localPathFromUrl(url: string): string | null {
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol === "file:") {
      return decodePathname(parsedUrl.pathname);
    }
    return null;
  } catch {
    return LOCAL_PATH_PREFIXES.find((prefix) => url.startsWith(prefix))
      ? url
      : null;
  }
}

export function imageSourceFromUrl(
  url: string,
  label: string,
): ConversationImageSource {
  const localPath = localPathFromUrl(url);
  if (localPath) {
    return {
      type: "local",
      path: localPath,
      label,
      title: localPath,
    };
  }

  return {
    type: "remote",
    url,
    label,
    title: url,
  };
}

export function localImageSource(
  imagePath: string,
  label: string,
): ConversationImageSource {
  return {
    type: "local",
    path: imagePath,
    label,
    title: imagePath,
  };
}

interface ConversationImageProps {
  source: ConversationImageSource;
  className?: string;
}

function ConversationImageComponent({
  source,
  className,
}: ConversationImageProps) {
  const sourceType = source.type;
  const localPath = source.type === "local" ? source.path : "";
  const [localState, setLocalState] = useState<LocalImageLoadState>({
    type: "idle",
  });

  useEffect(() => {
    if (sourceType === "remote") {
      setLocalState({ type: "idle" });
      return;
    }

    const controller = new AbortController();
    let active = true;
    let objectUrl: string | null = null;
    setLocalState({ type: "loading" });

    void fetchLocalImageBlob(localPath, { signal: controller.signal })
      .then((blob) => {
        if (!active) {
          return;
        }
        objectUrl = URL.createObjectURL(blob);
        setLocalState({
          type: "loaded",
          url: objectUrl,
        });
      })
      .catch(() => {
        if (active) {
          setLocalState({ type: "failed" });
        }
      });

    return () => {
      active = false;
      controller.abort();
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [sourceType, localPath]);

  const displayUrl =
    source.type === "remote"
      ? source.url
      : localState.type === "loaded"
        ? localState.url
        : null;

  if (displayUrl) {
    return (
      <a
        href={displayUrl}
        target="_blank"
        rel="noreferrer"
        title={source.title ?? source.label}
        className={`block w-fit max-w-full rounded-md border border-border/70 bg-background p-1 ${className ?? ""}`}
      >
        <img
          src={displayUrl}
          alt={source.label}
          loading="lazy"
          decoding="async"
          className="max-h-64 max-w-full rounded object-contain"
        />
      </a>
    );
  }

  if (localState.type === "failed") {
    return (
      <div
        role="img"
        aria-label={`${source.label} unavailable`}
        title={source.title ?? source.label}
        className={`flex h-28 w-48 max-w-full items-center justify-center rounded-md border border-border/70 bg-background px-3 text-center text-xs text-muted-foreground ${className ?? ""}`}
      >
        Image unavailable
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-label={`Loading ${source.label}`}
      title={source.title ?? source.label}
      className={`flex h-28 w-48 max-w-full items-center justify-center rounded-md border border-border/70 bg-background px-3 text-xs text-muted-foreground ${className ?? ""}`}
    >
      Loading image
    </div>
  );
}

export const ConversationImage = memo(ConversationImageComponent);
