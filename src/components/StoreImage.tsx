import { useEffect, useState } from 'react';
import { ShoppingBag } from 'lucide-react';

interface StoreImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}

export function StoreImage({
  src,
  alt,
  className = 'w-full h-full object-cover',
  fallbackLabel,
}: StoreImageProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (hasError || !src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-emerald-950/5 via-zinc-100 to-emerald-900/10 text-emerald-900 p-4 text-center"
      >
        <ShoppingBag className="w-7 h-7 text-emerald-800/70" aria-hidden="true" />
        <span className="text-xs font-medium text-zinc-600 line-clamp-2">
          {fallbackLabel || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
