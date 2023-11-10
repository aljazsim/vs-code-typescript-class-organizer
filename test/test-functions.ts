function dependOnMeBefore()
{
    variable1 = 3;
    console.log("before")
}

let variable2 = 1;
let variable3 = 3;
let variable1 = variable2 + 1;


export function exportedFunction()
{
    dependOnMeBefore()
    dependOnMeAfter()
}

function dependOnMeAfter()
{
    console.log("after")
}