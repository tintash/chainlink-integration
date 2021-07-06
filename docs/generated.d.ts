/**
  This file is generated automatically. **DO NOT MODIFY THIS FILE DIRECTLY**
  Updates are made by editing the JSON Schema files in the 'docs/' directory,
  then running the 'npm build' script.
*/

/**
 * Adapter response after contract call
 */
export interface ResponseAdapter {
  value?: string;
  data: {
    get?: string;
    path?: string;
    payload: string;
    result: number;
  };
  txid?: string;
}

/**
 * POST Request param body for adapter
 */
export interface AdapterRequestBody {
  id?: string;
  data: {
    get?: string;
    path?: string;
    payload: string;
    result?: number;
  };
}

