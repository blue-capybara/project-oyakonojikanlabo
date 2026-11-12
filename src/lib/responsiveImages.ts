export interface ResponsiveImage {
  sourceUrl?: string | null;
  srcSet?: string | null;
  mediaDetails?: { width?: number | null; height?: number | null } | null;
}

// object-coverで切り抜く部分も含め、Retinaに必要な画素数をブラウザへ伝えます。
export const coverImageSize = (
  image: ResponsiveImage | null | undefined,
  width: number | string,
  height: number | string,
) => {
  const sourceWidth = image?.mediaDetails?.width;
  const sourceHeight = image?.mediaDetails?.height;
  const ratio = sourceWidth && sourceHeight ? sourceWidth / sourceHeight : 1;
  const slotWidth = typeof width === 'number' ? `${width}px` : width;
  const slotHeight = typeof height === 'number' ? `${height}px` : height;
  return `max(${slotWidth}, calc(${slotHeight} * ${ratio}))`;
};
