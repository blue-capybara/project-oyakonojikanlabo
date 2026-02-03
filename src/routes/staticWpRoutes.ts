export type StaticWpRoute = {
  path: string;
  pageUri: string;
  pageName: string;
  sharePath: string;
  backLink?: {
    label: string;
    to: string;
  };
};

const MONZUKURI_BACK_LINK = {
  label: 'ものづくり部にもどる',
  to: '/monzukuri-bu',
};

export const STATIC_WP_ROUTES: StaticWpRoute[] = [
  {
    path: '/monzukuri-bu',
    pageUri: '/monzukuri-bu',
    pageName: 'monzukuri-bu',
    sharePath: '/monzukuri-bu',
  },
  {
    path: '/monzukuri-bu/arai',
    pageUri: '/monzukuri-bu/arai',
    pageName: 'arai',
    sharePath: '/monzukuri-bu/arai',
    backLink: MONZUKURI_BACK_LINK,
  },
  {
    path: '/monzukuri-bu/saku',
    pageUri: '/monzukuri-bu/saku',
    pageName: 'saku',
    sharePath: '/monzukuri-bu/saku',
    backLink: MONZUKURI_BACK_LINK,
  },
  {
    path: '/monzukuri-bu/yoshimi',
    pageUri: '/monzukuri-bu/yoshimi',
    pageName: 'yoshimi',
    sharePath: '/monzukuri-bu/yoshimi',
    backLink: MONZUKURI_BACK_LINK,
  },
  {
    path: '/monzukuri-bu/reika',
    pageUri: '/monzukuri-bu/reika',
    pageName: 'reika',
    sharePath: '/monzukuri-bu/reika',
    backLink: MONZUKURI_BACK_LINK,
  },
  {
    path: '/monzukuri-bu/kubo',
    pageUri: '/monzukuri-bu/kubo',
    pageName: 'kubo',
    sharePath: '/monzukuri-bu/kubo',
    backLink: MONZUKURI_BACK_LINK,
  },
  {
    path: '/monzukuri-bu/nao',
    pageUri: '/monzukuri-bu/nao',
    pageName: 'nao',
    sharePath: '/monzukuri-bu/nao',
    backLink: MONZUKURI_BACK_LINK,
  },
  {
    path: '/monzukuri-bu/hoso',
    pageUri: '/monzukuri-bu/hoso',
    pageName: 'hoso',
    sharePath: '/monzukuri-bu/hoso',
    backLink: MONZUKURI_BACK_LINK,
  },
  {
    path: '/monzukuri-bu/uchi',
    pageUri: '/monzukuri-bu/uchi',
    pageName: 'uchi',
    sharePath: '/monzukuri-bu/uchi',
    backLink: MONZUKURI_BACK_LINK,
  },
  {
    path: '/our-products-lineup',
    pageUri: '/our-products-lineup',
    pageName: 'our-products-lineup',
    sharePath: '/our-products-lineup',
  },
  {
    path: '/and-the-institute-of-time-for-parents',
    pageUri: '/and-the-institute-of-time-for-parents',
    pageName: 'and-the-institute-of-time-for-parents',
    sharePath: '/and-the-institute-of-time-for-parents',
  },
  {
    path: '/digital-honor-award-memorial-campaign',
    pageUri: '/digital-honor-award-memorial-campaign',
    pageName: 'digital-honor-award-memorial-campaign',
    sharePath: '/digital-honor-award-memorial-campaign',
  },
];
