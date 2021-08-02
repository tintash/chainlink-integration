/* eslint-disable @typescript-eslint/camelcase */
import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
    pgm.createTable('oracle_request', {
        id: {
            type: 'serial',
            primaryKey: true,
        },
        request_id: {
            type: 'bytea',
            notNull: true,
        },
        evm_request_id: {
            type: 'bytea',
            notNull: true,
        },
        expiration: {
            notNull: true,
            type: 'integer',
        },
        sender: {
            type: 'string',
            notNull: true,
        },
        payment: {
            notNull: true,
            type: 'integer',
        },
        spec_id: {
            notNull: true,
            type: 'bytea',
        },
        callback: {
            type: 'string',
            notNull: true,
        },
        nonce: {
            type: 'integer',
            notNull: true,
        },
        data_version: {
            type: 'integer',
            notNull: true,
        },
        request_count: {
            type: 'integer',
            notNull: true,
        },
        sender_buff: {
            type: 'bytea',
            notNull: true,
        },
        data: {
            type: 'bytea',
            notNull: true,
        }
    });
    pgm.createIndex('oracle_request', 'request_id');
    pgm.createIndex('oracle_request', 'evm_request_id');
}

export async function down(pgm: MigrationBuilder): Promise<void> {
    pgm.dropTable('oracle_request');
}
