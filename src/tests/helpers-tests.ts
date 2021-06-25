import { parseOracleRequestValue } from "../adapter-helpers";

test('error: parse oracle request value', () => {
    const param = 'dummy'; 
    expect(() => parseOracleRequestValue(param)).toThrowError();
});

