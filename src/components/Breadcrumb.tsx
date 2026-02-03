import React from 'react';
import { Link } from 'react-router-dom';

type Crumb = {
  label: string;
  to?: string; // current page -> undefined
};

interface BreadcrumbProps {
  items: Crumb[];
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  return (
    <div className="bg-gray-100 py-2">
      <div className="container mx-auto px-4" role="navigation" aria-label="パンくずリスト">
        <div
          className="flex items-center gap-2 text-sm sm:text-base text-gray-600 overflow-x-auto whitespace-nowrap min-w-0"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {items.map((item, index) => {
            const isHome = index === 0;
            const shouldTruncate = !isHome && item.label.length > 6;
            const textClass = shouldTruncate ? 'truncate min-w-0' : 'whitespace-nowrap shrink-0';

            return (
              <div key={index} className="flex items-center min-w-0">
                {item.to ? (
                  <Link
                    to={item.to}
                    className={`inline-flex items-center gap-1.5 px-0.5 sm:px-1 max-w-[70vw] sm:max-w-none hover:text-primary ${
                      shouldTruncate ? 'min-w-0' : 'shrink-0'
                    }`}
                    title={item.label}
                    aria-label={item.label}
                  >
                    {isHome ? (
                      <>
                        <i className="ri-home-4-line text-xl shrink-0" aria-hidden />
                        <span className="sr-only">{item.label}</span>
                      </>
                    ) : (
                      <span className={textClass}>{item.label}</span>
                    )}
                  </Link>
                ) : (
                  <span
                    className={`inline-flex items-center gap-1.5 px-0.5 sm:px-1 max-w-[70vw] sm:max-w-none font-medium text-gray-800 ${
                      shouldTruncate ? 'min-w-0' : 'shrink-0'
                    }`}
                    title={item.label}
                  >
                    {isHome ? (
                      <>
                        <i className="ri-home-4-line text-xl shrink-0" aria-hidden />
                        <span className="sr-only">{item.label}</span>
                      </>
                    ) : (
                      <span className={textClass}>{item.label}</span>
                    )}
                  </span>
                )}
                {index < items.length - 1 && (
                  <div className="flex items-center justify-center px-2 sm:px-2.5 mx-1 sm:mx-2 shrink-0 text-base text-gray-500 leading-none">
                    <i className="ri-arrow-right-s-line" aria-hidden />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Breadcrumb;
