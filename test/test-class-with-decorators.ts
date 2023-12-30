import "reflect-metadata";

function decorator(text: string)
{
    return (target: any, propertyKey: string) =>
    {
    }
}

export type cobra = {};

export class TestClassWithDecorators
{
    hobbit = false;
    @decorator(`canvas`) canvas = "canvas";
    @decorator("cobra") cobra?: cobra = {};
    @decorator('sheriff')
    sheriff?: string;
}