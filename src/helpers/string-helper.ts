// #region Functions (1)

export function convertPascalCaseToTitleCase(value: string)
{
    if (value &&
        value.length > 1)
    {
        value = value.replace(/(?:^|\.?)([A-Z])/g, (x, y) => " " + y);
        value = value[0].toUpperCase() + value.substring(1);
    }

    return value;
}

// #endregion Functions (1)
