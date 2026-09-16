import assert from 'node:assert/strict';
import test from 'node:test';
import { pageRoutes } from '../../src/lib/wiki/routes';
import { routeParam } from '../../src/lib/wiki/urls';
import { wikiPage } from '../fixtures/page';

void test('routes decode accented paths without double encoding and preserve the home route', () => {
  assert.equal(routeParam('/Palabras/Cabr%C3%B3n/'), 'Palabras/Cabrón');
  assert.equal(routeParam('/'), undefined);
  const page = wikiPage({ redirects: ['/Otro-nombre/'] });
  assert.deepEqual(
    pageRoutes([page]).map((route) => [route.params.path, route.props.view]),
    [
      ['Palabras/Prueba', 'entry'],
      ['Otro-nombre', 'redirect'],
    ],
  );
});

void test('redirects cannot escape the site or shadow another public route', () => {
  for (const redirect of [
    'https://example.com/',
    '//example.com/',
    '/old?query=1',
    '/old#heading',
  ]) {
    assert.throws(() => pageRoutes([wikiPage({ redirects: [redirect] })]), /local absolute paths/);
  }
  assert.throws(
    () => pageRoutes([wikiPage({ redirects: ['/Palabras/Prueba/'] })]),
    /Duplicate public route/,
  );
});
