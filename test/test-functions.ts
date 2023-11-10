function dependOnMeBefore()
{
    console.log("before")
}

export const foo = 2;
let bar = foo;
export const banana = getBanana();

// bar = bar + 11;

export function exportedFunction()
{
    dependOnMeBefore()
    dependOnMeAfter()
}

function dependOnMeAfter()
{
    console.log("after")
}

function getBanana()
{
    return "banana";
}