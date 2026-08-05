import React from "react";

const LOGO_MODULES = import.meta.glob("../../../assets/logos/*.{png,jpg,jpeg,svg,webp}", {
  eager: true,
  import: "default",
}) as Record<string, string | { default?: string }>;

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function buildCandidateNames(channelName: string, shortName?: string) {
  const names = [channelName, shortName]
    .filter(Boolean)
    .map((value) => value?.trim())
    .filter(Boolean) as string[];

  const normalized = names.map((value) => normalize(value));
  const unique = Array.from(new Set([...normalized, ...names.map((value) => normalize(value).replace(/-+/g, ""))]));

  return unique.flatMap((value) => [
    `${value}.svg`,
    `${value}.png`,
    `${value}.jpg`,
    `${value}.jpeg`,
    `${value}.webp`,
  ]);
}

export function getChannelLogoUrl(channelName: string, shortName?: string) {
  const candidates = buildCandidateNames(channelName, shortName);

  const match = Object.entries(LOGO_MODULES).find(([path]) => {
    const fileName = path.split("/").pop()?.toLowerCase();
    return fileName ? candidates.includes(fileName) : false;
  });

  if (!match) return null;

  const resolved = match[1];
  if (typeof resolved === "string") return resolved;
  return resolved.default ?? null;
}

interface ChannelLogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  channelName: string;
  shortName?: string;
  fallbackClassName?: string;
  fallbackStyle?: React.CSSProperties;
}

export function ChannelLogo({
  channelName,
  shortName,
  alt,
  className,
  fallbackClassName,
  style,
  fallbackStyle,
  ...rest
}: ChannelLogoProps) {
  const [didError, setDidError] = React.useState(false);
  const src = React.useMemo(() => getChannelLogoUrl(channelName, shortName), [channelName, shortName]);

  if (!src || didError) {
    const initials = (shortName ?? channelName)
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";

    return (
      <div
        className={fallbackClassName ?? "flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xs font-semibold uppercase text-white"}
        style={fallbackStyle}
        title={alt}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt ?? shortName ?? channelName}
      className={className ?? "h-5 w-5 object-contain shrink-0"}
      style={style}
      onError={() => setDidError(true)}
      {...rest}
    />
  );
}
