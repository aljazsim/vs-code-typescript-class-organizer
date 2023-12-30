// #region Functions (4)

function dependOnMeAfter()
{
    console.log("after")
}

function dependOnMeBefore()
{
    console.log("before")
}

// bar = bar + 11;
export function exportedFunction()
{
    dependOnMeBefore()
    dependOnMeAfter()
}

function getBanana()
{
    return "banana";
}

// #endregion Functions (4)

// #region Variables (3)

export const foo = 2;
export const banana = getBanana();
let bar = foo;

// #endregion Variables (3)
