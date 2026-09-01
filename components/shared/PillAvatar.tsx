'use client'

import type { PillShapeType } from '@/types'

interface PillAvatarProps {
  shape?: PillShapeType
  color?: string
  colorSecondary?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showDescriptor?: boolean
  lang?: 'en' | 'bn'
}

const SIZE_MAP = {
  xs: { box: 'w-5 h-5', px: 20 },
  sm: { box: 'w-7 h-7', px: 28 },
  md: { box: 'w-10 h-10', px: 40 },
  lg: { box: 'w-14 h-14', px: 56 },
  xl: { box: 'w-20 h-20', px: 80 },
}

export function getPillDescriptor(
  shape: PillShapeType = 'round_tablet',
  color: string = '#FFFFFF',
  lang: 'en' | 'bn' = 'bn'
): string {
  const isBn = lang === 'bn'
  const isWhite = color.toUpperCase() === '#FFFFFF' || color.toLowerCase() === 'white'

  switch (shape) {
    case 'round_tablet':
      return isBn
        ? isWhite
          ? 'সাদা গোল ট্যাবলেট'
          : 'রঙিন গোল ট্যাবলেট'
        : isWhite
        ? 'White Round Tablet'
        : 'Round Tablet'
    case 'capsule':
      return isBn ? 'ক্যাপসুল' : 'Capsule'
    case 'caplet_oval':
      return isBn ? 'লম্বাটে ক্যাপলেট' : 'Oval Caplet'
    case 'syrup_liquid':
      return isBn ? 'সিরাপ / তরল' : 'Liquid / Syrup'
    case 'drops':
      return isBn ? 'আই / এয়ার ড্রপ' : 'Eye/Ear Drops'
    case 'inhaler':
      return isBn ? 'ইনহেলার' : 'Inhaler'
    case 'injection_pen':
      return isBn ? 'ইনসুলিন পেন' : 'Injection / Pen'
    default:
      return isBn ? 'ট্যাবলেট' : 'Tablet'
  }
}

