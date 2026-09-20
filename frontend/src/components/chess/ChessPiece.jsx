import React from 'react';

/**
 * Crisp SVG Chess Pieces styled for the Chess Cure PMS luxury gold & obsidian theme.
 * type: 'k' | 'q' | 'r' | 'b' | 'n' | 'p'
 * color: 'w' (white/gold) | 'b' (black/obsidian)
 */
export default function ChessPiece({ type, color = 'w', className = 'w-10 h-10' }) {
  const isWhite = color === 'w';
  const pieceType = type ? type.toLowerCase() : '';

  // White pieces: Gleaming Ivory & Warm Gold rim
  // Black pieces: Deep Obsidian with subtle metallic edge
  const fillPrimary = isWhite ? '#fef3c7' : '#1e293b';
  const strokePrimary = isWhite ? '#b45309' : '#e2e8f0';
  const accentGlow = isWhite ? '#f59e0b' : '#94a3b8';

  switch (pieceType) {
    case 'k': // King
      return (
        <svg viewBox="0 0 45 45" className={className}>
          <g
            fill="none"
            fillRule="evenodd"
            stroke={strokePrimary}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22.5 11.63V6M20 8h5" stroke={accentGlow} strokeWidth="1.5" />
            <path
              d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5"
              fill={fillPrimary}
              stroke={strokePrimary}
            />
            <path
              d="M11.5 37c5.5 3.5 16.5 3.5 22 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-17 4V23.5C19 16 9.5 13 5.5 19.5c-3 6 6 10.5 6 10.5v7z"
              fill={fillPrimary}
              stroke={strokePrimary}
            />
            <path d="M11.5 30c5.5-3 16.5-3 22 0M11.5 33.5c5.5-3 16.5-3 22 0M11.5 37c5.5-3 16.5-3 22 0" />
          </g>
        </svg>
      );

    case 'q': // Queen
      return (
        <svg viewBox="0 0 45 45" className={className}>
          <g
            fill="none"
            fillRule="evenodd"
            stroke={strokePrimary}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path
              d="M9 26c8.5-1.5 21-1.5 27 0l2-12-7 11V11l-5.5 13.5-3-15-3 15-5.5-13.5V25L7 14l2 12z"
              fill={fillPrimary}
              stroke={strokePrimary}
            />
            <path
              d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 21 1 27 0 0 0 2-1 .5-2.5 0 0 0-1.5-1.5-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z"
              fill={fillPrimary}
              stroke={strokePrimary}
            />
            <path d="M11 38.5a35 35 0 0 0 23 0" stroke={strokePrimary} />
            <circle cx="6" cy="12" r="2" fill={accentGlow} />
            <circle cx="14" cy="9" r="2" fill={accentGlow} />
            <circle cx="22.5" cy="8" r="2" fill={accentGlow} />
            <circle cx="31" cy="9" r="2" fill={accentGlow} />
            <circle cx="39" cy="12" r="2" fill={accentGlow} />
          </g>
        </svg>
      );

    case 'r': // Rook
      return (
        <svg viewBox="0 0 45 45" className={className}>
          <g
            fill="none"
            fillRule="evenodd"
            stroke={strokePrimary}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path
              d="M9 39h27v-3H9v3zM12 36v-4h21v4H12zM11 14V9h4v2h5V9h5v2h5V9h4v5"
              fill={fillPrimary}
              stroke={strokePrimary}
            />
            <path
              d="M12 32l1-17h19l1 17H12z"
              fill={fillPrimary}
              stroke={strokePrimary}
            />
            <path d="M14 29.5v-13h17v13H14z" fill={isWhite ? '#fffbeb' : '#0f172a'} opacity="0.6" />
          </g>
        </svg>
      );

    case 'b': // Bishop
      return (
        <svg viewBox="0 0 45 45" className={className}>
          <g
            fill="none"
            fillRule="evenodd"
            stroke={strokePrimary}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path
              d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.35.49-2.32.47-3-.5 1.35-1.46 3-2 3-2z"
              fill={fillPrimary}
              stroke={strokePrimary}
            />
            <path
              d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z"
              fill={fillPrimary}
              stroke={strokePrimary}
            />
            <circle cx="22.5" cy="8" r="1.5" fill={accentGlow} stroke={strokePrimary} />
            <path d="M17.5 26h10M22.5 21v10" stroke={strokePrimary} />
          </g>
        </svg>
      );

    case 'n': // Knight
      return (
        <svg viewBox="0 0 45 45" className={className}>
          <g
            fill="none"
            fillRule="evenodd"
            stroke={strokePrimary}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path
              d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21"
              fill={fillPrimary}
              stroke={strokePrimary}
            />
            <path
              d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0-.62 1.36-1 1-1.37.51-2.21-.24-2-2 .5-1.5 3-4 3-4-2-1.5-2-5 .5-6.5 2-1 4-1.5 6.5-1 1.5.5 4 1.5 6 2.5z"
              fill={fillPrimary}
              stroke={strokePrimary}
            />
            <circle cx="15.5" cy="18.5" r="1.5" fill={accentGlow} />
            <path d="M20 27a12.5 12.5 0 0 1-5 2" stroke={strokePrimary} />
          </g>
        </svg>
      );

    case 'p': // Pawn
    default:
      return (
        <svg viewBox="0 0 45 45" className={className}>
          <g
            fill="none"
            fillRule="evenodd"
            stroke={strokePrimary}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path
              d="M22 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47C28.06 24.84 29 23.03 29 21c0-2.41-1.33-4.5-2.78-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z"
              fill={fillPrimary}
              stroke={strokePrimary}
            />
            <path d="M12 36.5c3-1 17-1 20 0" stroke={strokePrimary} />
          </g>
        </svg>
      );
  }
}
