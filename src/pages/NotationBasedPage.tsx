import React from 'react';
import StaticWpPage from './StaticWpPage';

const NotationBasedPage: React.FC = () => (
  <StaticWpPage
    pageUri="/notationbased"
    pageName="特定商取引法に基づく表記"
    sharePath="/notationbased"
    backLink={{ label: 'HOMEに戻る', to: '/' }}
  />
);

export default NotationBasedPage;
