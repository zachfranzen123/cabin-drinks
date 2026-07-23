export async function onRequest(context){
  const response=await context.next();
  const url=new URL(context.request.url);
  const contentType=response.headers.get('content-type')||'';
  if(context.request.method!=='GET'||url.pathname!=='/'||!contentType.includes('text/html'))return response;
  return new HTMLRewriter().on('body',{element(element){element.append('<script src="/newsletter.js" defer></script>',{html:true});}}).transform(response);
}
