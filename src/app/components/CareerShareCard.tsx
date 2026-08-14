import React from "react";

export interface CareerShareChannel {
  name: string;
  seasons: number;
  logo?: string;
  color: string;
  accent: string;
  prizes: Array<{ id: string; name: string; icon?: string; season: number; count: number }>;
}

export interface CareerSharePrize {
  id: string;
  name: string;
  icon?: string;
  count: number;
}

export interface CareerShareCardProps {
  id: string;
  streamerName: string;
  streamerType: string;
  personality: string;
  avatar: "avatar-a" | "avatar-b";
  isVerified: boolean;
  followers: string;
  popularity: number;
  seasons: number;
  cancellations: number;
  channels: CareerShareChannel[];
  prizes: CareerSharePrize[];
  rating: { label: string; color: string; emoji: string };
}

const avatarPixels = {
  "avatar-a": [
    "....BBBB....",
    "...BBBBBB...",
    "...BSSSSB...",
    "...SSSSSS...",
    "...S.SS.S...",
    "...SSSSSS...",
    "....SSSS....",
    "...RRRRRR...",
    "..RRRRRRRR..",
    "..RRRRRRRR..",
  ],
  "avatar-b": [
    "....PPPP....",
    "...PPPPPP...",
    "...PSSSSP...",
    "..PPSSSSPP..",
    "..P.SSSS.P..",
    "..PSSSSSSP..",
    "...PSSSSP...",
    "...CCCCCC...",
    "..CCCCCCCC..",
    "..CCCCCCCC..",
  ],
} as const;

const pixelColors: Record<string, string> = {
  B: "#38bdf8",
  P: "#f472b6",
  S: "#f1b98a",
  R: "#7c3aed",
  C: "#db2777",
};

function Avatar({ variant }: { variant: CareerShareCardProps["avatar"] }) {
  const pattern = avatarPixels[variant] || avatarPixels["avatar-a"];
  return (
    <g>
      {pattern.flatMap((row, y) =>
        row.split("").map((token, x) =>
          token === "." ? null : (
            <rect
              key={`${x}-${y}`}
              x={x * 14}
              y={y * 14}
              width="14"
              height="14"
              rx="1.5"
              fill={pixelColors[token] || "#ffffff"}
            />
          )
        )
      )}
    </g>
  );
}

