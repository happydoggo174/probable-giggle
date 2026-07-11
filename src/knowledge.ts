import Elysia from "elysia";
import { status } from "elysia";
import { get_connection } from "./tools";
import z from 'zod';
import auth_middleware from "./auth_middleware";
const knowledge_route=new Elysia({prefix:"/knowledge"});
knowledge_route.get("/home",async({query})=>{
    return await get_connection(async(db)=>{
        return await db`select id,title,category,likes,dislikes,author_name,difficulty 
        from knowledge where id>${query.last_id} 
        order by id limit 20`
    });
},{query:z.object({last_id:z.coerce.number().default(-1)})}).
use(auth_middleware).
get('/detail',async({query,user})=>{
    return await get_connection(async(db)=>{
        let r=null;
        if(!user){ 
            r=await db`select id,title,content,plain_content,related_problem,
            author_id,author_name,profile,category,likes,dislikes,difficulty
            from knowledge left join account 
            on knowledge.author_id=account.uid 
            where knowledge.id=${query.knowledge_id}`;
        }else{
            r=await db`select id,title,content,plain_content,related_problem,
            author_id,author_name,profile,category,likes,dislikes,difficulty,reaction 
            from knowledge left join account 
            on knowledge.author_id=account.uid 
            left join knowledge_info 
            on knowledge_info.knowledge_id=knowledge.id 
            and knowledge_info.uid=${user.user_id} 
            where knowledge.id=${query.knowledge_id}`;
        }
        if(!r.length){
            throw status(404);
        }
        console.log(JSON.stringify(r[0]));
        return r[0];
    });
},
{query:z.object({
    knowledge_id:z.coerce.number()
})}).
post("/make",async({body,user})=>{
    if(!user){
        throw status(401,"please login to post knowledge");
    }
    await get_connection(async(db)=>{ 
        let related=[];
        if(body.related_problem){
            try{
                related=await db`select id,title from problem where id in (${(body.related_problem)})`;
            }catch(e:any){
                throw status(404,e?.message);
            }
        }
        await db`insert into knowledge(title,content,author_id,author_name,category,difficulty,plain_content,
        related_problem) values(${body.title},${body.content},${user.user_id},${user.username},
        ${db.array(body.category,"TEXT")},${body.difficulty},${body.plain_content},${related})`;
    });
},
    {body:z.object({
        title:z.string().min(1).max(150),
        content:z.string().min(1).max(8000),
        category:z.array(z.string().min(1).max(30)).max(12),
        difficulty:z.union([z.literal("easy"),z.literal("medium"),z.literal("hard")]),
        plain_content:z.stringbool().default(false),
        related_problem:z.array(z.number().positive()).max(10).optional()
    })}).delete("/drop",async({user,query})=>{
        if(!user){
            throw status(401,"please login to delete knowledge");
        }
        await get_connection(async(db)=>{
            if(!user.has_capabilities("delete knowledge")){
                const perm=await db`select author_id from knowledge where id=${query.knowledge_id}`.values();
                if(!perm.length){
                    throw status(404,"knowledge not found");
                }
                if(perm[0][0]!=user.user_id){
                    throw status(403);
                }
            }
            const res=await db`delete from knowledge where id=${query.knowledge_id} returning 1`;
            if(!res.length){
                throw status(404,'knowledge not found');
            }
            await db`delete from knowledge_info where knowledge_id=${query.knowledge_id}`;
        });
    },
    {query:z.object({
        knowledge_id:z.coerce.number()
    })}).
post("/react",async({query,user})=>{
    if(!user){
        throw status(401);
    }
    return await get_connection(async(db)=>{
        await db.begin(async(db)=>{
            const resp=await db`insert into knowledge_info(knowledge_id,uid,reaction,learned) values(
            ${query.knowledge_id},${user.user_id},${query.reaction},false) 
            on conflict do nothing returning 1`;
            if(!resp.length){
                const react=(await db`select reaction from knowledge_info 
                where knowledge_id=${query.knowledge_id} and uid=${user.user_id}`.values())[0][0];
                if(react==query.reaction){
                    return;
                }
                await db`update knowledge_info set reaction=${query.reaction} 
                where knowledge_id=${query.knowledge_id} and uid=${user.user_id}`;
                let out=null;
                if(react=='liked'){
                    out=await db`update knowledge set likes=likes-1,dislikes=dislikes+1 
                    where id=${query.knowledge_id} returning 1`;
                }else{
                    if(react=='disliked'){
                        out=await db`update knowledge set likes=likes+1,dislikes=dislikes-1 
                    where id=${query.knowledge_id} returning 1`;
                    }
                }
                if(out!=null && !out.length){
                    throw status(404);
                }
            }else{
                let out=null;
                if(query.reaction=='liked'){
                    out=await db`update knowledge set likes=likes+1 where id=${query.knowledge_id} returning 1`;
                }else{
                    out=await db`update knowledge set dislikes=dislikes+1 where id=${query.knowledge_id} returning 1`;
                }
                if(!out.length){
                    throw status(404);
                }
            }
        });        
    });
},{query:z.object({
    knowledge_id:z.coerce.number(),
    reaction:z.union([z.literal("liked"),z.literal("disliked")])
})});
export default knowledge_route;