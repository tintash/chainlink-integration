import * as path from 'path';
import Ajv from 'ajv';
import RefParser from '@apidevtools/json-schema-ref-parser';


export interface ValidSchema {
    valid: boolean;
    error?: string; // discovered during schema validation
}

export async function getOrAddAsync<K, V>(
    map: Map<K, V>,
    key: K,
    create: () => PromiseLike<V>
  ): Promise<V> {
    let val = map.get(key);
    if (val === undefined) {
      val = await create();
      map.set(key, val);
    }
    return val;
  }

const derefSchemaCache: Map<string, RefParser.JSONSchema> = new Map();
export async function dereferenceSchema(schemaFilePath: string): Promise<RefParser.JSONSchema> {
  return getOrAddAsync(derefSchemaCache, schemaFilePath, () =>
    RefParser.dereference(schemaFilePath)
  );
}

export function getDocSchemaFile(packageFile: string) {
    const REPO_DIR = path.dirname('');
    const docsPackageName = 'chainlink-integration-types';
    if (!packageFile.startsWith(docsPackageName)) {
        throw new Error(
            `Doc schema file path should start with ${docsPackageName}, received ${packageFile}`);
    }
    const relativeJsonFile = packageFile.substr(docsPackageName.length);
    const filePath = path.join(REPO_DIR, 'docs', relativeJsonFile);
    return filePath;
}


export async function validate(schemaFilePath: string, data: any): Promise<ValidSchema> {
    const resolvedFilePath = getDocSchemaFile(schemaFilePath);
    const schemaDef = await dereferenceSchema(resolvedFilePath);
    const ajv = new Ajv({ schemaId: 'auto' });
    const valid = await ajv.validate(schemaDef, data);
    if (!valid) {
    //  logger.error(`Schema validation:\n\n ${JSON.stringify(ajv.errors, null, 2)}`);
      const errors = ajv.errors || [{ message: 'error' }];
      return { valid: false, error: errors[0].message };
    }
  
    return { valid: true };
  }