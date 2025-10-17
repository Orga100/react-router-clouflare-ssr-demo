import { Link } from "react-router";

export function Favicon() {
  return (
    <Link to="/">
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="32" height="32" rx="16" fill="var(--accent-9)" />
        <text
          x="16"
          y="20"
          fontFamily="Inter, sans-serif"
          fontWeight="bold"
          fontSize="14"
          fill="white"
          textAnchor="middle"
        >
          DEMO
        </text>
      </svg>
    </Link>
  );
}
