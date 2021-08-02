import * as path from 'path';
import PgMigrate, { RunnerOption } from 'node-pg-migrate';
import { Pool, PoolClient, ClientConfig, Client, ClientBase, QueryResult, QueryConfig } from 'pg';
import { isDevEnv, isTestEnv, parsePort, timeout } from '../helpers';
import { OracleFulfillment } from '../adapter-helpers';

const MIGRATIONS_TABLE = 'pgmigrations';
const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

export type ElementType<T extends any[]> = T extends (infer U)[] ? U : never;
export type FoundOrNot<T> = { found: true; result: T } | { found: false };

export function getPgClientConfig(): ClientConfig {
    const config: ClientConfig = {
        database: process.env['PG_DATABASE'],
        user: process.env['PG_USER'],
        password: process.env['PG_PASSWORD'],
        host: process.env['PG_HOST'],
        port: parsePort(process.env['PG_PORT']),
    };
    return config;
};

/** Converts a unix timestamp (in seconds) to an ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ) string */
export function unixEpochToIso(timestamp: number): string {
    try {
        const date = new Date(timestamp * 1000);
        const iso = date.toISOString();
        return iso;
    } catch (error) {
        throw error;
    }
};

export async function runMigrations(
    clientConfig: ClientConfig = getPgClientConfig(),
    direction: 'up' | 'down' = 'up'
): Promise<void> {
    if (direction !== 'up' && !isTestEnv && !isDevEnv) {
        throw new Error(
            'Whoa there! This is a testing function that will drop all data from PG. ' +
            'Set NODE_ENV to "test" or "development" to enable migration testing.'
        );
    }
    clientConfig = clientConfig ?? getPgClientConfig();
    const client = new Client(clientConfig);
    try {
        await client.connect();
        const runnerOpts: RunnerOption = {
            dbClient: client,
            ignorePattern: '.*map',
            dir: MIGRATIONS_DIR,
            direction: direction,
            migrationsTable: MIGRATIONS_TABLE,
            count: Infinity,
            logger: {
                info: msg => {
                    console.log('PGSTORE INFO: '+msg);
                },
                warn: msg => {
                    console.log('PGSTORE WARNING: '+msg);
                },
                error: msg => {
                    console.log('PGSTORE ERROR: '+msg);
                },
            },
        };
        if (process.env['PG_SCHEMA']) {
            runnerOpts.schema = process.env['PG_SCHEMA'];
        }
        await PgMigrate(runnerOpts);
    } catch (error) {
        console.log(`Error running pg-migrate`, error);
        throw error;
    } finally {
        await client.end();
    }
};

export async function cycleMigrations(): Promise<void> {
    const clientConfig = getPgClientConfig();
    await runMigrations(clientConfig, 'down');
    await runMigrations(clientConfig, 'up');
};

const ORACLE_REQUEST_COLUMNS = `
    -- required columns
    request_id, evm_request_id, expiration, sender, payment, spec_id,
    callback, nonce, data_version, request_count, sender_buff, data
`;

interface OracleRequestQueryResult {
    request_id: Buffer;
    evm_request_id: Buffer;
    expiration: string;
    sender: string;
    payment: string;
    spec_id: Buffer;
    callback: string;
    nonce: string;
    data_version: string;
    request_count: string;
    sender_buff: Buffer;
    data: Buffer;
};

// Enable this when debugging potential sql leaks.
const SQL_QUERY_LEAK_DETECTION = false;

function getSqlQueryString(query: QueryConfig | string): string {
    if (typeof query === 'string') {
        return query;
    } else {
        return query.text;
    }
}
export function stopwatch(): {
    /** Milliseconds since stopwatch was created. */
    getElapsed: () => number;
} {
    const start = process.hrtime();
    return {
        getElapsed: () => {
            const hrend = process.hrtime(start);
            return hrend[0] * 1000 + hrend[1] / 1000000;
        },
    };
}

export interface DataStore {
    getOracleRequest(evm_request_id: string): Promise<FoundOrNot<OracleRequestQueryResult>>;
    updateOracleRequest(oracle_data: OracleFulfillment, evm_request_id: string): Promise<void>;
};

export class PgDataStore implements DataStore {
    readonly pool: Pool;
    private constructor(pool: Pool) {
        this.pool = pool;
    }
    
    async getOracleRequest(evm_request_id: string): Promise<FoundOrNot<OracleRequestQueryResult>> {
        return this.query(async client => {
            const queryResult = await client.query(
                `
                SELECT * FROM oracle_requests
                WHERE evm_request_id = $1
                `,
                [evm_request_id]
            );
            if (queryResult.rowCount > 0) {
                return {
                    found: true,
                    result: queryResult.rows[0],
                };
            }
            return { found: false } as const;
        });
    }
    
