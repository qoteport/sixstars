
export const paths = {
  home: '/',
  software: (id?: string) => (id ? `/software/${id}` : '/software'),
  support: '/support',
  partners: '/partners',
  sales: '/sales',
  account: '/account',
  login: '/login',
  onboarding: '/onboarding',

  // Admin
  admin: {
    dashboard: '/admin',
    users: '/admin/users',
    software: '/admin/software',
    categories: '/admin/categories',
    partners: '/admin/partners',
    inquiries: '/admin/inquiries',
    salesInquiries: '/admin/sales-inquiries',
    testimonials: '/admin/testimonials',
    customers: (id?: string) => id ? `/admin/customers/${id}` : '/admin/customers',
    migrate: '/admin/migrate',
    settings: '/admin/settings',
  },

  // External
  terms: '/terms',
  privacy: '/privacy',
};
