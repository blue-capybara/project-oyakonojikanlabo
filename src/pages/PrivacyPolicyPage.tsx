import React from 'react';
import StaticWpPage from './StaticWpPage';

const PrivacyPolicyPage: React.FC = () => (
  <StaticWpPage
    pageUri="/privacy-policy"
    pageName="プライバシーポリシー"
    sharePath="/privacy-policy"
    backLink={{ label: 'HOMEに戻る', to: '/' }}
  />
);

export default PrivacyPolicyPage;
