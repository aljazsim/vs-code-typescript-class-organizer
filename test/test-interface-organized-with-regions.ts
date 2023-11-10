export interface TestInterface {
    // #region Properties (18)

    readonly address: string;
    readonly caption: string;
    readonly city: string | undefined;
    readonly color: string;
    readonly countryCode: Number;
    readonly level: string;
    readonly name: string | undefined;
    readonly state: String;
    readonly town: string;

    areaCode: Number;
    arrowFunction: () => number;
    brand: string;
    isMissing: boolean;
    lastName: string;
    maker: string | null;
    phoneNumber: Number;
    tone: String;
    year: Number;

    // #endregion Properties (18)

    // #region Public Indexers (1)

    [key: number]: string;

    // #endregion Public Indexers (1)

    // #region Public Getters And Setters (7)

    set height(size: Number);
    get setter1(): Number;
    set size(size: Number);
    get width(): Number;

    // #endregion Public Getters And Setters (7)

    // #region Public Methods (9)

    calculate(): void;
    do(): number;
    end(): void;
    hack(): number;
    measure(): number;
    ping(): number;
    resolve(): string;
    run(): Promise<boolean>;
    start(): void;

    // #endregion Public Methods (9)
}
