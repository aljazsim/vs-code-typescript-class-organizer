import "reflect-metadata";

function decorator(text: string)
{
    return (target: any, propertyKey: string) =>
    {
    }
}

export class TestClassWithDecorators
{
    hobbit = false;
    @decorator(`canvas`) cobra = "";
    @decorator("canvas") canvas?: string = "";
    @decorator('sheriff') sheriff?: string;
}