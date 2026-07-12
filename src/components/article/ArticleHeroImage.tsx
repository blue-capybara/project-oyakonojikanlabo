import React from 'react';

interface ArticleHeroImageProps {
  src?: string | null;
  srcSet?: string | null;
  sizes?: string | null;
  width?: number | null;
  height?: number | null;
  alt: string;
}

const ArticleHeroImage: React.FC<ArticleHeroImageProps> = ({
  src,
  srcSet,
  sizes,
  width,
  height,
  alt,
}) => {
  if (!src) {
    return null;
  }

  const responsiveSizes = sizes ?? '(min-width: 1280px) 1280px, 100vw';

  return (
    <div className="relative w-full overflow-hidden bg-gray-100">
      <img
        src={src}
        srcSet={srcSet ?? undefined}
        sizes={responsiveSizes}
        alt=""
        aria-hidden="true"
        decoding="async"
        className="pointer-events-none absolute inset-0 hidden h-full w-full object-cover scale-110 blur-2xl md:block"
      />
      <div className="pointer-events-none absolute inset-0 hidden bg-white/35 md:block" />
      <div className="relative mx-auto w-full max-w-[1280px] md:aspect-[16/9]">
        <img
          src={src}
          srcSet={srcSet ?? undefined}
          sizes={responsiveSizes}
          width={width ?? undefined}
          height={height ?? undefined}
          alt={alt}
          decoding="async"
          className="block w-full h-auto md:h-full md:object-contain"
        />
      </div>
    </div>
  );
};

export default ArticleHeroImage;
