import {status} from "elysia";
function compare_float(a:number,b:number){
    return Math.abs(a-b)<1e-10;
}
function strict_parse_float(n:string){
    if(n===undefined || n===null){return Number.NaN}
    if (/[^0-9\-.,e+]/.test(n)) {
        return Number.NaN;
    }
    return parseFloat(n);
}
function parse_percentage(n:string){
    if(n===null || n===undefined){return Number.NaN;}
    if(n.endsWith('%')){
        return strict_parse_float(n.slice(0,n.length-1))/100;
    }
    return strict_parse_float(n);
}
export default function validate_number(name:string[][]|undefined,test:number[][]){
    if(name===undefined || name===null){return;}
    if(name.length!=test.length){
        throw status(422,'mismatch testcase count');
    }
    for(let i=0;i<name.length;i++){
        if(name[i].length!=test[i].length){
            throw status(422,'mismatch count per testcase');
        }
        for(let j=0;j<name[i].length;j++){
            const num=name[i][j];
            if(num.indexOf('|')==-1){
                if(!compare_float(parse_percentage(num),test[i][j])){
                    throw status(422,"mismatched precentage value");
                }
                return;
            }
            const part=num.split('|').map(v=>{
                const n=parse_percentage(v);
                if(Number.isNaN(n)){
                    throw status(422,'invalid number');
                }
                return n;
            });
            if(part.length==2 || part.length==3){
                if(part[part.length-1]==0){
                    throw status(422,"invalid fraction");
                }
                const sum=part[part.length-2]/part[part.length-1]+((part.length==3)?part[0]:0);
                if(!compare_float(sum,test[i][j])){
                    throw status(422,"invalid fraction");
                }
            }else{
                if(part.length!=1){
                    throw status(422,"unrecognized numeric type");
                }
                return part[0];
            }
        }
    }
}