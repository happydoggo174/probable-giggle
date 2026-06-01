import { Elysia,t,status } from "elysia";
import { get_connection,get_session, save_file } from "./tools";
import {basename} from "node:path"
import { delete_file } from "./storage";
const app = new Elysia().get("/", () => "Hello Elysia").listen(3000);
const MAX_FILE_TOTAL=37748736;
app.get("/login",async ({query,headers})=>{
  console.log(query);
  return query;
},{
  query:t.Object({
    name:t.String({maxLength:23,minLength:7})
  })
});
const pr_route=new Elysia({prefix:"/pr"});
pr_route.get("/home",async ({query})=>{
  return await get_connection(async(db)=>{
    const res=await db`select pull_request.id,username,profile,time,message
                                from pull_request inner join account 
                                on pull_request.sender=account.id 
                                where post_id=${query.post_id}`;
    if(res.length==0){
      return status(404);
    }
    return JSON.stringify(res[0]);
  });
},{
  query:t.Object({
    post_id:t.Number()
  })
}).get("/detail",async ({query})=>{
  return await get_connection(async (db)=>{
    const res=await db`select pull_request.id,username,profile,time,message,body,tilte,tags,post_id 
                              from pull_request inner join account 
                              on pull_request.sender=account.id 
                              where pull_request.id=${query.pr_id}`;
    if(res.length==0){
      return status(404);
    }
    const out=res[0];
    out["profile"].map((img:string)=>{
      return basename(img);
    });
    return JSON.stringify(out);
  });
},{
  query:t.Object({pr_id:t.Number()})
}
).post("/make",async ({query,headers,body})=>{
  const user=await get_session(headers);
  if(user==null){
    return status(403);
  }
  let total=0;
  let filename:string|null=null;
  if(body.extra_file){
    const extra=body.extra_file;
    extra.forEach((fp)=>{
      total+=fp.size;
      if(total>=MAX_FILE_TOTAL){
        throw status(413,"too much files");
      }
    });
    let filename:Array<string>=[];
    extra.forEach(async(fp)=>{
      const res=(await save_file(fp,['.jpg','.jpeg','.png','.bmp','.avif'],'pr/file/',true));
      if(res.err){
        filename.forEach(async (img)=>{
          await delete_file(img);
        });
        throw status(500);
      }
      filename.push(res.filename);
    });
  }
  return await get_connection(async (db)=>{
    const res=await db`select 1 from post where id=${query.post_id} for update`;
    if(res.length==0){
      return status(404);
    }
    await db`insert into pull_request(post_id,sender,time,message,tilte,body,tags,drop_file,extra_file) 
    values(${query.post_id},${user.uid},${Date.now()},${body.message ?? ""},${body.tilte ?? null},${body.content ?? null},
    ${body.tags ?? null},${body.drop_file ?? null},${filename})`;
  });
},{
  query:t.Object({
    post_id:t.Number()
  }),
  body:t.Object({
    message:t.Optional(t.String({maxLength:200})),
    tilte:t.Optional(t.String({maxLength:100}),),
    content:t.Optional(t.String({maxLength:3000})),
    tags:t.Optional(t.Array(t.String(),)),
    drop_file:t.Optional(t.Array(t.String(),)),
    extra_file:t.Optional(t.Array(t.File(),{maxItems:110},))
  })
}).delete("/drop",async ({query,headers})=>{
  const user=await get_session(headers);
  if(user==null){
    return status(401,"missing user");
  }
  return await get_connection(async (db)=>{
    const res=await db`select sender,author 
                              from pull_request inner join post 
                              on pull_request.post_id=post.id 
                              where pull_request.id=${query.pr_id}`;
    if(res.length==0 || res[0]["author"]!=user.uid){
      return status(403);
    }
    const drop:string[][]=await db`'delete from pull_request where id=${query.pr_id} returning extra_file'`;
    drop.forEach(async (fp)=>{
      await delete_file(fp[0],true);
    });
  });
},{
  query:t.Object({
    pr_id:t.Number()
  })
});
console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
