const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});

export async function onRequestPost({request,env}){
  let payload;
  try{payload=await request.json();}catch{return json({error:'Invalid request.'},400);}
  const image=String(payload?.image||'');
  if(!image||image.length>8_000_000)return json({error:'Please provide a menu photo.'},400);

  if(!env.ANTHROPIC_API_KEY){console.error('Missing environment variable: ANTHROPIC_API_KEY');return json({error:'Menu scanning is not fully configured yet.'},503);}

  const claudeResponse=await fetch('https://api.anthropic.com/v1/messages',{
    method:'POST',
    headers:{
      'x-api-key':env.ANTHROPIC_API_KEY,
      'anthropic-version':'2023-06-01',
      'content-type':'application/json'
    },
    body:JSON.stringify({
      model:'claude-sonnet-5',
      max_tokens:1024,
      tools:[{
        name:'record_menu_items',
        description:'Record the distinct food item names visible on the photographed menu.',
        input_schema:{
          type:'object',
          properties:{items:{type:'array',items:{type:'string'},description:'Short food item names only. No prices, descriptions, allergens, or section headers.'}},
          required:['items']
        }
      }],
      tool_choice:{type:'tool',name:'record_menu_items'},
      messages:[{
        role:'user',
        content:[
          {type:'image',source:{type:'base64',media_type:'image/jpeg',data:image}},
          {type:'text',text:'This is a photo of an inflight First Class food menu. Identify each distinct food item by name and call record_menu_items with the list.'}
        ]
      }]
    })
  });

  if(!claudeResponse.ok){
    const errorText=await claudeResponse.text();
    console.error('Claude scan failed',claudeResponse.status,errorText);
    return json({error:'Couldn’t read that menu. Try again with a clearer photo.'},502);
  }

  const data=await claudeResponse.json();
  const toolUse=data.content?.find(block=>block.type==='tool_use'&&block.name==='record_menu_items');
  const items=Array.isArray(toolUse?.input?.items)?toolUse.input.items:[];
  const cleaned=[...new Set(items.map(item=>String(item).trim()).filter(Boolean).map(item=>item.slice(0,60)))].slice(0,40);

  return json({items:cleaned});
}

export function onRequest(){return json({error:'Method not allowed.'},405);}
