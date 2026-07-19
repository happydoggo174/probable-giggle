import {SQL} from "bun"
import { Redis } from "@upstash/redis";
import { status,t } from "elysia";
import * as jose from "jose"
class session{
    public uid:number;
    public priv:string;
    constructor(uid:number,priv:string){
        this.uid=uid;
        this.priv=priv;
    }
}
let db:Bun.SQL|null=null;
let supabase:any=null;
class FileResult{
    public filename:string;
    public err:string|null;
    constructor(filename:string,err:string|null){
        this.filename=filename;
        this.err=err;
    }
    get_or_raise(){
        if(this.err==null){
            return this.filename;
        }
        throw status(500,this.err);
    }
}
export async function close_db(){
    await db?.end();
}
export async function get_connection(fn:(sql:SQL) => Promise<any>):Promise<any>{
    if(db==null){
        if(Bun.env.POSTGRES_HOST && Bun.env.POSTGRES_PASSWORD && Bun.env.POSTGRES_USER){
            db=new SQL({
                host:Bun.env.POSTGRES_HOST,
                password:Bun.env.POSTGRES_PASSWORD,
                username:Bun.env.POSTGRES_USER,
                port:6543,
                database:"postgres",
                tls:true,
                prepare:false
            });
        }else{
            db=new SQL({url:Bun.env.POSTGRES_URL});
        }
    }
    const res=await fn(db);
    if(Array.isArray(res)){
        //fixes a legacy framework bug where cors is dropped on bun sql array being returned
        const n=Array.from(res);
        return n;
    }
    return res;
}
export async function get_redis(fn:(r:Redis)=>Promise<any>):Promise<void>{
    // Manual initialization
    const url=Bun.env.REDIS_URL ?? "";
    const token=Bun.env.REDIS_TOKEN ?? "";
    const redis = new Redis({
        url: url,
        token: token,
    });
    try{
        await fn(redis);
    }finally{}
}
export async function get_session(header:Record<string,string|undefined>):Promise<session|null>{
    const auth_token=header["Authorization"];
    if(auth_token==undefined){
        return null;
    }
    try{
        const secret=new TextEncoder().encode(Bun.env.JWT_SECRET ?? "debug jwt key");
        const info=await jose.jwtVerify(auth_token,secret,{algorithms:["HS256"],audience:"auth"});
        const uid=info.payload.uid;
        const priv=info.payload.priv;
        if(typeof uid!='string' || typeof priv!='string'){
            throw new Error("invalid jwt");
        }
        return new session(parseInt(uid),priv);
    }catch{
        throw status(403,"invalid jwt");
    }
    return new session(0,"admin");
}
export async function save_file(file:File,filter:Array<string>,dir:string="",anoymous:boolean=true,max_size:number=6000000,
                    is_public:boolean=false):Promise<FileResult> {
    return new FileResult("",null);
}
export async function get_cilent(){
    const s=await import("@supabase/supabase-js");
    if(supabase==null){
        supabase=s.createClient(Bun.env.SUPABASE_URL!,Bun.env.SUPABASE_SECRET!);
    }
    return supabase
}