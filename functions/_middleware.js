export async function onRequest(context){
  const response=await context.next();
  liveTap(context.request,response,context.env,context,'drinks');
  const url=new URL(context.request.url);
  const contentType=response.headers.get('content-type')||'';
  if(context.request.method!=='GET'||url.pathname!=='/'||!contentType.includes('text/html'))return response;
  return new HTMLRewriter().on('body',{element(element){element.append('<script src="/newsletter.js" defer></script>',{html:true});}}).transform(response);
}

/**
 * live-tap (copy of hizach-live/tap/live-tap.js): tell live.hizach.com about a page view. Copy this file into a site
 * and call it after the site has built its response. It never throws, never
 * delays the response, and does nothing until the LIVE binding exists.
 *
 *   liveTap(request, response, env, ctx, 'photos', { isDownload: (path) => path.startsWith('/zip/') });
 *
 * Counted: successful HTML pages (and downloads, if isDownload says so).
 * Skipped: everything else (images, CSS, JS, API calls, /admin), and your own
 * visits while logged in to an admin through Cloudflare Access.
 * Sent: site, host, user agent, referrer, IP and Cloudflare's city-level
 * location. live.hizach.com keeps only the site, city, country and how the
 * visit found you; it uses the IP and user agent for a daily-salted hash and
 * for spotting bots, then drops them. Page paths are never sent.
 */
function liveTap(request, response, env, ctx, site, opts = {}) {
  try {
    const live = env && env.LIVE;
    if (!live || !response || request.method !== 'GET') return;
    const url = new URL(request.url);
    const path = url.pathname;
    if (path.startsWith('/admin') || path.startsWith('/api/') || path.startsWith('/cdn-cgi/')) return;
    // You, logged in to an admin through Cloudflare Access: not a visitor.
    if ((request.headers.get('cookie') || '').includes('CF_Authorization=')) return;
    const download = !!(opts.isDownload && opts.isDownload(path)) && response.status < 400;
    const page = response.status < 400 && (response.headers.get('content-type') || '').includes('text/html');
    if (!page && !download) return;
    const cf = request.cf || {};
    const sent = live.record({
      site,
      host: url.hostname,
      ua: request.headers.get('user-agent'),
      referer: request.headers.get('referer'),
      ip: request.headers.get('cf-connecting-ip'),
      download,
      country: cf.country,
      city: cf.city,
      latitude: cf.latitude,
      longitude: cf.longitude,
      colo: cf.colo,
    });
    if (sent && typeof sent.catch === 'function') ctx.waitUntil(sent.catch(() => {}));
  } catch {
    // Never let the board break a site.
  }
}
