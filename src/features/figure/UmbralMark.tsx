import React from 'react';

export interface UmbralMarkProps {
  color?: string;
  size?: number;
  className?: string;
}

export const UmbralMark: React.FC<UmbralMarkProps> = ({
  color = '#639922',
  size = 24,
  className = '',
}) => {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`inline-block shrink-0 select-none ${className}`}
      fill="none"
      role="img"
      aria-label="Logo Umbral"
    >
      <path
        d="M 15 87 L 15 29.8 C 15 23.8 17.7 13.1 33.5 13.1 L 66.5 13.1 C 82.3 13.1 85 23.8 85 29.8 L 85 87 L 66.5 87 L 66.5 70.4 A 16.5 16.5 0 0 0 33.5 70.4 L 33.5 87 Z"
        fill={color}
      />
    </svg>
  );
};
