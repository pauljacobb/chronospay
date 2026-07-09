#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, token, Address, Env, Symbol};

#[derive(Clone, Debug, PartialEq)]
#[contracttype]
pub struct Stream {
    pub sender: Address,
    pub recipient: Address,
    pub amount: i128,         // Total amount locked
    pub start_time: u64,     // Timestamp (seconds) when stream begins
    pub stop_time: u64,      // Timestamp (seconds) when stream ends
    pub withdrawn: i128,     // Amount already withdrawn
    pub status: u32,         // 0 = Active, 1 = Cancelled, 2 = Completed
}

#[contract]
pub struct ChronosPayEscrow;

#[contractimpl]
impl ChronosPayEscrow {
    // Save token contract address and admin in storage
    pub fn initialize(env: Env, admin: Address, token: Address) {
        if env.storage().instance().has(&Symbol::new(&env, "token")) {
            panic!("already initialized");
        }
        env.storage().instance().set(&Symbol::new(&env, "admin"), &admin);
        env.storage().instance().set(&Symbol::new(&env, "token"), &token);
    }

    // Sender locks budget and initializes continuous stream
    pub fn create_stream(
        env: Env,
        stream_id: u64,
        sender: Address,
        recipient: Address,
        amount: i128,
        start_time: u64,
        stop_time: u64,
    ) {
        sender.require_auth();

        if amount <= 0 {
            panic!("amount must be positive");
        }
        if stop_time <= start_time {
            panic!("stop time must exceed start time");
        }

        let stream_key = Symbol::new(&env, "stream");
        if env.storage().persistent().has(&(stream_key.clone(), stream_id)) {
            panic!("stream already exists");
        }

        // Transfer funds from sender to contract
        let token_addr: Address = env.storage().instance().get(&Symbol::new(&env, "token")).unwrap();
        let token_client = token::Client::new(&env, &token_addr);
        token_client.transfer(&sender, &env.current_contract_address(), &amount);

        let stream = Stream {
            sender,
            recipient,
            amount,
            start_time,
            stop_time,
            withdrawn: 0,
            status: 0, // Active
        };

        env.storage().persistent().set(&(stream_key, stream_id), &stream);
    }

    // Recipient pulls vested funds from active stream
    pub fn withdraw_from_stream(env: Env, stream_id: u64, recipient: Address, amount_to_withdraw: i128) {
        recipient.require_auth();

        if amount_to_withdraw <= 0 {
            panic!("withdrawal amount must be positive");
        }

        let stream_key = Symbol::new(&env, "stream");
        let mut stream: Stream = env.storage().persistent().get(&(stream_key.clone(), stream_id)).expect("stream not found");

        if stream.recipient != recipient {
            panic!("unauthorized recipient");
        }
        if stream.status != 0 {
            panic!("stream is not active");
        }

        let current_time = env.ledger().timestamp();
        
        // Calculate linear vesting
        let vested = if current_time <= stream.start_time {
            0
        } else if current_time >= stream.stop_time {
            stream.amount
        } else {
            let elapsed = (current_time - stream.start_time) as i128;
            let duration = (stream.stop_time - stream.start_time) as i128;
            (stream.amount * elapsed) / duration
        };

        let available = vested - stream.withdrawn;
        if amount_to_withdraw > available {
            panic!("insufficient vested balance available");
        }

        // Transfer funds to recipient
        let token_addr: Address = env.storage().instance().get(&Symbol::new(&env, "token")).unwrap();
        let token_client = token::Client::new(&env, &token_addr);
        token_client.transfer(&env.current_contract_address(), &recipient, &amount_to_withdraw);

        stream.withdrawn += amount_to_withdraw;
        if stream.withdrawn == stream.amount {
            stream.status = 2; // Completed
        }

        env.storage().persistent().set(&(stream_key, stream_id), &stream);
    }

    // Sender cancels stream, splitting balances based on time
    pub fn cancel_stream(env: Env, stream_id: u64, sender: Address) {
        sender.require_auth();

        let stream_key = Symbol::new(&env, "stream");
        let mut stream: Stream = env.storage().persistent().get(&(stream_key.clone(), stream_id)).expect("stream not found");

        if stream.sender != sender {
            panic!("unauthorized sender");
        }
        if stream.status != 0 {
            panic!("stream is not active");
        }

        let current_time = env.ledger().timestamp();
        
        // Calculate linear vesting up to current time
        let vested = if current_time <= stream.start_time {
            0
        } else if current_time >= stream.stop_time {
            stream.amount
        } else {
            let elapsed = (current_time - stream.start_time) as i128;
            let duration = (stream.stop_time - stream.start_time) as i128;
            (stream.amount * elapsed) / duration
        };

        let available_vested = vested - stream.withdrawn;
        let refund_unvested = stream.amount - vested;

        let token_addr: Address = env.storage().instance().get(&Symbol::new(&env, "token")).unwrap();
        let token_client = token::Client::new(&env, &token_addr);

        // Send vested portion to recipient
        if available_vested > 0 {
            token_client.transfer(&env.current_contract_address(), &stream.recipient, &available_vested);
        }

        // Send unvested portion back to sender
        if refund_unvested > 0 {
            token_client.transfer(&env.current_contract_address(), &stream.sender, &refund_unvested);
        }

        stream.status = 1; // Cancelled
        stream.withdrawn = vested;

        env.storage().persistent().set(&(stream_key, stream_id), &stream);
    }

