function dependOnMeAfter()
{
    console.log("after")
}

function dependOnMeBefore()
{
    console.log("before")
}

export function exportedFunction()
{
    dependOnMeBefore()
    dependOnMeAfter()
}

function getBanana()
{
    return "banana";
}

export const foo = 2;
const bar = foo;
export const banana = getBanana();

