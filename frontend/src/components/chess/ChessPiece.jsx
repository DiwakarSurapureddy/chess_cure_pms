import React from 'react';

/**
 * 3D Realistic Staunton Chess Pieces modeled after premium physical pieces.
 * Designed with glossy obsidian & metallic silver rim lighting for black pieces
 * (ensuring high visibility on dark squares) and polished warm ivory & gold for white pieces.
 *
 * type: 'k' | 'q' | 'r' | 'b' | 'n' | 'p'
 * color: 'w' (white) | 'b' (black)
 */
export default function ChessPiece({ type, color = 'w', className = 'w-10 h-10' }) {
  const isWhite = color === 'w';
  const pieceType = type ? type.toLowerCase() : 'p';

  // SVG Unique Def IDs based on color
  const prefix = isWhite ? 'wp_' : 'bp_';

  return (
    <svg
      viewBox="0 0 100 100"
      className={`${className} transition-transform duration-200 filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.65)]`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* White / Ivory 3D Gradients */}
        <linearGradient id={`${prefix}body`} x1="20%" y1="10%" x2="85%" y2="90%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="25%" stopColor="#faf5e8" />
          <stop offset="60%" stopColor="#eedbc0" />
          <stop offset="90%" stopColor="#d5ba94" />
          <stop offset="100%" stopColor="#b49366" />
        </linearGradient>

        <linearGradient id={`${prefix}rim`} x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="50%" stopColor="#ecd7b5" />
          <stop offset="100%" stopColor="#8d6e3f" />
        </linearGradient>

        <linearGradient id={`${prefix}base`} x1="30%" y1="0%" x2="70%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="35%" stopColor="#f3e5ce" />
          <stop offset="75%" stopColor="#cbab7e" />
          <stop offset="100%" stopColor="#7a582c" />
        </linearGradient>

        {/* Black / Obsidian 3D Gradients - with high-contrast bright rim */}
        <linearGradient id={`${prefix}black_body`} x1="20%" y1="10%" x2="85%" y2="90%">
          <stop offset="0%" stopColor="#4b5568" />
          <stop offset="25%" stopColor="#2d3748" />
          <stop offset="65%" stopColor="#1a202c" />
          <stop offset="90%" stopColor="#10141d" />
          <stop offset="100%" stopColor="#080a0f" />
        </linearGradient>

        <linearGradient id={`${prefix}black_rim`} x1="15%" y1="0%" x2="85%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="30%" stopColor="#e2e8f0" />
          <stop offset="70%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>

        <linearGradient id={`${prefix}black_base`} x1="30%" y1="0%" x2="70%" y2="100%">
          <stop offset="0%" stopColor="#64748b" />
          <stop offset="35%" stopColor="#2e3848" />
          <stop offset="75%" stopColor="#161c26" />
          <stop offset="100%" stopColor="#0b0e14" />
        </linearGradient>

        {/* Specular Gloss Shimmer */}
        <linearGradient id={`${prefix}gloss`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity={isWhite ? '0.7' : '0.55'} />
          <stop offset="40%" stopColor="#ffffff" stopOpacity={isWhite ? '0.25' : '0.15'} />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>

        <radialGradient id={`${prefix}head_glow`} cx="38%" cy="30%" r="55%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity={isWhite ? '0.85' : '0.65'} />
          <stop offset="30%" stopColor={isWhite ? '#ffffff' : '#cbd5e1'} stopOpacity={isWhite ? '0.4' : '0.2'} />
          <stop offset="100%" stopColor={isWhite ? '#ffffff' : '#000000'} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Render Specific Piece Type */}
      {renderPieceSvg(pieceType, isWhite, prefix)}
    </svg>
  );
}