    // Get stream details
    pub fn get_stream(env: Env, stream_id: u64) -> Option<Stream> {
        let stream_key = Symbol::new(&env, "stream");
        env.storage().persistent().get(&(stream_key, stream_id))
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::Address as _;
    use soroban_sdk::{Env, IntoVal};

    #[test]
    fn test_payment_stream_vesting_flows() {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let sender = Address::generate(&env);
        let recipient = Address::generate(&env);

        let token_admin = Address::generate(&env);
        let token_contract_id = env.register_stellar_asset_contract(token_admin.clone());
        let token_client = token::Client::new(&env, &token_contract_id);

        token_client.mint(&sender, &5000);
        assert_eq!(token_client.balance(&sender), 5000);

        let escrow_id = env.register_contract(None, ChronosPayEscrow);
        let escrow_client = ChronosPayEscrowClient::new(&env, &escrow_id);
        escrow_client.initialize(&admin, &token_contract_id);

        // Start time = 1000, Stop time = 2000, Amount = 1000
        let stream_id: u64 = 1;
        env.ledger().set_timestamp(900);
        escrow_client.create_stream(&stream_id, &sender, &recipient, &1000, &1000, &2000);

        assert_eq!(token_client.balance(&sender), 4000);
        assert_eq!(token_client.balance(&escrow_id), 1000);

        // Check details
        let stream = escrow_client.get_stream(&stream_id).unwrap();
        assert_eq!(stream.sender, sender);
        assert_eq!(stream.recipient, recipient);
        assert_eq!(stream.amount, 1000);
        assert_eq!(stream.start_time, 1000);
        assert_eq!(stream.stop_time, 2000);
        assert_eq!(stream.withdrawn, 0);
        assert_eq!(stream.status, 0); // Active

        // Test at t = 1000 (0% vested)
        env.ledger().set_timestamp(1000);
        // should panic if trying to withdraw 100
        // escrow_client.withdraw_from_stream(&stream_id, &recipient, &100);

        // Test at t = 1500 (50% vested = 500 available)
        env.ledger().set_timestamp(1500);
        escrow_client.withdraw_from_stream(&stream_id, &recipient, &300);
        assert_eq!(token_client.balance(&recipient), 300);
        assert_eq!(token_client.balance(&escrow_id), 700);

        let stream_updated = escrow_client.get_stream(&stream_id).unwrap();
        assert_eq!(stream_updated.withdrawn, 300);

        // Test at t = 2000 (100% vested = 1000 total, 700 remaining available)
        env.ledger().set_timestamp(2000);
        escrow_client.withdraw_from_stream(&stream_id, &recipient, &700);
        assert_eq!(token_client.balance(&recipient), 1000);
        assert_eq!(token_client.balance(&escrow_id), 0);

        let stream_completed = escrow_client.get_stream(&stream_id).unwrap();
        assert_eq!(stream_completed.status, 2); // Completed
    }

    #[test]
    fn test_payment_stream_cancellation() {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let sender = Address::generate(&env);
        let recipient = Address::generate(&env);

        let token_admin = Address::generate(&env);
        let token_contract_id = env.register_stellar_asset_contract(token_admin.clone());
        let token_client = token::Client::new(&env, &token_contract_id);
        token_client.mint(&sender, &3000);

        let escrow_id = env.register_contract(None, ChronosPayEscrow);
        let escrow_client = ChronosPayEscrowClient::new(&env, &escrow_id);
        escrow_client.initialize(&admin, &token_contract_id);

        // Start = 1000, Stop = 2000, Amount = 1000
        let stream_id: u64 = 2;
        env.ledger().set_timestamp(1000);
        escrow_client.create_stream(&stream_id, &sender, &recipient, &1000, &1000, &2000);

        // Set time to 1300 (30% vested = 300 to recipient, 700 refunded to sender)
        env.ledger().set_timestamp(1300);
        escrow_client.cancel_stream(&stream_id, &sender);

        assert_eq!(token_client.balance(&recipient), 300);
        assert_eq!(token_client.balance(&sender), 2700); // 2000 left + 700 refund
        assert_eq!(token_client.balance(&escrow_id), 0);

        let stream = escrow_client.get_stream(&stream_id).unwrap();
        assert_eq!(stream.status, 1); // Cancelled
    }
}
