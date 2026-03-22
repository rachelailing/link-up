import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        'auth/student-login': resolve(__dirname, 'pages/auth/student-login.html'),
        'auth/student-register': resolve(__dirname, 'pages/auth/student-register.html'),
        'auth/employer-login': resolve(__dirname, 'pages/auth/employer-login.html'),
        'auth/employer-register': resolve(__dirname, 'pages/auth/employer-register.html'),
        'auth/onboarding': resolve(__dirname, 'pages/auth/onboarding.html'),
        'auth/verify-email': resolve(__dirname, 'pages/auth/verify-email.html'),
        'employer/homepage': resolve(__dirname, 'pages/employer/employer_homepage.html'),
        'employer/create-job': resolve(__dirname, 'pages/employer/create-job.html'),
        'employer/job-manage': resolve(__dirname, 'pages/employer/job-manage.html'),
        'employer/applications': resolve(__dirname, 'pages/employer/applications.html'),
        'employer/business-profile': resolve(__dirname, 'pages/employer/business-profile.html'),
        'employer/payment-release': resolve(__dirname, 'pages/employer/payment-release.html'),
        'employer/ratings': resolve(__dirname, 'pages/employer/ratings.html'),
        'student/jobs': resolve(__dirname, 'pages/student/jobs.html'),
        'student/job-details': resolve(__dirname, 'pages/student/job-details.html'),
        'student/apply-job': resolve(__dirname, 'pages/student/apply-job.html'),
        'student/earnings': resolve(__dirname, 'pages/student/earnings.html'),
        'student/marketplace': resolve(__dirname, 'pages/student/marketplace.html'),
        'student/marketplace-details': resolve(__dirname, 'pages/student/marketplace-details.html'),
        'student/marketplace-listings': resolve(
          __dirname,
          'pages/student/marketplace-listings.html'
        ),
        'student/marketplace-recommended': resolve(
          __dirname,
          'pages/student/marketplace-recommended.html'
        ),
        'student/profile': resolve(__dirname, 'pages/student/profile.html'),
        'student/purchase': resolve(__dirname, 'pages/student/purchase.html'),
        'student/service-manage': resolve(__dirname, 'pages/student/service-manage.html'),
        'student/product-manage': resolve(__dirname, 'pages/student/product-manage.html'),
        'student/trans-details': resolve(__dirname, 'pages/student/trans-details.html'),
        'shared/404': resolve(__dirname, 'pages/shared/404.html'),
      },
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
    },
  },
});
