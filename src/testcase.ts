import { calculate } from "./calc.js";
export async function run_test(expr:string,parameter:Array<string>,test_input:Array<Array<Number>>){
    const param:Record<string,any>={};
    const output:Array<any>=[];
    test_input.forEach(inp => {
        if(inp.length!=parameter.length){
            throw new Error("invalid test input");
        }
        for(let i=0;i<parameter.length;i++){
            param[parameter[i]]=inp[i];
        }
        const out=Object.assign({},param,{output:calculate(expr,param)});
        output.push(out);
    });
    return output;
}