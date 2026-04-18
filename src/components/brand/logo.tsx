import Image from 'next/image';
import Link from 'next/link';

type LogoVariant = 'full' | 'mark';
type LegacySize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

type LogoProps = {
  variant?: LogoVariant;
  size?: number | LegacySize;
  className?: string;
  animated?: boolean;
  href?: string;
};

const LEGACY_SIZES: Record<LegacySize, number> = {
  xs: 20,
  sm: 24,
  md: 32,
  lg: 40,
  xl: 56,
};

export function Logo({
  variant = 'full',
  size = 32,
  className = '',
  animated = false,
  href,
}: LogoProps) {
  const px = typeof size === 'number' ? size : LEGACY_SIZES[size];
  const src = variant === 'mark' ? '/brand/upsc-prepx-logo-mark.svg' : '/brand/upsc-prepx-logo.svg';
  const aspect = variant === 'mark' ? 1 : 5;
  const width = variant === 'mark' ? px : px * aspect;
  const img = (
    <Image
      src={src}
      alt="UPSC PrepX AI"
      width={width}
      height={px}
      className={`${className} ${animated ? 'animate-logo-shimmer' : ''}`.trim()}
      priority
      unoptimized
    />
  );
  return href ? (
    <Link href={href} aria-label="UPSC PrepX AI home">
      {img}
    </Link>
  ) : (
    img
  );
}

/** Back-compat: mark-only variant as a separate export used by legacy call sites. */
export function LogoMark(props: Omit<LogoProps, 'variant'>) {
  return <Logo {...props} variant="mark" />;
}
