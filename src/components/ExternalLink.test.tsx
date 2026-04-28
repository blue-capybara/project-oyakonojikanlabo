import { render, screen } from '@testing-library/react';
import ExternalLink from './ExternalLink';
import { UTM_EXPIRE_DAYS, UTM_EXPIRE_KEY } from '../utils/utm';

describe('ExternalLink', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem('utm_source', 'line');
    window.localStorage.setItem('utm_medium', 'social');
    window.localStorage.setItem('utm_campaign', '20260428_kodomonotomo_01');
    window.localStorage.setItem('line_id', '01');
    window.localStorage.setItem(UTM_EXPIRE_KEY, String(Date.now() + UTM_EXPIRE_DAYS * 86_400_000));
  });

  it('外部リンクのhrefに保存済みUTMを付与する', () => {
    render(
      <ExternalLink href="https://shop.example.com/products/xxx" target="_blank">
        商品ページへ
      </ExternalLink>,
    );

    const link = screen.getByRole('link', { name: '商品ページへ' });

    expect(link).toHaveAttribute('href', expect.stringContaining('utm_source=line'));
    expect(link).toHaveAttribute(
      'href',
      expect.stringContaining('utm_campaign=20260428_kodomonotomo_01'),
    );
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
    expect(link).toHaveAttribute('rel', expect.stringContaining('noreferrer'));
  });

  it('内部リンクのhrefは変更しない', () => {
    render(<ExternalLink href="/event">イベント</ExternalLink>);

    expect(screen.getByRole('link', { name: 'イベント' })).toHaveAttribute('href', '/event');
  });
});
