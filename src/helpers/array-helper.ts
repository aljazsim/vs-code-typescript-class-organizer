export function intersects(a: string[] | null, b: string[] | null)
{
    if (a && b && a.length > 0 && b.length > 0)
    {
        return a.some(itemA => b.some(itemB => itemA === itemB));
    }

    return false;
}

export function distinct(a: string[])
{
    return a.filter((value, index, array) => array.indexOf(value) === index);
}
