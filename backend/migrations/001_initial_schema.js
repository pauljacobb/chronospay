export function up(pgm) {
  pgm.createTable('users', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    name: { type: 'varchar(255)', notNull: true },
    email: { type: 'varchar(255)', notNull: true, unique: true },
    password_hash: { type: 'varchar(255)', notNull: true },
    role: { type: 'varchar(20)', default: 'user' },
    created_at: { type: 'timestamptz', default: pgm.func('CURRENT_TIMESTAMP') }
  });

  pgm.createTable('wallets', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', notNull: true, references: 'users', onDelete: 'cascade' },
    public_key: { type: 'varchar(56)', notNull: true, unique: true },
    encrypted_secret_key: { type: 'text', notNull: true },
    iv: { type: 'varchar(32)', notNull: true },
    created_at: { type: 'timestamptz', default: pgm.func('CURRENT_TIMESTAMP') }
  });

  pgm.createTable('agents', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', notNull: true, references: 'users', onDelete: 'cascade' },
    wallet_address: { type: 'varchar(56)', notNull: true, unique: true },
    status: { type: 'varchar(20)', default: 'pending' },
    country: { type: 'varchar(10)' },
    created_at: { type: 'timestamptz', default: pgm.func('CURRENT_TIMESTAMP') },
    approved_at: { type: 'timestamptz' }
  });

  pgm.createTable('transactions', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    sender_id: { type: 'uuid', notNull: true, references: 'users', onDelete: 'cascade' },
    recipient_address: { type: 'varchar(56)', notNull: true },
    amount: { type: 'numeric(20,7)', notNull: true },
    fee: { type: 'numeric(20,7)', default: 0 },
    asset: { type: 'varchar(10)', notNull: true },
    type: { type: 'varchar(20)', default: 'standard' },
    escrow_id: { type: 'bigint' },
    status: { type: 'varchar(20)', default: 'pending' },
    tx_hash: { type: 'varchar(64)', unique: true },
    created_at: { type: 'timestamptz', default: pgm.func('CURRENT_TIMESTAMP') },
    updated_at: { type: 'timestamptz', default: pgm.func('CURRENT_TIMESTAMP') }
  });

  pgm.createTable('contacts', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', notNull: true, references: 'users', onDelete: 'cascade' },
    name: { type: 'varchar(255)', notNull: true },
    wallet_address: { type: 'varchar(56)', notNull: true },
    created_at: { type: 'timestamptz', default: pgm.func('CURRENT_TIMESTAMP') }
  });
  pgm.addConstraint('contacts', 'contacts_user_wallet_unique', {
    unique: ['user_id', 'wallet_address']
  });

  pgm.createTable('tickets', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', notNull: true, references: 'users', onDelete: 'cascade' },
    subject: { type: 'varchar(255)', notNull: true },
    description: { type: 'text', notNull: true },
    status: { type: 'varchar(20)', default: 'open' },
    created_at: { type: 'timestamptz', default: pgm.func('CURRENT_TIMESTAMP') }
  });

  // Create indices
  pgm.createIndex('users', 'email');
  pgm.createIndex('wallets', 'user_id');
  pgm.createIndex('agents', 'wallet_address');
  pgm.createIndex('transactions', 'sender_id');
  pgm.createIndex('contacts', 'user_id');
}

export function down(pgm) {
  pgm.dropTable('tickets');
  pgm.dropTable('contacts');
  pgm.dropTable('transactions');
  pgm.dropTable('agents');
  pgm.dropTable('wallets');
  pgm.dropTable('users');
}
