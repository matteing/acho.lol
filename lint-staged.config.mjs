export default {
  '*.{ts,js,mjs,astro}': ['prettier --write', 'eslint --fix --max-warnings=0'],
  '*.{css,json,yml,yaml,md}': 'prettier --write --ignore-unknown',
};
