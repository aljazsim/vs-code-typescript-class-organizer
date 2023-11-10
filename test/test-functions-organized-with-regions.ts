// #region Functions (4)

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

// #endregion Functions (4)

// #region Variables (3)

export const foo = 2;
let bar = foo;
export const banana = getBanana();

// #endregion Variables (3)