export function PillAvatar({
  shape = 'round_tablet',
  color = '#FFFFFF',
  colorSecondary,
  size = 'md',
  className = '',
  showDescriptor = false,
  lang = 'bn',
}: PillAvatarProps) {
  const dim = SIZE_MAP[size] || SIZE_MAP.md
  const primaryColor = color || '#FFFFFF'
  const secColor = colorSecondary || (shape === 'capsule' ? '#0EA5E9' : primaryColor)
  const isWhite = primaryColor.toUpperCase() === '#FFFFFF' || primaryColor.toLowerCase() === 'white'

  // Render SVG based on shape
  const renderSvg = () => {
    switch (shape) {
      case 'capsule':
        return (
          <svg viewBox="0 0 64 64" className="w-full h-full drop-shadow-sm" fill="none">
            <defs>
              <linearGradient id="capGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={secColor} stopOpacity="1" />
                <stop offset="100%" stopColor={secColor} stopOpacity="0.75" />
              </linearGradient>
              <linearGradient id="capGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={primaryColor} stopOpacity="1" />
                <stop offset="100%" stopColor={primaryColor} stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="sheen" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Rotate for 45 deg medical capsule look */}
            <g transform="rotate(-35 32 32)">
              {/* Left Cap */}
              <path
                d="M16 22 C16 15 22 10 32 10 C32 10 32 10 32 10 L32 32 L16 32 Z"
                fill="url(#capGrad1)"
                stroke="#000000"
                strokeOpacity="0.15"
                strokeWidth="1.5"
              />
              {/* Right Body */}
              <path
                d="M32 32 L48 32 C48 32 48 32 48 32 C48 39 42 54 32 54 L32 32 Z"
                fill="url(#capGrad2)"
                stroke="#000000"
                strokeOpacity="0.15"
                strokeWidth="1.5"
              />
              {/* Central seam */}
              <line x1="32" y1="10" x2="32" y2="54" stroke="#000000" strokeOpacity="0.25" strokeWidth="1.5" />
              {/* Specular gloss highlight */}
              <ellipse cx="28" cy="18" rx="8" ry="3" fill="url(#sheen)" transform="rotate(-20 28 18)" />
            </g>
          </svg>
        )

      case 'caplet_oval':
        return (
          <svg viewBox="0 0 64 64" className="w-full h-full drop-shadow-sm" fill="none">
            <defs>
              <linearGradient id="capletGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={primaryColor} />
                <stop offset="100%" stopColor={primaryColor} stopOpacity="0.8" />
              </linearGradient>
            </defs>
            <g transform="rotate(-25 32 32)">
              <rect
                x="14"
                y="20"
                width="36"
                height="24"
                rx="12"
                fill="url(#capletGrad)"
                stroke={isWhite ? '#D1D5DB' : '#000000'}
                strokeOpacity={isWhite ? '1' : '0.2'}
                strokeWidth="2"
              />
              {/* Center break score line */}
              <line x1="32" y1="21" x2="32" y2="43" stroke="#9CA3AF" strokeWidth="1.5" strokeDasharray="1 1" />
              {/* Gloss line */}
              <path d="M 22 25 Q 32 22 42 25" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
            </g>
          </svg>
        )

      case 'syrup_liquid':
        return (
          <svg viewBox="0 0 64 64" className="w-full h-full drop-shadow-sm" fill="none">
            <defs>
              <linearGradient id="liquidGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={primaryColor} />
                <stop offset="100%" stopColor={primaryColor} stopOpacity="0.75" />
              </linearGradient>
            </defs>
            {/* Bottle cap */}
            <rect x="25" y="10" width="14" height="8" rx="2" fill="#4B5563" />
            {/* Neck */}
            <rect x="27" y="18" width="10" height="6" fill="#9CA3AF" />
            {/* Body */}
            <rect x="18" y="24" width="28" height="32" rx="6" fill="#F3F4F6" stroke="#9CA3AF" strokeWidth="2" />
            {/* Liquid inside */}
            <rect x="20" y="34" width="24" height="20" rx="4" fill="url(#liquidGrad)" />
            {/* Cross label */}
            <rect x="29" y="38" width="6" height="12" rx="1" fill="#FFFFFF" opacity="0.9" />
            <rect x="26" y="41" width="12" height="6" rx="1" fill="#FFFFFF" opacity="0.9" />
          </svg>
        )

      case 'drops':
        return (
          <svg viewBox="0 0 64 64" className="w-full h-full drop-shadow-sm" fill="none">
            <defs>
              <linearGradient id="dropGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38BDF8" />
                <stop offset="100%" stopColor="#0284C7" />
              </linearGradient>
            </defs>
            {/* Dropper bulb */}
            <rect x="26" y="8" width="12" height="10" rx="4" fill="#374151" />
            {/* Dropper bottle */}
            <path
              d="M22 22 L42 22 C44 22 46 24 46 27 L46 48 C46 53 42 56 37 56 L27 56 C22 56 18 53 18 48 L18 27 C18 24 20 22 22 22 Z"
              fill="#E0F2FE"
              stroke="#0284C7"
              strokeWidth="2"
            />
            {/* Water droplet icon */}
            <path
              d="M32 30 C32 30 38 38 38 41 C38 44.3 35.3 47 32 47 C28.7 47 26 44.3 26 41 C26 38 32 30 32 30 Z"
              fill="url(#dropGrad)"
            />
          </svg>
        )

      case 'inhaler':
        return (
          <svg viewBox="0 0 64 64" className="w-full h-full drop-shadow-sm" fill="none">
            <defs>
              <linearGradient id="inhalerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={primaryColor || '#0D9488'} />
                <stop offset="100%" stopColor="#115E59" />
              </linearGradient>
            </defs>
            {/* Canister body */}
            <rect x="22" y="8" width="20" height="34" rx="4" fill="url(#inhalerGrad)" stroke="#0F766E" strokeWidth="2" />
            {/* Mouthpiece */}
            <path
              d="M22 36 L12 44 C10 46 10 50 13 52 L26 54 C30 54 34 50 34 46 L34 36 Z"
              fill="#F0FDFA"
              stroke="#0F766E"
              strokeWidth="2"
            />
            {/* Spray nozzle hole */}
            <circle cx="16" cy="48" r="3" fill="#0F766E" />
          </svg>
        )

      case 'injection_pen':
        return (
          <svg viewBox="0 0 64 64" className="w-full h-full drop-shadow-sm" fill="none">
            <g transform="rotate(45 32 32)">
              {/* Plunger */}
              <rect x="30" y="6" width="4" height="8" rx="1" fill="#4B5563" />
              {/* Pen barrel */}
              <rect x="27" y="14" width="10" height="32" rx="2" fill="#F3F4F6" stroke="#4B5563" strokeWidth="2" />
              {/* Reservoir window */}
              <rect x="29" y="24" width="6" height="14" rx="1" fill="#38BDF8" opacity="0.8" />
              {/* Needle cap */}
              <path d="M29 46 L32 58 L35 46 Z" fill="#9CA3AF" />
            </g>
          </svg>
        )

      case 'round_tablet':
      default:
        return (
          <svg viewBox="0 0 64 64" className="w-full h-full drop-shadow-sm" fill="none">
            <defs>
              <radialGradient id="tabGrad" cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
                <stop offset="40%" stopColor={primaryColor} />
                <stop offset="100%" stopColor={primaryColor} stopOpacity="0.85" />
              </radialGradient>
              <filter id="bevel" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.15" />
              </filter>
            </defs>
            {/* Outer Round Tablet */}
            <circle
              cx="32"
              cy="32"
              r="22"
              fill="url(#tabGrad)"
              stroke={isWhite ? '#D1D5DB' : '#000000'}
              strokeOpacity={isWhite ? '1' : '0.15'}
              strokeWidth="2"
              filter="url(#bevel)"
            />
            {/* Scored division line */}
            <line
              x1="32"
              y1="14"
              x2="32"
              y2="50"
              stroke={isWhite ? '#9CA3AF' : '#000000'}
              strokeOpacity="0.3"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Specular curved gloss sheen */}
            <path
              d="M 18 24 A 18 18 0 0 1 32 14"
              stroke="#FFFFFF"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.8"
            />
          </svg>
        )
    }
  }

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <div className={`${dim.box} flex items-center justify-center shrink-0`}>
        {renderSvg()}
      </div>
      {showDescriptor && (
        <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
          {getPillDescriptor(shape, primaryColor, lang)}
        </span>
      )}
    </div>
  )
}
