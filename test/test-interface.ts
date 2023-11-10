export interface TestInterface
{
    readonly caption: string;
    isMissing: boolean;
    readonly name: string | undefined;

    lastName: string;
    phoneNumber: Number;

    calculate(): void

    resolve(): string;

    areaCode: Number;
    readonly countryCode: Number;
    readonly color: string;

    end(): void;

    start(): void;

    run(): Promise<boolean>;

    do(): number;
    ping(): number;

    hack(): number;

    year: Number;
    maker: string | null;
    tone: String;

    readonly address: string;
    readonly city: string | undefined;

    readonly state: String;

    measure(): number;
    brand: string;
    readonly level: string;
    arrowFunction: () => number;


    [key: number]: string;

    get size(): Number;

    set height(size: Number);
    get width(): Number;

    set size(size: Number);

    get setter1(): Number;


    readonly town: string;

}