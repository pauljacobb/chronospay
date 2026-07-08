export function up(pgm) {
  pgm.createTable('users', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    name: { type: 'varchar(255)', notNull: true },
    email: { type: 'varchar(255)', notNull: true, unique: true },
    password_hash: { type: 'varchar(255)', notNull: true },
    role: { type: 'varchar(20)', default: 'client' },
    wallet_address: { type: 'varchar(56)', unique: true },
    created_at: { type: 'timestamptz', default: pgm.func('CURRENT_TIMESTAMP') }
  });

  pgm.createTable('jobs', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    client_id: { type: 'uuid', notNull: true, references: 'users', onDelete: 'cascade' },
    freelancer_id: { type: 'uuid', references: 'users', onDelete: 'set null' },
    title: { type: 'varchar(255)', notNull: true },
    description: { type: 'text', notNull: true },
    budget: { type: 'numeric(20,7)', notNull: true },
    status: { type: 'varchar(20)', default: 'open' },
    escrow_id: { type: 'bigint', unique: true },
    tx_hash: { type: 'varchar(64)', unique: true },
    created_at: { type: 'timestamptz', default: pgm.func('CURRENT_TIMESTAMP') },
    updated_at: { type: 'timestamptz', default: pgm.func('CURRENT_TIMESTAMP') }
  });

  pgm.createTable('proposals', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    job_id: { type: 'uuid', notNull: true, references: 'jobs', onDelete: 'cascade' },
    freelancer_id: { type: 'uuid', notNull: true, references: 'users', onDelete: 'cascade' },
    bid_amount: { type: 'numeric(20,7)', notNull: true },
    cover_letter: { type: 'text', notNull: true },
    status: { type: 'varchar(20)', default: 'pending' },
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
  pgm.createIndex('jobs', 'client_id');
  pgm.createIndex('jobs', 'freelancer_id');
  pgm.createIndex('proposals', 'job_id');
  pgm.createIndex('proposals', 'freelancer_id');
}

export function down(pgm) {
  pgm.dropTable('wallets');
  pgm.dropTable('proposals');
  pgm.dropTable('jobs');
  pgm.dropTable('users');
}
