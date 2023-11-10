export abstract class TestClass {
    private static readonly address = "Lane 1";
    private static readonly city: string | undefined = "City X";

    private readonly name: string | undefined = "The Name";
    private readonly state: String = "Town B";
    private readonly town = "Town A";

    private static isMissing: boolean;

    private arrowFunction = () => 3;
    private lambdaFunction = (name: string) => {};
    private lastName = "Last Name 1";
    private surname: string;

    protected static readonly caption = "The Caption";

    protected readonly level = "Level 1";

    protected static lastName = "Last name 2";

    protected brand = "Brand C";
    protected phoneNumber: Number = 123;

    public static readonly countryCode: Number = 123;

    public readonly color = "Red";

    public static year: Number;

    public areaCode: Number = 123;
    public maker: string | null;
    public tone = "dark";

    constructor(private readonly description: string) {
        this.maker = "2";
        this.surname = "borg";
    }

    public static accessor isLast: boolean | undefined;

    protected accessor isFirst = true;

    private accessor isEnabled: boolean = true;
    private accessor isLast: boolean | undefined;

    public static get getter1(): Number {
        return 2;
    }

    public static get setter1(): Number {
        return 2;
    }

    public get size(): Number {
        return 2;
    }

    public set size(size: Number) {}

    public abstract set height(size: Number);
    public abstract get width(): Number;

    public static calculate() {}

    /**
     * This method resolves everything.
     */
    public static resolve() {}

    public end() {}

    public ping(): number {
        return 2;
    }

    public async run() {
        return Promise.resolve();
    }

    public start() {}

    public abstract do(): number;
    public abstract measure(): number;

    protected abstract hack(): number;
}
