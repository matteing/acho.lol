import { existsSync } from 'node:fs';

// Archive downloads and deployment installs do not have a Git checkout.
if (!process.env.CI && process.env.HUSKY !== '0' && existsSync('.git')) {
  const { default: install } = await import('husky');
  const error = install();
  if (error) throw new Error(error);
}