function VerifiedBadge({ x, y, size = 32 }: { x: number; y: number; size?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle cx={size / 2} cy={size / 2} r={size / 2} fill="#1d9bf0" />
      <path
        d={`M${size * 0.28} ${size * 0.52} L${size * 0.44} ${size * 0.68} L${size * 0.74} ${size * 0.35}`}
        fill="none"
        stroke="#ffffff"
        strokeWidth={size * 0.12}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}

/** A clean, high-impact career share card designed for crisp image download. */
export function CareerShareCard(props: CareerShareCardProps) {
  const channelRows = props.channels.slice(0, 5);
  const channelCount = Math.max(1, channelRows.length);
  
  // Calculate dynamic card height & spacing based on number of channels
  const cardHeight = channelCount <= 2 ? 210 : channelCount === 3 ? 190 : channelCount === 4 ? 175 : 160;
  const cardGap = 16;
  const startY = 478;

  const streamerNameUpper = (props.streamerName.trim() || "STREAMER").toUpperCase();

  return (
    <svg
      id={props.id}
      xmlns="http://www.w3.org/2000/svg"
      width="1080"
      height="1350"
      viewBox="0 0 1080 1350"
      role="img"
      aria-label={`Resumen de carrera de ${props.streamerName}`}
    >
      <defs>
        <linearGradient id="card-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#070714" />
          <stop offset="55%" stopColor="#0c0a22" />
          <stop offset="100%" stopColor="#05050f" />
        </linearGradient>
        <linearGradient id="avatar-border" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>

      {/* Background */}
      <rect width="1080" height="1350" fill="url(#card-bg)" />
      
      {/* Outer Frame Border */}
      <rect
        x="36"
        y="36"
        width="1008"
        height="1278"
        rx="32"
        fill="none"
        stroke="#7c3aed"
        strokeOpacity="0.35"
        strokeWidth="2"
      />

      {/* Subtle Background Glow Orbs */}
      <circle cx="540" cy="210" r="220" fill="#7c3aed" fillOpacity="0.08" />
      <circle cx="880" cy="1080" r="260" fill="#f59e0b" fillOpacity="0.05" />

      {/* Top Header Branding */}
      <text
        x="540"
        y="90"
        textAnchor="middle"
        fill="#a78bfa"
        fontFamily="JetBrains Mono, monospace, sans-serif"
        fontSize="16"
        fontWeight="700"
        letterSpacing="6"
      >
        STREAMERO · RESUMEN DE CARRERA
      </text>
      <line x1="90" y1="106" x2="990" y2="106" stroke="#7c3aed" strokeOpacity="0.3" strokeWidth="1" />

      {/* Avatar Container */}
      <rect
        x="450"
        y="122"
        width="180"
        height="180"
        rx="28"
        fill="#121026"
        stroke="url(#avatar-border)"
        strokeWidth="2.5"
      />
      
      {/* Render Pixel Avatar Centered Inside Box */}
      <g transform="translate(456, 142)">
        <Avatar variant={props.avatar} />
      </g>

      {/* Verified Badge on Avatar Corner (if verified) */}
      {props.isVerified && <VerifiedBadge x={592} y={265} size={34} />}

      {/* Streamer Name */}
      <text
        x="540"
        y="352"
        textAnchor="middle"
        fill="#ffffff"
        fontFamily="system-ui, -apple-system, 'Barlow Condensed', sans-serif"
        fontSize="46"
        fontWeight="900"
        letterSpacing="1"
      >
        {streamerNameUpper}
      </text>

      {/* Followers & Popularity Large Stat Display */}
      <g>
        {/* Followers Stat */}
        <text
          x="410"
          y="393"
          textAnchor="middle"
          fill="#38bdf8"
          fontFamily="system-ui, -apple-system, 'Barlow Condensed', sans-serif"
          fontSize="34"
          fontWeight="900"
        >
          {props.followers}
        </text>
        <text
          x="410"
          y="418"
          textAnchor="middle"
          fill="#a78bfa"
          fontFamily="JetBrains Mono, monospace, sans-serif"
          fontSize="12"
          fontWeight="800"
          letterSpacing="2"
        >
          SEGUIDORES
        </text>

        {/* Center Divider Line */}
        <line x1="540" y1="374" x2="540" y2="418" stroke="#7c3aed" strokeOpacity="0.3" strokeWidth="1" />

        {/* Popularity Stat */}
        <text
          x="670"
          y="393"
          textAnchor="middle"
          fill="#f59e0b"
          fontFamily="system-ui, -apple-system, 'Barlow Condensed', sans-serif"
          fontSize="34"
          fontWeight="900"
        >
          {props.popularity}%
        </text>
        <text
          x="670"
          y="418"
          textAnchor="middle"
          fill="#a78bfa"
          fontFamily="JetBrains Mono, monospace, sans-serif"
          fontSize="12"
          fontWeight="800"
          letterSpacing="2"
        >
          POPULARIDAD
        </text>
      </g>

      {/* Section Divider */}
      <line x1="90" y1="434" x2="990" y2="434" stroke="#7c3aed" strokeOpacity="0.3" strokeWidth="1" />

      {/* Trayectoria Header */}
      <text
        x="75"
        y="462"
        fill="#f59e0b"
        fontFamily="JetBrains Mono, monospace, sans-serif"
        fontSize="17"
        fontWeight="800"
        letterSpacing="4"
      >
        TRAYECTORIA Y PREMIOS POR CANAL
      </text>

      {/* Channel History Cards */}
      {channelRows.length > 0 ? (
        channelRows.map((channel, idx) => {
          const cardY = startY + idx * (cardHeight + cardGap);
          const prizes = channel.prizes || [];

          return (
            <g key={`${channel.name}-${idx}`}>
              {/* Channel Container Card */}
              <rect
                x="75"
                y={cardY}
                width="930"
                height={cardHeight}
                rx="20"
                fill={channel.color}
                fillOpacity="0.1"
                stroke={channel.color}
                strokeOpacity="0.45"
                strokeWidth="2"
              />

              {/* Channel Logo or Initial Badge */}
              {channel.logo ? (
                <image
                  href={channel.logo}
                  x="100"
                  y={cardY + 16}
                  width="60"
                  height="36"
                  preserveAspectRatio="xMidYMid meet"
                />
              ) : (
                <g>
                  <rect
                    x="100"
                    y={cardY + 16}
                    width="60"
                    height="36"
                    rx="8"
                    fill={channel.color}
                    fillOpacity="0.3"
                  />
                  <text
                    x="130"
                    y={cardY + 39}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontFamily="system-ui, sans-serif"
                    fontSize="14"
                    fontWeight="800"
                  >
                    {channel.name.slice(0, 2).toUpperCase()}
                  </text>
                </g>
              )}

              {/* Channel Name */}
              <text
                x="175"
                y={cardY + 44}
                fill={channel.accent}
                fontFamily="system-ui, -apple-system, 'Barlow Condensed', sans-serif"
                fontSize="32"
                fontWeight="900"
              >
                {channel.name.toUpperCase()}
              </text>

              {/* Tenure Badge */}
              <rect
                x="825"
                y={cardY + 16}
                width="150"
                height="34"
                rx="17"
                fill={channel.color}
                fillOpacity="0.22"
                stroke={channel.color}
                strokeOpacity="0.6"
              />
              <text
                x="900"
                y={cardY + 38}
                textAnchor="middle"
                fill={channel.accent}
                fontFamily="JetBrains Mono, monospace, sans-serif"
                fontSize="13"
                fontWeight="800"
              >
                {channel.seasons} {channel.seasons === 1 ? "TEMPORADA" : "TEMPORADAS"}
              </text>

              {/* Inner Card Line Divider */}
              <line
                x1="100"
                y1={cardY + 60}
                x2="980"
                y2={cardY + 60}
                stroke={channel.color}
                strokeOpacity="0.25"
                strokeWidth="1"
              />

              {/* Premios Section Subtitle */}
              <text
                x="100"
                y={cardY + 118}
                fill="#c084fc"
                fontFamily="JetBrains Mono, monospace, sans-serif"
                fontSize="12"
                fontWeight="800"
                letterSpacing="2"
              >
                PREMIOS:
              </text>

              {/* Prize Trophy Icons (Double Size 72px, No Enclosing Box) */}
              {prizes.length > 0 ? (
                prizes.map((prize, pIdx) => {
                  const rowIdx = Math.floor(pIdx / 6);
                  const colIdx = pIdx % 6;
                  const itemX = 185 + colIdx * 120;
                  const itemY = cardY + 76 + rowIdx * 78;
                  const isGold = prize.id === "MARTIN_FIERRO_ORO";

                  return (
                    <g key={`${prize.id}-${pIdx}`}>
                      <title>{prize.name} (x{prize.count})</title>
                      
                      {prize.icon ? (
                        <image
                          href={prize.icon}
                          x={itemX}
                          y={itemY}
                          width="72"
                          height="72"
                          preserveAspectRatio="xMidYMid meet"
                        />
                      ) : (
                        <text x={itemX} y={itemY + 54} fill="#fbbf24" fontSize="54">
                          🏆
                        </text>
                      )}

                      <text
                        x={itemX + 78}
                        y={itemY + 44}
                        fill={isGold ? "#fbbf24" : "#e2e2fc"}
                        fontFamily="JetBrains Mono, monospace, sans-serif"
                        fontSize="18"
                        fontWeight="900"
                      >
                        x{prize.count}
                      </text>
                    </g>
                  );
                })
              ) : (
                <text
                  x="185"
                  y={cardY + 118}
                  fill="#6c6c88"
                  fontFamily="system-ui, -apple-system, sans-serif"
                  fontSize="14"
                  fontStyle="italic"
                >
                  Sin premios en este canal
                </text>
              )}
            </g>
          );
        })
      ) : (
        <text
          x="100"
          y="500"
          fill="#777790"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="18"
        >
          Sin contratos registrados.
        </text>
      )}

      {/* Footer Branding */}
      <line x1="90" y1="1275" x2="990" y2="1275" stroke="#7c3aed" strokeOpacity="0.3" strokeWidth="1" />
      <text
        x="540"
        y="1305"
        textAnchor="middle"
        fill="#707090"
        fontFamily="JetBrains Mono, monospace, sans-serif"
        fontSize="13"
        fontWeight="700"
        letterSpacing="3"
      >
        STREAMERO · MODO CARRERA
      </text>
    </svg>
  );
}

async function inlineSvgImages(svg: SVGSVGElement) {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  await Promise.all(
    Array.from(clone.querySelectorAll("image")).map(async (image) => {
      const href = image.getAttribute("href");
      if (!href || href.startsWith("data:")) return;
      try {
        const response = await fetch(href);
        const blob = await response.blob();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        image.setAttribute("href", dataUrl);
      } catch {
        /* Optional assets will use fallback icon text */
      }
    })
  );
  return clone;
}

export async function downloadCareerShareCard(id: string, filename: string) {
  const original = document.getElementById(id) as SVGSVGElement | null;
  if (!original) throw new Error("No se encontró la tarjeta de resumen.");
  await document.fonts?.ready;
  const svg = await inlineSvgImages(original);
  const source = new XMLSerializer().serializeToString(svg);
  const image = new Image();
  const url = URL.createObjectURL(new Blob([source], { type: "image/svg+xml;charset=utf-8" }));
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("No se pudo crear el resumen."));
    image.src = url;
  });
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  canvas.getContext("2d")?.drawImage(image, 0, 0);
  URL.revokeObjectURL(url);
  const pngUrl = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = pngUrl;
  link.download = filename;
  link.click();
}

