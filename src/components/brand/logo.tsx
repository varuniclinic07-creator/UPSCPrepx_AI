import Image from 'next/image';

type LogoProps = {
  variant?: 'full' | 'mark';
  size?: number;
  className?: string;
  animated?: boolean;
};

export function Logo({ variant = 'full', size = 32, className = '', animated = false }: LogoProps) {
  const src = variant === 'mark' ? '/brand/upsc-prepx-logo-mark.svg' : '/brand/upsc-prepx-logo.svg';
  const aspect = variant === 'mark' ? 1 : 5;
  const width = variant === 'mark' ? size : size * aspect;
  return (
    <Image
      src={src}
      alt="UPSC PrepX AI"
      width={width}
      height={size}
      className={`${className} ${animated ? 'animate-logo-shimmer' : ''}`.trim()}
      priority
    />
  );
}
