import {Elysia} from "elysia";
import z from "zod";
import { get_connection } from "./tools";
const comment_route=new Elysia({prefix:"/comment"});
comment_route.get("/",async({query})=>{
        return await get_connection(async(db)=>{
            return await db`select comments.id,content fro`
        });
    },
    {query:z.object({
        problem_id:z.coerce.number(),
        page:z.coerce.number().default(0)})
    }
)