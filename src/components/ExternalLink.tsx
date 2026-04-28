import { useMemo, type AnchorHTMLAttributes, type MouseEvent, type ReactNode } from 'react';
import { addStoredUtmToExternalUrl } from '../utils/utm';

type ExternalLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  children: ReactNode;
};

const mergeBlankTargetRel = (rel?: string): string => {
  const relValues = new Set(rel?.split(/\s+/).filter(Boolean) ?? []);
  relValues.add('noopener');
  relValues.add('noreferrer');
  return Array.from(relValues).join(' ');
};

const ExternalLink = ({
  href,
  children,
  onClick,
  rel,
  target,
  ...anchorProps
}: ExternalLinkProps) => {
  const decoratedHref = useMemo(() => addStoredUtmToExternalUrl(href), [href]);
  const safeRel = target === '_blank' ? mergeBlankTargetRel(rel) : rel;

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    // 初回表示直後や localStorage 更新後でも、クリック時点の保存値を必ず反映する
    event.currentTarget.href = addStoredUtmToExternalUrl(href);
    onClick?.(event);
  };

  return (
    <a {...anchorProps} href={decoratedHref} target={target} rel={safeRel} onClick={handleClick}>
      {children}
    </a>
  );
};

export default ExternalLink;
