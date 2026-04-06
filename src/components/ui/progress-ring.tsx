'use client';

interface ProgressRingProps {
    progress: number;
    size?: number;
    strokeWidth?: number;
    color?: string;
    bgColor?: string;
    showLabel?: boolean;
    label?: string;
}

export function ProgressRing({
    progress,
    size = 120,
    strokeWidth = 8,
    color = '#007a8a',
    bgColor = 'hsl(var(--muted) / 0.3)',
    showLabel = true,
    label
}: ProgressRingProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg
                className="-rotate-90 transform"
                width={size}
                height={size}
            >
                <circle
                    stroke={bgColor}
                    fill="transparent"
                    strokeWidth={strokeWidth}
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                <circle
                    stroke={color}
                    fill="transparent"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                    className="transition-all duration-1000 ease-out"
                />
            </svg>
            {showLabel && (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-foreground">{progress}%</span>
                    {label && <span className="text-xs text-muted-foreground">{label}</span>}
                </div>
            )}
        </div>
    );
}

export function TripleProgressRing({
    rings
}: {
    rings: Array<{ progress: number; color: string; label: string }>
}) {
    const sizes = [144, 112, 80];
    const strokeWidths = [6, 7, 8];

    return (
        <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
            {rings.map((ring, i) => (
                <svg
                    key={ring.label}
                    className="absolute w-full h-full"
                    style={{ transform: `scale(${sizes[i] / 144}) rotate(-90deg)` }}
                    viewBox="0 0 100 100"
                >
                    <circle
                        className="text-muted/30 dark:text-slate-800"
                        cx="50" cy="50" r="44"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={strokeWidths[i]}
                    />
                    <circle
                        style={{ color: ring.color }}
                        cx="50" cy="50" r="44"
                        fill="none"
                        stroke="currentColor"
                        strokeDasharray="276"
                        strokeDashoffset={276 - (ring.progress / 100) * 276}
                        strokeLinecap="round"
                        strokeWidth={strokeWidths[i]}
                        className="transition-all duration-1000"
                    />
                </svg>
            ))}
            <div className="flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-foreground">{rings[0]?.progress}%</span>
            </div>
        </div>
    );
}
