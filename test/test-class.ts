export abstract class TestClass
{
    protected static readonly caption = "The Caption";
    private static isMissing: boolean;
    private readonly name: string | undefined = "The Name";

    protected static lastName = "Last name";
    protected phoneNumber: Number = 123;

    static calculate()
    {
    }

    static resolve()
    {
    }

    public areaCode: Number = 123;
    public static readonly countryCode: Number = 123;
    public readonly color = "Red";

    public end()
    {
    }

    start()
    {
    }

    async run()
    {
        return Promise.resolve();
    }

    public abstract do(): number;
    public ping(): number
    {
        return 2;
    }
    protected abstract hack(): number;



    public static year: Number;
    public maker: string | null;
    tone = "dark";

    private static readonly address = "Lane 1";
    private static readonly city: string | undefined = "City X";

    private readonly state: String = "Town B";

    private lastName = "Last Name";
    abstract measure(): number;
    protected brand = "Brand C";
    protected readonly level = "Level 1";
    private arrowFunction = () => 3;

    constructor(private readonly description: string)
    {
        this.maker = "2";
        this.surname = "borg";
    }

    static [key: number]: string;
    private lambdaFunction = (name: string) => { };
    private surname: string;

    public static get getter1(): Number
    {
        return 2;
    }

    get size(): Number
    {
        return 2;
    }

    abstract set height(size: Number);
    abstract get width(): Number;

    set size(size: Number)
    {
    }

    public static get setter1(): Number
    {
        return 2;
    }


    static {
        this.isMissing = true;
    }

    private readonly town = "Town A";

}