import {z} from "zod";
import {Elysia,status} from "elysia";
import { get_connection } from "./tools";
import auth_middleware from "./auth_middleware";
import {run_test} from "./testcase";
import validate_number from "./math_util";
export const problem_route=new Elysia({prefix:"/problem"});
problem_route.use(auth_middleware).get('/home',async ({query,set,user})=>{
    return await get_connection(async (db)=>{
        if(!user){
            set.headers["cache-control"]="public, s-maxage=360, stale-while-revalidate=60";
            return await db`select title,difficulty,likes-dislikes as reaction
            ,id,comment_count from problem where id>${query.last_id} order by id limit 20`;
        }
        return await db`select title,difficulty,likes-dislikes as reaction,id,status,comment_count from problem 
        left join problem_info 
        on problem.id=problem_info.problem_id and problem_info.uid=${user.user_id} where problem.id>${query.last_id} 
        order by id limit 20`;
    });
},{
    query:z.object({
        last_id:z.coerce.number().default(-1)
    })
}
).get("/detail",async ({query,set})=>{
    return await get_connection(async(db)=>{
        const data=await db`select title,description,author_name as author,author_id,comment_count,parameter,output,likes,
        dislikes,likes-dislikes as reaction,display_name,hint,plain_desc,account.profile from problem 
        left join account on problem.author_id=account.uid 
        where id=${query.problem_id}`;
        if(!data.length){
            throw status(404,"problem not found");
        }
        set.headers["cache-control"]='public, s-maxage=120, stale-while-revalidate=60';
        return data[0];
    });
},{query:z.object({
    problem_id:z.coerce.number()
})}).get('/favorite',async({query,user})=>{
    if(user==null){
        throw status(401,"please login to get favorite");
    }
    return await get_connection(async(db)=>{
        const pagination=((query.last_id!=undefined)?db`and problem.id>${query.last_id}`:db``);
        return await db`select title,difficulty,problem.reaction,id,status,comment_count from problem 
        left join problem_info on problem_info.uid=${user.user_id} 
        and problem.id=problem_info.problem_id 
        where problem_info.reaction='liked' ${pagination} order by problem.id limit 20`;
    });
},{
    query:z.object({
        last_id:z.coerce.number().positive().optional()
    })
}).get('/completed',async({query,user})=>{
    if(user==null){
        throw status(401,"please login to get completed");
    }
    return await get_connection(async(db)=>{
        const pagination=((query.last_id!=undefined)?db`and problem.id>${query.last_id}`:db``);
        return await db`select title,difficulty,problem.reaction,id,status,comment_count from problem 
        left join problem_info on problem_info.uid=${user.user_id} 
        and problem.id=problem_info.problem_id 
        where problem_info.status='solved' ${pagination} order by problem.id limit 20`
    });
},{
    query:z.object({
        last_id:z.coerce.number().positive().optional()
    })
}).get("/status",async({query,user})=>{
    if(!user){throw status(401,"please login to view status");}
    return await get_connection(async(db)=>{
        const stat=await db`select status,reaction from problem_info where problem_id=${query.problem_id} 
        and uid=${user.user_id}`;
        if(!stat.length){
            return {"status":"none","reaction":"none"};
        }
        return stat[0];
    });
},{query:z.object({problem_id:z.coerce.number()})}
).post("/like",async({user,query})=>{
    if(user==null){throw status(401,"please login to like");}
    return await get_connection(async(db)=>{
        return await db.begin(async(db)=>{
            const stat=await db`select reaction from problem_info where problem_id=${query.problem_id} and 
            uid=${user.user_id} for update`.values();
            let res=await db`insert into problem_info(problem_id,uid,status,reaction) values(${query.problem_id},
            ${user.user_id},'none','liked') on conflict(problem_id,uid) do update set reaction='liked' 
            where problem_info.reaction!='liked' returning 1`;
            if(!res.length){throw status(403,"you had already liked this post");}
            const sub=stat.length && stat[0][0]=='disliked'?db`,dislikes=dislikes-1`:db``;
            res=await db`update problem set likes=likes+1${sub} where id=${query.problem_id} returning 1`;
            if(!res.length){
                throw status(404,"problem not found");
            }
        });
    });
},{query:z.object({
    problem_id:z.coerce.number()})
}).post("/dislike",async({user,query})=>{
    if(user==null){throw status(401,"please login to dislike");}
    return await get_connection(async(db)=>{
        return await db.begin(async(db)=>{
            const stat=await db`select reaction from problem_info where problem_id=${query.problem_id} and 
            uid=${user.user_id} for update`.values();
            let res=await db`insert into problem_info(problem_id,uid,status,reaction) values(${query.problem_id},
            ${user.user_id},'none','disliked') on conflict(problem_id,uid) do update set reaction='disliked' 
            where problem_info.reaction!='disliked' returning 1`;
            if(!res.length){throw status(403,"you had already disliked this post");}
            const sub=stat.length && stat[0][0]=='liked'?db`,likes=likes-1`:db``;
            res=await db`update problem set dislikes=dislikes+1${sub} where id=${query.problem_id} returning 1`;
            if(!res.length){
                throw status(404,"problem not found");
            }
        });
    });
},{query:z.object({
    problem_id:z.coerce.number()})
}).post("/complete",async({query,user})=>{
    if(!user){
        throw status(401,"please login to save progress");
    }
    if(query.result!="solved" && query.result!="attempted"){
        throw status(422,'invalid status');
    }
    return await get_connection(async(db)=>{
        if(!(await db`select 1 from problem where id=${query.problem_id}`).length){
            throw status(404,"problem not found");
        }
        const cond=query.result=="attempted"?db`where problem_info.status!='solved'`:db``;
        await db`insert into problem_info(problem_id,uid,status,reaction) values(${query.problem_id},
        ${user.user_id},${query.result},'none') on conflict(problem_id,uid) 
        do update set status=excluded.status ${cond}`;
    });
},{
    query:z.object({
        problem_id:z.coerce.number(),
        result:z.string()
    })
}).delete("/remove",async({query,user})=>{
    if(!user){throw status(401,"please login to delete");}
    return await get_connection(async(db)=>{
        return await db.begin(async(db)=>{
            const r=await db`select author_id from problem where id=${query.problem_id}`;
            if(!r.length){throw status(404,"problem not found");}
            if(!user.has_capabilities("delete post")  && r[0]["author_id"]!=user.user_id){
                throw status(403);
            }
            await Promise.all([
                db`delete from problem where id=${query.problem_id}`,
                db`delete from comment where problem_id=${query.problem_id}`,
                db`delete from problem_info where problem_id=${query.problem_id}`
            ]);
        });
    });
},{query:z.object({
    problem_id:z.coerce.number().positive()})}
).post("/make",async({user,body})=>{
    if(!user){throw status(401,"please login to post");}
    let output=[];
    validate_number(body.display_name,body.test_case);
    try{
        output=await run_test(body.function,body.parameter,body.test_case);
    }catch{
        throw status(422,"invaid test case/function");
    }
    const out=body.display_name?body.display_name:body.test_case.map(v=>v.map(z=>z.toString()));
    const hint=body.hint??[];
    return await get_connection(async(db)=>{
        const username=await db`select username from account where uid=${user.user_id}`;
        const res=await db`insert into problem(title,author_id,author_name,description,difficulty,
        parameter,output,display_name,hint,plain_desc) values(${body.title},${user.user_id},${username[0]["username"]},
        ${body.description},${body.difficulty},${db.array(body.parameter,"TEXT")},${output},${db.array(out,"TEXT[]")},
        ${db.array(hint,'TEXT')},${body.plain_desc}) on conflict do nothing returning 1`;
        if(!res.length){throw status(409);}
    });    
},
    {body:z.object({
        title:z.string().max(80).min(1),
        description:z.string().max(1000).min(1),
        difficulty:z.union([z.string("easy"),z.string("medium"),z.string("hard")]),
        parameter:z.array(z.string().max(30).refine(p=>{
            const black=["__proto__","prototype","__constructor__","output"];
            return black.find(v=>v==p)===undefined;
        })).max(20),
        function:z.string().max(1000),
        test_case:z.array(z.array(z.number()).max(20)).max(10),
        display_name:z.array(z.array(z.string().max(20).min(1)).max(20)).max(10).optional(),
        hint:z.array(z.string().max(200)).max(10).optional(),
        plain_desc:z.stringbool().default(false)
    })});