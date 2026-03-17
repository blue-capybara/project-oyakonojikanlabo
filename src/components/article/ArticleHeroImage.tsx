import React from 'react';

interface ArticleHeroImageProps {
  src?: string | null;
  alt: string;
}

const ArticleHeroImage: React.FC<ArticleHeroImageProps> = ({ src, alt }) => {
  if (!src) {
    return null;
  }

  return (
    <div className="relative w-full overflow-hidden bg-gray-100">
      <img
        src={src}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 hidden h-full w-full object-cover scale-110 blur-2xl md:block"
      />
      <div className="pointer-events-none absolute inset-0 hidden bg-white/35 md:block" />
      <div className="relative mx-auto w-full max-w-[1280px] md:aspect-[16/9]">
        <img src={src} alt={alt} className="block w-full h-auto md:h-full md:object-contain" />
      </div>
    </div>
  );
};

export default ArticleHeroImage;
