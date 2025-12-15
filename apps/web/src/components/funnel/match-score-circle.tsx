"use client";

interface MatchScoreCircleProps {
  score: number;
}

export function MatchScoreCircle({ score }: MatchScoreCircleProps) {
  const radius = 9;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getColor = () => {
    if (score >= 80) return "text-emerald-600";
    if (score >= 50) return "text-amber-600";
    return "text-rose-600";
  };

  return (
    <div className="flex items-center gap-1.5">
      <svg
        width="22"
        height="22"
        viewBox="0 0 22 22"
        className={getColor()}
        role="img"
        aria-label={`Совпадение ${score}%`}
      >
        <circle
          cx="11"
          cy="11"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          opacity="0.15"
        />
        <circle
          cx="11"
          cy="11"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform="rotate(-90 11 11)"
        />
      </svg>
      <span className="text-xs font-semibold">{score}%</span>
    </div>
  );
}
