import type { CSSProperties, SVGProps } from 'react'

interface NexoraLogoProps extends SVGProps<SVGSVGElement> {
  showText?: boolean
  size?: number
  className?: string
  style?: CSSProperties
}

export default function NexoraLogo({
  showText = true,
  size = 80,
  className,
  style,
  ...props
}: NexoraLogoProps) {
  const width = showText ? size * 5 : size

  return (
    <svg
      width={width}
      height={size}
      viewBox={showText ? '0 0 500 100' : '0 0 100 100'}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Nexora IA"
      className={className}
      style={style}
      {...props}
    >
      <defs>
        {/* Main brand gradient */}
        <linearGradient
          id="nexoraBrand"
          x1="15"
          y1="12"
          x2="88"
          y2="88"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#A5FFFF" />
          <stop offset="0.22" stopColor="#42E4FF" />
          <stop offset="0.52" stopColor="#3B9BFF" />
          <stop offset="0.78" stopColor="#625CFF" />
          <stop offset="1" stopColor="#B04DFF" />
        </linearGradient>

        {/* Secondary light */}
        <linearGradient
          id="nexoraLight"
          x1="25"
          y1="18"
          x2="78"
          y2="82"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#EFFFFF" />
          <stop offset="0.3" stopColor="#72EFFF" />
          <stop offset="0.7" stopColor="#628BFF" />
          <stop offset="1" stopColor="#B56AFF" />
        </linearGradient>

        {/* Text */}
        <linearGradient
          id="nexoraText"
          x1="118"
          y1="30"
          x2="390"
          y2="72"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.58" stopColor="#E7ECFF" />
          <stop offset="1" stopColor="#B7C0FF" />
        </linearGradient>

        {/* Soft glow */}
        <filter
          id="nexoraGlow"
          x="-100%"
          y="-100%"
          width="300%"
          height="300%"
        >
          <feGaussianBlur stdDeviation="4" />
        </filter>

        {/* Deep inner shadow */}
        <linearGradient
          id="nexoraDepth"
          x1="28"
          y1="25"
          x2="75"
          y2="78"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#07101E" />
          <stop offset="0.5" stopColor="#050817" />
          <stop offset="1" stopColor="#120822" />
        </linearGradient>
      </defs>

      {/* Atmospheric glow */}
      <path
        d="
          M50 7
          C74 7 93 26 93 50
          C93 74 74 93 50 93
          C26 93 7 74 7 50
          C7 26 26 7 50 7Z
        "
        fill="url(#nexoraBrand)"
        opacity="0.16"
        filter="url(#nexoraGlow)"
      />

      {/* Outer sculpted shell */}
      <path
        d="
          M50 9
          C62 10 73 15 81 24
          C89 33 92 44 91 55
          C90 67 84 77 74 84
          C65 91 54 94 43 91
          C31 89 21 82 15 72
          C9 62 7 50 10 39
          C13 28 20 19 30 14
          C36 11 43 9 50 9Z

          M50 22
          C41 22 33 26 27 32
          C21 39 19 47 21 56
          C23 65 28 72 36 76
          C44 80 53 80 61 76
          C69 72 75 65 77 56
          C79 47 77 39 71 32
          C65 26 58 22 50 22Z
        "
        fill="url(#nexoraBrand)"
        fillRule="evenodd"
      />

      {/* Sculpted inner cavity */}
      <path
        d="
          M50 29
          C58 29 65 33 69 39
          C74 46 74 54 70 61
          C66 68 59 72 50 72
          C41 72 34 68 30 61
          C26 54 26 46 31 39
          C35 33 42 29 50 29Z
        "
        fill="url(#nexoraDepth)"
      />

      {/* Floating upper blade */}
      <path
        d="
          M50 15
          C57 16 64 19 70 24
          L57 39
          C54 36 52 34 48 33
          L50 15Z
        "
        fill="url(#nexoraLight)"
        opacity="0.95"
      />

      {/* Dynamic left blade */}
      <path
        d="
          M20 37
          C23 30 29 24 36 20
          L45 34
          C40 36 36 40 33 45
          L20 37Z
        "
        fill="url(#nexoraBrand)"
        opacity="0.9"
      />

      {/* Dynamic lower blade */}
      <path
        d="
          M31 76
          C38 81 46 83 54 82
          L50 68
          C45 68 40 66 36 63
          L31 76Z
        "
        fill="url(#nexoraBrand)"
        opacity="0.8"
      />

      {/* Central intelligence core */}
      <circle
        cx="50"
        cy="50"
        r="11"
        fill="url(#nexoraBrand)"
      />

      <circle
        cx="50"
        cy="50"
        r="6"
        fill="#07101B"
      />

      <circle
        cx="48"
        cy="48"
        r="2.4"
        fill="#FFFFFF"
        opacity="0.95"
      />

      {/* Small orbital accent */}
      <path
        d="M62 42C66 46 67 52 65 57"
        stroke="url(#nexoraLight)"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.85"
      />

      {/* Brand wordmark */}
      {showText && (
        <g>
          <text
            x="115"
            y="64"
            fill="url(#nexoraText)"
            fontFamily="Inter, Arial, sans-serif"
            fontSize="40"
            fontWeight="600"
            letterSpacing="-2"
          >
            Nexora
          </text>

          <text
            x="302"
            y="64"
            fill="url(#nexoraBrand)"
            fontFamily="Inter, Arial, sans-serif"
            fontSize="40"
            fontWeight="700"
            letterSpacing="-1.5"
          >
            IA
          </text>
        </g>
      )}
    </svg>
  )
}