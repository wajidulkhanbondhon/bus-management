import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/universities',
          '/universities/*',
          '/track',
          '/track/*',
          '/passenger',
          '/passenger/*'
        ],
        disallow: [
          '/dashboard/',
          '/dashboard/*',
          '/supervisor/',
          '/supervisor/*',
          '/bookings/',
          '/bookings/*',
          '/trips/',
          '/trips/*',
          '/buses/',
          '/buses/*',
          '/sales/',
          '/sales/*',
          '/payments/',
          '/payments/*',
          '/settings/',
          '/settings/*',
          '/staff/',
          '/staff/*',
          '/day-closing/',
          '/reports/',
          '/audit-logs/',
          '/api/',
          '/api/*'
        ],
      },
    ],
  };
}