function renderPieceSvg(type, isWhite, prefix) {
  const bodyGrad = isWhite ? `url(#${prefix}body)` : `url(#${prefix}black_body)`;
  const rimStroke = isWhite ? `url(#${prefix}rim)` : `url(#${prefix}black_rim)`;
  const baseGrad = isWhite ? `url(#${prefix}base)` : `url(#${prefix}black_base)`;
  const glossGrad = `url(#${prefix}gloss)`;
  const headGlow = `url(#${prefix}head_glow)`;
  const strokeW = isWhite ? '1.8' : '2.2';

  // Common tiered 3D base component for Staunton pieces
  const basePedestal = (
    <g>
      {/* Lower Base Ring */}
      <path
        d="M20 88 C 20 84, 28 82, 50 82 C 72 82, 80 84, 80 88 C 80 91, 72 93, 50 93 C 28 93, 20 91, 20 88 Z"
        fill={baseGrad}
        stroke={rimStroke}
        strokeWidth={strokeW}
      />
      {/* Upper Base Bevel */}
      <path
        d="M26 82 C 26 78, 33 77, 50 77 C 67 77, 74 78, 74 82 C 74 84, 67 86, 50 86 C 33 86, 26 84, 26 82 Z"
        fill={bodyGrad}
        stroke={rimStroke}
        strokeWidth="1.2"
      />
      {/* Top Base Collar Ring */}
      <path
        d="M32 77 C 32 74, 38 73, 50 73 C 62 73, 68 74, 68 77 C 68 79, 62 80, 50 80 C 38 80, 32 79, 32 77 Z"
        fill={baseGrad}
        stroke={rimStroke}
        strokeWidth="1"
      />
      {/* Base Light Reflection Highlight */}
      <path
        d="M28 85 C 33 83.5, 42 83, 52 83 C 58 83, 64 83.3, 70 84"
        stroke="#ffffff"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity={isWhite ? '0.75' : '0.55'}
      />
    </g>
  );

  switch (type) {
    case 'k': // ================= KING =================
      return (
        <g>
          {basePedestal}

          {/* King Body / Waist */}
          <path
            d="M34 74 C 36 62, 38 52, 35 44 C 33 40, 36 38, 40 38 L 60 38 C 64 38, 67 40, 65 44 C 62 52, 64 62, 66 74 Z"
            fill={bodyGrad}
            stroke={rimStroke}
            strokeWidth={strokeW}
            strokeLinejoin="round"
          />

          {/* Crown Base Rim */}
          <path
            d="M27 40 C 27 36, 35 34, 50 34 C 65 34, 73 36, 73 40 C 73 43, 65 45, 50 45 C 35 45, 27 43, 27 40 Z"
            fill={baseGrad}
            stroke={rimStroke}
            strokeWidth={strokeW}
          />

          {/* Crown Imperial Arches */}
          <path
            d="M28 38 C 26 26, 36 21, 50 24 C 64 21, 74 26, 72 38 C 65 32, 58 31, 50 31 C 42 31, 35 32, 28 38 Z"
            fill={bodyGrad}
            stroke={rimStroke}
            strokeWidth={strokeW}
          />

          {/* Crown Jewel Velvet Arch Fill */}
          <path
            d="M34 35 C 34 26, 42 23, 50 23 C 58 23, 66 26, 66 35 Z"
            fill={isWhite ? '#fdf0d5' : '#1e2430'}
            stroke={rimStroke}
            strokeWidth="1"
          />

          {/* Crown Finial Cross Base Orb */}
          <circle
            cx="50"
            cy="21"
            r="3.5"
            fill={baseGrad}
            stroke={rimStroke}
            strokeWidth="1.2"
          />

          {/* King Cross Finial */}
          <path
            d="M48 9 L 52 9 L 52 14 L 57 14 L 57 18 L 52 18 L 52 21 L 48 21 L 48 18 L 43 18 L 43 14 L 48 14 Z"
            fill={baseGrad}
            stroke={rimStroke}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {/* Cross Specular Highlight */}
          <path
            d="M49 10 L 51 10 L 51 15 L 56 15"
            stroke="#ffffff"
            strokeWidth="1"
            strokeLinecap="round"
            opacity="0.8"
          />

          {/* Body Gloss Specular Sweep */}
          <path
            d="M38 46 C 41 54, 41 64, 40 70"
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity={isWhite ? '0.7' : '0.5'}
          />
        </g>
      );

    case 'q': // ================= QUEEN =================
      return (
        <g>
          {basePedestal}

          {/* Queen Body */}
          <path
            d="M35 74 C 37 62, 39 52, 36 44 C 34 40, 37 38, 41 38 L 59 38 C 63 38, 66 40, 64 44 C 61 52, 63 62, 65 74 Z"
            fill={bodyGrad}
            stroke={rimStroke}
            strokeWidth={strokeW}
            strokeLinejoin="round"
          />

          {/* Coronet Collar */}
          <path
            d="M29 42 C 29 38, 36 36, 50 36 C 64 36, 71 38, 71 42 C 71 45, 64 47, 50 47 C 36 47, 29 45, 29 42 Z"
            fill={baseGrad}
            stroke={rimStroke}
            strokeWidth={strokeW}
          />

          {/* Queen Flared Coronet with 5 Spires */}
          <path
            d="M30 40 L 25 21 L 37 32 L 50 19 L 63 32 L 75 21 L 70 40 Z"
            fill={bodyGrad}
            stroke={rimStroke}
            strokeWidth={strokeW}
            strokeLinejoin="round"
          />

          {/* 5 Coronet Pearls / Spheres on Spire Tips */}
          <circle cx="25" cy="20" r="3.2" fill={baseGrad} stroke={rimStroke} strokeWidth="1.2" />
          <circle cx="37" cy="30" r="2.8" fill={baseGrad} stroke={rimStroke} strokeWidth="1.2" />
          <circle cx="50" cy="18" r="3.8" fill={baseGrad} stroke={rimStroke} strokeWidth="1.2" />
          <circle cx="63" cy="30" r="2.8" fill={baseGrad} stroke={rimStroke} strokeWidth="1.2" />
          <circle cx="75" cy="20" r="3.2" fill={baseGrad} stroke={rimStroke} strokeWidth="1.2" />

          {/* Pearl Highlights */}
          <circle cx="24" cy="19" r="1.2" fill="#ffffff" opacity="0.9" />
          <circle cx="49" cy="17" r="1.5" fill="#ffffff" opacity="0.9" />
          <circle cx="74" cy="19" r="1.2" fill="#ffffff" opacity="0.9" />

          {/* Body Gloss Specular */}
          <path
            d="M39 46 C 42 54, 42 64, 41 70"
            stroke="#ffffff"
            strokeWidth="2.2"
            strokeLinecap="round"
            opacity={isWhite ? '0.7' : '0.5'}
          />
        </g>
      );

    case 'r': // ================= ROOK =================
      return (
        <g>
          {basePedestal}

          {/* Rook Tower Column */}
          <path
            d="M34 74 L 36 45 L 64 45 L 66 74 Z"
            fill={bodyGrad}
            stroke={rimStroke}
            strokeWidth={strokeW}
          />

          {/* Column Neck Ring */}
          <path
            d="M30 45 C 30 42, 37 41, 50 41 C 63 41, 70 42, 70 45 C 70 47, 63 48, 50 48 C 37 48, 30 47, 30 45 Z"
            fill={baseGrad}
            stroke={rimStroke}
            strokeWidth={strokeW}
          />

          {/* Tower Head Flared Walls */}
          <path
            d="M28 43 L 28 27 L 72 27 L 72 43 Z"
            fill={bodyGrad}
            stroke={rimStroke}
            strokeWidth={strokeW}
          />

          {/* Crenellations (4 Merlons and 3 Embrasures) */}
          <path
            d="M28 28 L 28 20 L 36 20 L 36 25 L 45 25 L 45 20 L 55 20 L 55 25 L 64 25 L 64 20 L 72 20 L 72 28 Z"
            fill={baseGrad}
            stroke={rimStroke}
            strokeWidth={strokeW}
            strokeLinejoin="round"
          />

          {/* Machicolation Shadow Groove */}
          <path
            d="M32 35 L 68 35"
            stroke={isWhite ? '#a18151' : '#0a0d14'}
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Column Specular Highlights */}
          <path
            d="M38 48 L 37 70"
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity={isWhite ? '0.7' : '0.55'}
          />
          <path
            d="M30 22 L 34 22"
            stroke="#ffffff"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.8"
          />
        </g>
      );

    case 'b': // ================= BISHOP =================
      return (
        <g>
          {basePedestal}

          {/* Bishop Neck & Body */}
          <path
            d="M36 74 C 38 60, 42 50, 40 45 C 38 41, 41 39, 44 39 L 56 39 C 59 39, 62 41, 60 45 C 58 50, 62 60, 64 74 Z"
            fill={bodyGrad}
            stroke={rimStroke}
            strokeWidth={strokeW}
          />

          {/* Bishop Collar Ring */}
          <path
            d="M33 42 C 33 39, 39 37, 50 37 C 61 37, 67 39, 67 42 C 67 44, 61 46, 50 46 C 39 46, 33 44, 33 42 Z"
            fill={baseGrad}
            stroke={rimStroke}
            strokeWidth={strokeW}
          />

          {/* Bishop Miter Dome */}
          <path
            d="M34 40 C 31 31, 35 18, 50 16 C 65 18, 69 31, 66 40 C 62 43, 38 43, 34 40 Z"
            fill={bodyGrad}
            stroke={rimStroke}
            strokeWidth={strokeW}
          />

          {/* Diagonal Miter Cut Slit */}
          <path
            d="M45 23 L 57 32"
            stroke={isWhite ? '#8d6b38' : '#080a0f'}
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <path
            d="M45 22 L 57 31"
            stroke="#ffffff"
            strokeWidth="1"
            strokeLinecap="round"
            opacity="0.75"
          />

          {/* Top Sphere Finial */}
          <circle
            cx="50"
            cy="13"
            r="4"
            fill={baseGrad}
            stroke={rimStroke}
            strokeWidth="1.4"
          />
          <circle cx="49" cy="12" r="1.4" fill="#ffffff" opacity="0.9" />

          {/* Head Specular Sheen */}
          <path
            d="M37 26 C 37 21, 42 18, 48 18"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            opacity={isWhite ? '0.75' : '0.6'}
          />
        </g>
      );

    case 'n': // ================= KNIGHT =================
      return (
        <g>
          {basePedestal}

          {/* Staunton Horse Body & Arching Neck */}
          <path
            d="M34 74 C 34 65, 33 55, 31 46 C 30 40, 27 37, 24 37 C 22 37, 22 34, 25 31 C 29 27, 36 21, 44 19 C 47 16, 49 14, 52 14 C 53 14, 53 17, 52 20 C 58 20, 66 23, 71 31 C 75 38, 74 46, 73 54 C 71 63, 68 68, 66 74 Z"
            fill={bodyGrad}
            stroke={rimStroke}
            strokeWidth={strokeW}
            strokeLinejoin="round"
          />

          {/* Muzzle, Mouth & Chin Contour */}
          <path
            d="M24 37 C 22 41, 23 45, 27 47 C 32 49, 39 45, 42 41 C 44 38, 38 34, 31 34 C 27 34, 25 35, 24 37 Z"
            fill={baseGrad}
            stroke={rimStroke}
            strokeWidth="1.2"
          />

          {/* Mane Ridges */}
          <path
            d="M52 19 C 56 21, 60 21, 62 25"
            stroke={rimStroke}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M58 27 C 63 29, 67 31, 68 36"
            stroke={rimStroke}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M65 37 C 69 40, 71 44, 71 49"
            stroke={rimStroke}
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Horse Alert Ear */}
          <path
            d="M48 15 L 53 9 L 55 16 Z"
            fill={baseGrad}
            stroke={rimStroke}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M49 14 L 52 10" stroke="#ffffff" strokeWidth="0.8" opacity="0.8" />

          {/* Eye */}
          <ellipse
            cx="37"
            cy="27"
            rx="2.5"
            ry="2"
            fill={isWhite ? '#785319' : '#080a0f'}
            stroke={rimStroke}
            strokeWidth="0.8"
          />
          <circle cx="36.5" cy="26.5" r="0.8" fill="#ffffff" />

          {/* Nostril */}
          <circle cx="26" cy="42" r="1.2" fill={isWhite ? '#785319' : '#080a0f'} />

          {/* Chest & Muscle Specular Highlights */}
          <path
            d="M34 49 C 33 55, 33 63, 35 69"
            stroke="#ffffff"
            strokeWidth="2.2"
            strokeLinecap="round"
            opacity={isWhite ? '0.7' : '0.55'}
          />
          <path
            d="M40 22 C 45 21, 52 22, 57 26"
            stroke="#ffffff"
            strokeWidth="1.8"
            strokeLinecap="round"
            opacity={isWhite ? '0.8' : '0.6'}
          />
        </g>
      );

    case 'p': // ================= PAWN =================
    default:
      return (
        <g>
          {basePedestal}

          {/* Pawn Tapering Stem */}
          <path
            d="M37 74 C 39 63, 42 55, 41 49 C 39 46, 42 44, 45 44 L 55 44 C 58 44, 61 46, 59 49 C 58 55, 61 63, 63 74 Z"
            fill={bodyGrad}
            stroke={rimStroke}
            strokeWidth={strokeW}
          />

          {/* Stem Collar Ring */}
          <path
            d="M34 46 C 34 43, 40 42, 50 42 C 60 42, 66 43, 66 46 C 66 48, 60 49, 50 49 C 40 49, 34 48, 34 46 Z"
            fill={baseGrad}
            stroke={rimStroke}
            strokeWidth={strokeW}
          />

          {/* Spherical Head with 3D Radial Glow */}
          <circle
            cx="50"
            cy="31"
            r="15"
            fill={bodyGrad}
            stroke={rimStroke}
            strokeWidth={strokeW}
          />

          {/* Specular Radial Glow on Head */}
          <circle
            cx="50"
            cy="31"
            r="14.5"
            fill={headGlow}
          />

          {/* Glossy White Circular Specular Spot (Matches Image 2) */}
          <ellipse
            cx="44"
            cy="24"
            rx="4.5"
            ry="3.5"
            transform="rotate(-25 44 24)"
            fill="#ffffff"
            opacity={isWhite ? '0.85' : '0.75'}
          />

          {/* Stem Specular Highlight */}
          <path
            d="M40 51 C 41 57, 41 64, 40 69"
            stroke="#ffffff"
            strokeWidth="2.2"
            strokeLinecap="round"
            opacity={isWhite ? '0.7' : '0.55'}
          />
        </g>
      );
  }
}
