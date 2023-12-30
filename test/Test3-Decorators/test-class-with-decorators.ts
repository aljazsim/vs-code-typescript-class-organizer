import "reflect-metadata";

export type cobra = {};

export class TestClassWithDecorators
{
    @decorator(`canvas`) canvas = "canvas";
    @decorator("cobra") cobra?: cobra = {};
    hobbit = false;
    @decorator('sheriff')
    sheriff?: string;
}

function decorator(text: string)
{
    return (target: any, propertyKey: string) =>
    {
    }
}
