/**
 * Logo Component - Displays the Aurikrex Academy logo
 * A graduation cap with book symbolizing learning/education
 */
interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ className = '', size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo SVG - Graduation cap with book icon */}
      <div className={`${sizeClasses[size]} relative`}>
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Book base */}
          <rect
            x="12"
            y="32"
            width="40"
            height="24"
            rx="2"
            className="fill-primary-600 dark:fill-primary-400"
          />
          <rect
            x="14"
            y="34"
            width="36"
            height="20"
            rx="1"
            className="fill-primary-100 dark:fill-primary-200"
          />
          <line
            x1="32"
            y1="34"
            x2="32"
            y2="54"
            className="stroke-primary-600 dark:stroke-primary-500"
            strokeWidth="2"
          />
          
          {/* Graduation cap */}
          <polygon
            points="32,8 8,20 32,32 56,20"
            className="fill-secondary-600 dark:fill-secondary-400"
          />
          <polygon
            points="32,32 8,20 8,26 32,38 56,26 56,20"
            className="fill-secondary-700 dark:fill-secondary-500"
          />
          
          {/* Tassel */}
          <circle
            cx="32"
            cy="8"
            r="3"
            className="fill-warning-500"
          />
          <line
            x1="32"
            y1="11"
            x2="32"
            y2="20"
            className="stroke-warning-500"
            strokeWidth="2"
          />
          <circle
            cx="32"
            cy="22"
            r="2"
            className="fill-warning-500"
          />
        </svg>
      </div>
      
      {/* Text logo */}
      <div className="flex flex-col">
        <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 dark:from-primary-400 dark:to-secondary-400 bg-clip-text text-transparent">
          Aurikrex
        </span>
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 tracking-wider uppercase">
          Academy
        </span>
      </div>
    </div>
  );
}

/**
 * Favicon SVG component - Used for generating the site favicon
 */
export function FaviconSvg() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Simplified logo for favicon */}
      <rect x="12" y="32" width="40" height="24" rx="2" fill="#2563eb" />
      <rect x="14" y="34" width="36" height="20" rx="1" fill="#dbeafe" />
      <line x1="32" y1="34" x2="32" y2="54" stroke="#2563eb" strokeWidth="2" />
      <polygon points="32,8 8,20 32,32 56,20" fill="#7c3aed" />
      <polygon points="32,32 8,20 8,26 32,38 56,26 56,20" fill="#6d28d9" />
      <circle cx="32" cy="8" r="3" fill="#f59e0b" />
      <line x1="32" y1="11" x2="32" y2="20" stroke="#f59e0b" strokeWidth="2" />
      <circle cx="32" cy="22" r="2" fill="#f59e0b" />
    </svg>
  );
}