    async updateOracleRequest(oracle_data: OracleFulfillment, evm_request_id: string): Promise<void> {
        await this.query(async client => {
            try {
                await client.query(
                    `
                    INSERT INTO oracle_requests(
                        ${ORACLE_REQUEST_COLUMNS}
                    ) values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                    `,
                    [
                        oracle_data.request_id,
                        evm_request_id,
                        oracle_data.expiration.value.toString(),
                        oracle_data.sender,
                        oracle_data.payment.value.toString(),
                        oracle_data.spec_id,
                        oracle_data.callback,
                        oracle_data.nonce.value.toString(),
                        oracle_data.data_version.value.toString(),
                        oracle_data.request_count.value.toString(),
                        oracle_data.sender_buff,
                        oracle_data.data
                    ]
                );
            } catch (error) {
                console.log(`Error performing oracle request update: ${error}`, error);
                throw error;
            }
        });
    }

    static async connect(skipMigrations = false): Promise<PgDataStore> {
        const clientConfig = getPgClientConfig();
        const initTimer = stopwatch();
        let connectionError: Error | undefined;
        let connectionOkay = false;
        do {
            const client = new Client(clientConfig);
            try {
                await client.connect();
                connectionOkay = true;
                break;
            } catch (error) {
                if (
                    error.code !== 'ECONNREFUSED' &&
                    error.message !== 'Connection terminated unexpectedly'
                ) {
                    console.log('Cannot connect to pg', error);
                    throw error;
                }
                console.log('Pg connection failed, retrying in 2000ms..');
                connectionError = error;
                await timeout(2000);
            } finally {
                client.end(() => {});
            }
        } while (initTimer.getElapsed() < Number.MAX_SAFE_INTEGER);
        if (!connectionOkay) {
            connectionError = connectionError ?? new Error('Error connecting to database');
            throw connectionError;
        }
    
        if (!skipMigrations) {
            await runMigrations(clientConfig);
        }
        const pool = new Pool({
            ...clientConfig,
        });
        pool.on('error', error => {
            console.log(`Postgres connection pool error: ${error.message}`, error);
        });
        let poolClient: PoolClient | undefined;
        try {
            poolClient = await pool.connect();
            return new PgDataStore(pool);
        } catch (error) {
            console.log(
                `Error connecting to Postgres using ${JSON.stringify(clientConfig)}: ${error}`,
                error
            );
            throw error;
        } finally {
            poolClient?.release();
        }
    }

    /**
    * Creates a postgres pool client connection. If the connection fails due to a transient error, it is retried until successful.
    * You'd expect that the pg lib to handle this, but it doesn't, see https://github.com/brianc/node-postgres/issues/1789
    */
    async connectWithRetry(): Promise<PoolClient> {
        for (let retryAttempts = 1; ; retryAttempts++) {
            try {
                const client = await this.pool.connect();
                return client;
            } catch (error) {
                // Check for transient errors, and retry after 1 second
                if (error.code === 'ECONNREFUSED') {
                    console.log(`Postgres connection ECONNREFUSED, will retry, attempt #${retryAttempts}`);
                    await timeout(1000);
                } else if (error.code === 'ETIMEDOUT') {
                    console.log(`Postgres connection ETIMEDOUT, will retry, attempt #${retryAttempts}`);
                    await timeout(1000);
                } else if (error.message === 'the database system is starting up') {
                    console.log(
                        `Postgres connection failed while database system is restarting, will retry, attempt #${retryAttempts}`
                    );
                    await timeout(1000);
                } else if (error.message === 'Connection terminated unexpectedly') {
                    console.log(
                        `Postgres connection terminated unexpectedly, will retry, attempt #${retryAttempts}`
                    );
                    await timeout(1000);
                } else {
                    throw error;
                }
            }
        }
    }

    /**
    * Execute queries against the connection pool.
    */
    async query<T>(cb: (client: ClientBase) => Promise<T>): Promise<T> {
        const client = await this.connectWithRetry();
        try {
            if (SQL_QUERY_LEAK_DETECTION) {
                // Monkey patch in some query leak detection. Taken from the lib's docs:
                // https://node-postgres.com/guides/project-structure
                // eslint-disable-next-line @typescript-eslint/unbound-method
                const query = client.query;
                // eslint-disable-next-line @typescript-eslint/unbound-method
                const release = client.release;
                const lastQueries: any[] = [];
                const timeout = setTimeout(() => {
                    const queries = lastQueries.map(q => getSqlQueryString(q));
                    console.log(`Pg client has been checked out for more than 5 seconds`);
                    console.log(`Last query: ${queries.join('|')}`);
                }, 5000);
                // @ts-expect-error hacky typing
                client.query = (...args) => {
                    lastQueries.push(args[0]);
                    // @ts-expect-error hacky typing
                    return query.apply(client, args);
                };
                client.release = () => {
                    clearTimeout(timeout);
                    client.query = query;
                    client.release = release;
                    return release.apply(client);
                };
            }
            const result = await cb(client);
            return result;
        } finally {
            client.release();
        }
    }

    /**
    * Execute queries within a sql transaction.
    */
    async queryTx<T>(cb: (client: ClientBase) => Promise<T>): Promise<T> {
        return await this.query(async client => {
            try {
                await client.query('BEGIN');
                const result = await cb(client);
                await client.query('COMMIT');
                return result;
            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            }
        });
    }

   
    async close(): Promise<void> {
        await this.pool.end();
    }
}


