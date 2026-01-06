import * as React from "react"

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback?: string;
}

export function Avatar({ src, alt, fallback, className = "", ...props }: AvatarProps) {
  const [imgError, setImgError] = React.useState(false);
  
  const initials = fallback || alt?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  
  return (
    <div
      className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full ${className}`}
      {...props}
    >
      {src && !imgError ? (
        <img
          src={src}
          alt={alt || 'Avatar'}
          className="aspect-square h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
          {initials}
        </div>
      )}
    </div>
  );
}
