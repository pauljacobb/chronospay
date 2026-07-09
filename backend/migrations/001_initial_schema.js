export function up(pgm) {
  pgm.createTable('users', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    name: { type: 'varchar(255)', notNull: true },
    email: { type: 'varchar(255)', notNull: true, unique: true },
    password_hash: { type: 'varchar(255)', notNull: true },
    role: { type: 'varchar(20)', default: 'sender' },
    wallet_address: { type: 'varchar(56)', unique: true },
    created_at: { type: 'timestamptz', default: pgm.func('CURRENT_TIMESTAMP') }
  });

  pgm.createTable('streams', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    sender_id: { type: 'uuid', notNull: true, references: 'users', onDelete: 'cascade' },
    recipient_address: { type: 'varchar(56)', notNull: true },
    amount: { type: 'numeric(20,7)', notNull: true },
    start_time: { type: 'timestamptz', notNull: true },
    stop_time: { type: 'timestamptz', notNull: true },
    status: { type: 'varchar(20)', default: 'active' },
    withdrawn: { type: 'numeric(20,7)', default: 0.0 },
    escrow_id: { type: 'bigint', unique: true },
    tx_hash: { type: 'varchar(64)', unique: true },
    created_at: { type: 'timestamptz', default: pgm.func('CURRENT_TIMESTAMP') },
    updated_at: { type: 'timestamptz', default: pgm.func('CURRENT_TIMESTAMP') }
  });

  pgm.createTable('withdrawals', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    stream_id: { type: 'uuid', notNull: true, references: 'streams', onDelete: 'cascade' },
    amount: { type: 'numeric(20,7)', notNull: true },
    tx_hash: { type: 'varchar(64)', unique: true },
    created_at: { type: 'timestamptz', default: pgm.func('CURRENT_TIMESTAMP') }
  });

  pgm.createTable('wallets', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', notNull: true, unique: true, references: 'users', onDelete: 'cascade' },
    public_key: { type: 'varchar(56)', notNull: true, unique: true },
    encrypted_secret_key: { type: 'text', notNull: true },
    iv: { type: 'varchar(32)', notNull: true },
    created_at: { type: 'timestamptz', default: pgm.func('CURRENT_TIMESTAMP') }
  });

  // Indexes
  pgm.createIndex('users', 'email');
  pgm.createIndex('streams', 'sender_id');
  pgm.createIndex('streams', 'recipient_address');
  pgm.createIndex('withdrawals', 'stream_id');
}

export function down(pgm) {
  pgm.dropTable('wallets');
  pgm.dropTable('withdrawals');
  pgm.dropTable('streams');
  pgm.dropTable('users');
}
