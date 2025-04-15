import { getAssetFromKV } from '@cloudflare/kv-asset-handler';

addEventListener('fetch', event => {
  event.respondWith(handleEvent(event));
});

async function handleEvent(event) {
  try {
    // Try to serve static assets from KV
    return await getAssetFromKV(event);
  } catch (e) {
    // If the asset is not found or there's an error, return the index page
    try {
      return await getAssetFromKV(event, {
        mapRequestToAsset: req => new Request(`${new URL(req.url).origin}/index.html`, req)
      });
    } catch (e) {
      return new Response('Not Found', { status: 404 });
    }
  }
}
