function dependOnMeBefore()
{
    console.log("before")
}

export const foo = 2;

// bar = bar + 11;

export function exportedFunction()
{
    dependOnMeBefore()
    dependOnMeAfter()
}

export const banana = getBanana();
function dependOnMeAfter()
{
    console.log("after")
}
let bar = foo;

function getBanana()
{
    return "banana";
}