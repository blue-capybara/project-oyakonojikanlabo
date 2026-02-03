import React, { useRef, useEffect, useState } from 'react';
import { collaborations } from '../../data/collaborations';
import { getFeatureFlag } from '../../config/featureFlags';

const CollaborationBanner: React.FC = () => {
  const showCollaborationSignup = getFeatureFlag('showCollaborationSignup');
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAtStart, setIsAtStart] = useState(true);
  const [isAtEnd, setIsAtEnd] = useState(false);

  const scrollLeft = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({
        left: -300,
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({
        left: 300,
        behavior: 'smooth'
      });
    }
  };

  const updateScrollButtons = () => {
    if (containerRef.current) {
      setIsAtStart(containerRef.current.scrollLeft === 0);
      setIsAtEnd(
        containerRef.current.scrollLeft + containerRef.current.clientWidth >= 
        containerRef.current.scrollWidth - 10 // Small buffer for rounding errors
      );
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', updateScrollButtons);
      window.addEventListener('resize', updateScrollButtons);
      
      // Initial check
      updateScrollButtons();
      
      return () => {
        container.removeEventListener('scroll', updateScrollButtons);
        window.removeEventListener('resize', updateScrollButtons);
      };
    }
  }, []);

  if (!showCollaborationSignup) {
    return null;
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="relative">
          <div 
            ref={containerRef}
            className="overflow-x-auto scrollbar-hide" 
            style={{ 
              scrollSnapType: 'x mandatory', 
              WebkitOverflowScrolling: 'touch' 
            }}
          >
            <div className="flex gap-4 pb-4">
              {collaborations.map(item => (
                <div key={item.id} className="flex-none w-[300px] scroll-snap-align-start">
                  <a href={item.url || "#"} className="block">
                    <div className="relative rounded-lg overflow-hidden shadow-lg group">
                      <img 
                        src={item.image} 
                        alt={item.title} 
                        className="w-full h-[300px] object-cover"
                      />
                    </div>
                  </a>
                </div>
              ))}
            </div>
          </div>
          <button 
            onClick={scrollLeft}
            className={`absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-all z-10 ${isAtStart ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
          >
            <i className="ri-arrow-left-s-line ri-xl"></i>
          </button>
          <button 
            onClick={scrollRight}
            className={`absolute right-0 top-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-all z-10 ${isAtEnd ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
          >
            <i className="ri-arrow-right-s-line ri-xl"></i>
          </button>
        </div>
      </div>
    </section>
  );
};

export default CollaborationBanner;
