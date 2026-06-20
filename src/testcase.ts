import { calculate } from "./calc.js";
export async function run_test(expr:string,parameter:Array<string>,test_input:Array<Array<Number>>){
    const param:Record<string,any>={};
    const output:Array<any>=[];
    for(let name of parameter){
        if(name=='__proto__' || name=="__constructor__" || name=="output"){
            throw new Error("invalid name");
        }
    }
    test_input.forEach(inp => {
        if(inp.length!=parameter.length){
            throw new Error("invalid test input");
        }
        for(let i=0;i<parameter.length;i++){
            param[parameter[i]]=inp[i];
        }
        output.push(Object.assign(param,{output:calculate(expr,param)}));
    });
    return output;
}