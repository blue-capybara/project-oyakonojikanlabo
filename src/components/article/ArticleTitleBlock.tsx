import React from 'react';

interface ArticleTitleBlockProps {
  title: string;
  dateText?: string;
}

const ArticleTitleBlock: React.FC<ArticleTitleBlockProps> = ({ title, dateText }) => {
  return (
    <section className="bg-gray-50 pt-6 pb-8">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold leading-tight">{title}</h1>
          {dateText && <p className="mt-3 text-sm text-gray-500">{dateText}</p>}
        </div>
      </div>
    </section>
  );
};

export default ArticleTitleBlock;
