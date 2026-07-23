const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
const emailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const escapeHtml=value=>value.replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));

export async function onRequestPost({request,env}){
  let payload;
  try{payload=await request.json();}catch{return json({error:'Invalid request.'},400);}
  const email=String(payload?.email||'').trim().toLowerCase();
  if(!emailPattern.test(email)||email.length>254)return json({error:'Please enter a valid email address.'},400);

  const required=['SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','RESEND_API_KEY'];
  const missing=required.filter(key=>!env[key]);
  if(missing.length){console.error('Missing environment variables:',missing.join(', '));return json({error:'Signup is not fully configured yet.'},503);}

  const supabaseUrl=env.SUPABASE_URL.replace(/\/$/,'');
  const insertResponse=await fetch(`${supabaseUrl}/rest/v1/subscribers`,{
    method:'POST',
    headers:{
      apikey:env.SUPABASE_SERVICE_ROLE_KEY,
      authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'content-type':'application/json',
      prefer:'return=minimal'
    },
    body:JSON.stringify({email,source:'cabin-drinks-landing',confirmed:true})
  });

  let alreadySubscribed=false;
  if(!insertResponse.ok){
    const errorText=await insertResponse.text();
    if(insertResponse.status===409||errorText.includes('23505'))alreadySubscribed=true;
    else{console.error('Supabase insert failed',insertResponse.status,errorText);return json({error:'We couldn’t save your signup. Please try again.'},502);}
  }

  if(!alreadySubscribed){
    const from=env.FROM_EMAIL||'Cabin Drinks <hi@hizach.com>';
    const safeEmail=escapeHtml(email);
    const resendResponse=await fetch('https://api.resend.com/emails',{
      method:'POST',
      headers:{authorization:`Bearer ${env.RESEND_API_KEY}`,'content-type':'application/json','idempotency-key':`cabin-drinks-welcome-${email}`},
      body:JSON.stringify({
        from,
        to:[email],
        reply_to:'hi@hizach.com',
        subject:'✈️ Welcome to the Cabin Drinks crew!',
        html:`<!doctype html><html><body style="margin:0;background:#f3f1eb;color:#202423;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"><div style="max-width:600px;margin:0 auto;padding:42px 20px"><div style="background:#fff;border-radius:24px;padding:38px;box-shadow:0 18px 50px rgba(32,36,35,.08)"><div style="font-size:38px">✈️</div><h1 style="margin:18px 0 12px;font-size:34px;line-height:1.05">Welcome aboard.</h1><p style="font-size:17px;line-height:1.6">Thanks for joining the Cabin Drinks crew.</p><p style="font-size:17px;line-height:1.6">Cabin Drinks started as a tool I built for myself to make beverage and meal service a little easier. Feedback from other flight attendants has helped it grow into something much more useful.</p><p style="font-size:17px;line-height:1.6">I’ll occasionally send meaningful feature updates, important fixes, and opportunities to try what’s coming next.</p><p style="font-size:17px;line-height:1.6;margin-bottom:0">Safe travels,<br><strong>Zach (“Elio”)</strong></p><hr style="border:0;border-top:1px solid #e4e6e2;margin:30px 0 18px"><p style="margin:0;color:#747b77;font-size:12px;line-height:1.5">This message was sent to ${safeEmail} because this address joined the Cabin Drinks crew updates list.</p></div></div></body></html>`,
        text:`Welcome aboard!\n\nThanks for joining the Cabin Drinks crew.\n\nCabin Drinks started as a tool I built for myself to make beverage and meal service a little easier. Feedback from other flight attendants has helped it grow into something much more useful.\n\nI’ll occasionally send meaningful feature updates, important fixes, and opportunities to try what’s coming next.\n\nSafe travels,\nZach (\"Elio\")`
      })
    });
    if(!resendResponse.ok){
      const errorText=await resendResponse.text();
      console.error('Resend failed',resendResponse.status,errorText);
      return json({success:true,emailSaved:true,welcomeEmail:false});
    }
  }

  return json({success:true,alreadySubscribed});
}

export function onRequest(){return json({error:'Method not allowed.'},405);}
