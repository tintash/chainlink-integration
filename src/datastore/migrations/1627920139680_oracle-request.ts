/* eslint-disable @typescript-eslint/camelcase */
import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable('oracle_requests', {
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
      type: 'numeric',
    },
    sender: {
      type: 'string',
      notNull: true,
    },
    payment: {
      notNull: true,
      type: 'numeric',
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
      type: 'numeric',
      notNull: true,
    },
    data_version: {
      type: 'numeric',
      notNull: true,
    },
    request_count: {
      type: 'numeric',
      notNull: true,
    },
    sender_buff: {
      type: 'bytea',
      notNull: true,
    },
    data: {
      type: 'bytea',
      notNull: true,
    },
  });
  pgm.createIndex('oracle_requests', 'request_id');
  pgm.createIndex('oracle_requests', 'evm_request_id');
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('oracle_requests');
}
