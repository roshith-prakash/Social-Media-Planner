import React from "react";

// Official Brand Colors
export const YOUTUBE_RED = "#FF0000";
export const INSTAGRAM_PINK = "#E1306C";
export const INSTAGRAM_GRADIENT =
  "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)";

/**
 * YouTube Logo
 * Renders the authentic YouTube red rounded rectangle with centered white play triangle.
 */
export function YouTubeLogo({
  size = 18,
  className = "",
  style = {},
  variant = "badge",
}) {
  if (variant === "badge" || variant === "color") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={{
          verticalAlign: "middle",
          display: "inline-block",
          flexShrink: 0,
          ...style,
        }}
        aria-label="YouTube"
      >
        {/* Red rounded rectangle */}
        <path
          d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"
          fill="#FF0000"
        />
        {/* White play triangle */}
        <path d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="#FFFFFF" />
      </svg>
    );
  }

  // Monochrome / currentColor cutout
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        verticalAlign: "middle",
        display: "inline-block",
        flexShrink: 0,
        ...style,
      }}
      aria-label="YouTube"
    >
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

/**
 * Instagram Logo
 * Renders the authentic Instagram app icon gradient with white camera glyph,
 * or the gradient camera outline.
 */
export function InstagramLogo({
  size = 18,
  className = "",
  style = {},
  variant = "badge",
}) {
  const gradId = React.useId ? React.useId().replace(/:/g, "") : "ig";

  if (variant === "badge" || variant === "color") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={{
          verticalAlign: "middle",
          display: "inline-block",
          flexShrink: 0,
          borderRadius: size >= 20 ? 5 : 4,
          ...style,
        }}
        aria-label="Instagram"
      >
        <defs>
          <radialGradient id={`rad-${gradId}`} cx="0.2" cy="1" r="1.1">
            <stop offset="0%" stopColor="#fdf497" />
            <stop offset="10%" stopColor="#fdf497" />
            <stop offset="50%" stopColor="#fd5949" />
            <stop offset="70%" stopColor="#d6249f" />
            <stop offset="100%" stopColor="#285AEB" />
          </radialGradient>
        </defs>
        {/* Gradient rounded background */}
        <rect width="24" height="24" rx="6" fill={`url(#rad-${gradId})`} />
        {/* White Instagram camera outline, center lens circle, and flash dot */}
        <rect
          x="5.5"
          y="5.5"
          width="13"
          height="13"
          rx="3.5"
          stroke="#FFFFFF"
          strokeWidth="1.75"
        />
        <circle cx="12" cy="12" r="3.25" stroke="#FFFFFF" strokeWidth="1.75" />
        <circle cx="15.75" cy="8.25" r="0.9" fill="#FFFFFF" />
      </svg>
    );
  }

  // Line glyph
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        verticalAlign: "middle",
        display: "inline-block",
        flexShrink: 0,
        ...style,
      }}
      aria-label="Instagram"
    >
      <defs>
        <linearGradient
          id={`lin-${gradId}`}
          x1="0%"
          y1="100%"
          x2="100%"
          y2="0%"
        >
          <stop offset="0%" stopColor="#f09433" />
          <stop offset="25%" stopColor="#e6683c" />
          <stop offset="50%" stopColor="#dc2743" />
          <stop offset="75%" stopColor="#cc2366" />
          <stop offset="100%" stopColor="#bc1888" />
        </linearGradient>
      </defs>
      <rect
        x="2.5"
        y="2.5"
        width="19"
        height="19"
        rx="5.5"
        stroke={`url(#lin-${gradId})`}
        strokeWidth="2.2"
      />
      <circle
        cx="12"
        cy="12"
        r="4.5"
        stroke={`url(#lin-${gradId})`}
        strokeWidth="2.2"
      />
      <circle cx="17.2" cy="6.8" r="1.2" fill={`url(#lin-${gradId})`} />
    </svg>
  );
}

/**
 * Universal Platform Icon Component
 */
export function PlatformIcon({
  platform,
  size = 18,
  variant = "badge",
  style = {},
  className = "",
}) {
  const norm = String(platform || "").toLowerCase();
  if (norm === "youtube") {
    return (
      <YouTubeLogo
        size={size}
        variant={variant}
        style={style}
        className={className}
      />
    );
  }
  if (norm === "instagram") {
    return (
      <InstagramLogo
        size={size}
        variant={variant}
        style={style}
        className={className}
      />
    );
  }
  // Video clapper / Project fallback
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        verticalAlign: "middle",
        display: "inline-block",
        flexShrink: 0,
        color: "var(--lilac-dark, #7152BC)",
        ...style,
      }}
      className={className}
      aria-label="Project"
    >
      <path d="M19 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm-7 2h3.5l1 2H13l-1-2zm-5 0h3.5l1 2H8L7 6zm12 12H5V10h14v8z" />
    </svg>
  );
}

export default PlatformIcon;
