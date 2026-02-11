/**
 * AnimatedBackground - Dynamic animated background with educational/science-themed objects
 * Features floating atoms, molecules, test tubes, books, mathematical symbols, planets, etc.
 * Animations are smooth, subtle, and do not distract from the main content
 */
import { useState } from 'react';
import { useTheme } from '../hooks/useTheme';

// Educational/science-themed icons as SVG components
const educationalIcons = [
  // Atom symbol
  (key: string, className: string) => (
    <svg key={key} className={className} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="2" />
      <ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="currentColor" strokeWidth="1" />
      <ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="currentColor" strokeWidth="1" transform="rotate(60 12 12)" />
      <ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="currentColor" strokeWidth="1" transform="rotate(120 12 12)" />
    </svg>
  ),
  // Book icon
  (key: string, className: string) => (
    <svg key={key} className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  // Test tube / Flask
  (key: string, className: string) => (
    <svg key={key} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9 3h6v8l5 9a1 1 0 0 1-.9 1.5H4.9a1 1 0 0 1-.9-1.5l5-9V3z" />
      <path d="M9 3h6" strokeLinecap="round" />
      <path d="M6 15h12" />
    </svg>
  ),
  // Math pi symbol
  (key: string, className: string) => (
    <svg key={key} className={className} viewBox="0 0 24 24" fill="currentColor">
      <text x="4" y="18" fontSize="16" fontFamily="serif">π</text>
    </svg>
  ),
  // Planet / Globe
  (key: string, className: string) => (
    <svg key={key} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" />
      <ellipse cx="12" cy="12" rx="10" ry="4" />
      <path d="M2 12h20" />
    </svg>
  ),
  // Lightbulb (idea)
  (key: string, className: string) => (
    <svg key={key} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9 21h6M12 3a6 6 0 0 0-3 11.18V17a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-2.82A6 6 0 0 0 12 3z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  // Graduation cap
  (key: string, className: string) => (
    <svg key={key} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M22 10l-10-6-10 6 10 6z" />
      <path d="M6 12v5c0 2 3 3 6 3s6-1 6-3v-5" />
      <path d="M22 10v6" strokeLinecap="round" />
    </svg>
  ),
  // DNA helix
  (key: string, className: string) => (
    <svg key={key} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 15c6.667-6 13.333 0 20-6" strokeLinecap="round" />
      <path d="M2 9c6.667 6 13.333 0 20 6" strokeLinecap="round" />
      <path d="M5 12h2M17 12h2M11 6h2M11 18h2" strokeLinecap="round" />
    </svg>
  ),
  // Star
  (key: string, className: string) => (
    <svg key={key} className={className} viewBox="0 0 24 24" fill="currentColor">
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
    </svg>
  ),
  // Calculator
  (key: string, className: string) => (
    <svg key={key} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <rect x="6" y="4" width="12" height="5" rx="1" />
      <circle cx="8" cy="13" r="1" fill="currentColor" />
      <circle cx="12" cy="13" r="1" fill="currentColor" />
      <circle cx="16" cy="13" r="1" fill="currentColor" />
      <circle cx="8" cy="17" r="1" fill="currentColor" />
      <circle cx="12" cy="17" r="1" fill="currentColor" />
      <circle cx="16" cy="17" r="1" fill="currentColor" />
    </svg>
  ),
  // Sigma (sum symbol)
  (key: string, className: string) => (
    <svg key={key} className={className} viewBox="0 0 24 24" fill="currentColor">
      <text x="4" y="18" fontSize="18" fontFamily="serif">Σ</text>
    </svg>
  ),
  // Infinity symbol
  (key: string, className: string) => (
    <svg key={key} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 12c-2-2.5-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.5 6-4zm0 0c2 2.5 4 4 6 4a4 4 0 1 0 0-8c-2 0-4 1.5-6 4z" />
    </svg>
  ),
];

// Props for individual floating item
interface FloatingItem {
  id: number;
  iconIndex: number;
  size: number;
  x: number;
  y: number;
  duration: number;
  delay: number;
  rotation: number;
}

interface AnimatedBackgroundProps {
  className?: string;
  itemCount?: number;
}

// Helper function to generate floating items - called outside of render
function generateFloatingItems(count: number): FloatingItem[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    iconIndex: Math.floor(Math.random() * educationalIcons.length),
    size: Math.random() * 24 + 16, // 16-40px
    x: Math.random() * 100, // 0-100%
    y: Math.random() * 100, // 0-100%
    duration: Math.random() * 20 + 15, // 15-35s animation duration
    delay: Math.random() * -20, // Random start offset
    rotation: Math.random() * 360, // Initial rotation
  }));
}

export function AnimatedBackground({ className = '', itemCount = 20 }: AnimatedBackgroundProps) {
  const { theme } = useTheme();
  
  // Generate random floating items once on mount using lazy initialization
  const [floatingItems] = useState<FloatingItem[]>(() => generateFloatingItems(itemCount));

  return (
    <div 
      className={`fixed inset-0 overflow-hidden pointer-events-none ${className}`}
      aria-hidden="true"
    >
      {/* Gradient overlay for depth */}
      <div 
        className={`absolute inset-0 transition-opacity duration-500 ${
          theme === 'dark' 
            ? 'bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95' 
            : 'bg-gradient-to-br from-gray-50/95 via-white/90 to-gray-100/95'
        }`}
      />
      
      {/* Floating educational icons */}
      {floatingItems.map((item) => {
        const IconComponent = educationalIcons[item.iconIndex];
        
        return (
          <div
            key={item.id}
            className="absolute animate-float-subtle"
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              width: `${item.size}px`,
              height: `${item.size}px`,
              animationDuration: `${item.duration}s`,
              animationDelay: `${item.delay}s`,
              transform: `rotate(${item.rotation}deg)`,
            }}
          >
            {IconComponent(
              `icon-${item.id}`,
              `w-full h-full transition-colors duration-500 ${
                theme === 'dark' 
                  ? 'text-primary-400/20' 
                  : 'text-primary-600/15'
              }`
            )}
          </div>
        );
      })}
      
      {/* Subtle radial gradients for visual interest */}
      <div 
        className={`absolute w-96 h-96 rounded-full blur-3xl transition-opacity duration-500 ${
          theme === 'dark' 
            ? 'bg-primary-600/10' 
            : 'bg-primary-400/10'
        }`}
        style={{ top: '10%', left: '20%' }}
      />
      <div 
        className={`absolute w-80 h-80 rounded-full blur-3xl transition-opacity duration-500 ${
          theme === 'dark' 
            ? 'bg-secondary-600/10' 
            : 'bg-secondary-400/10'
        }`}
        style={{ bottom: '20%', right: '15%' }}
      />
    </div>
  );
}
