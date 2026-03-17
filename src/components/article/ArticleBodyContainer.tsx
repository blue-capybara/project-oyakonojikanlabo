import React from 'react';

interface ArticleBodyContainerProps {
  children: React.ReactNode;
}

const ArticleBodyContainer: React.FC<ArticleBodyContainerProps> = ({ children }) => {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">{children}</div>
      </div>
    </section>
  );
};

export default ArticleBodyContainer;
