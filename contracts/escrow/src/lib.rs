#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, token, Address, Env};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum EscrowStatus {
    Pending,
    Completed,
    Cancelled,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Escrow {
    pub sender: Address,
    pub agent: Address,
    pub amount: i128,
    pub token: Address,
    pub status: EscrowStatus,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Admin,
    FeeBps,
    FeeWallet,
    Escrow(u64),
}

#[contract]
pub struct KoraPayEscrow;

#[contractimpl]
impl KoraPayEscrow {
    pub fn initialize(env: Env, admin: Address, fee_bps: u32, fee_wallet: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::FeeBps, &fee_bps);
        env.storage().instance().set(&DataKey::FeeWallet, &fee_wallet);
    }

    pub fn create_escrow(
        env: Env,
        id: u64,
        sender: Address,
        agent: Address,
        amount: i128,
        token: Address,
    ) {
        sender.require_auth();

        if env.storage().persistent().has(&DataKey::Escrow(id)) {
            panic!("escrow ID already exists");
        }

        if amount <= 0 {
            panic!("amount must be positive");
        }

        // Lock funds in contract
        let token_client = token::Client::new(&env, &token);
        token_client.transfer(&sender, &env.current_contract_address(), &amount);

        let escrow = Escrow {
            sender,
            agent,
            amount,
            token,
            status: EscrowStatus::Pending,
        };

        env.storage().persistent().set(&DataKey::Escrow(id), &escrow);
    }

    pub fn confirm_payout(env: Env, id: u64) {
        let mut escrow: Escrow = env
            .storage()
            .persistent()
            .get(&DataKey::Escrow(id))
            .unwrap_or_else(|| panic!("escrow not found"));

        if escrow.status != EscrowStatus::Pending {
            panic!("escrow is not pending");
        }

        // Require agent signature
        escrow.agent.require_auth();

        // Calculate fee
        let fee_bps: u32 = env.storage().instance().get(&DataKey::FeeBps).unwrap_or(0);
        let fee_wallet: Address = env.storage().instance().get(&DataKey::FeeWallet).unwrap();
        
        let fee = (escrow.amount * (fee_bps as i128)) / 10000;
        let net_amount = escrow.amount - fee;

        let token_client = token::Client::new(&env, &escrow.token);

        // Distribute funds
        if net_amount > 0 {
            token_client.transfer(&env.current_contract_address(), &escrow.agent, &net_amount);
        }
        if fee > 0 {
            token_client.transfer(&env.current_contract_address(), &fee_wallet, &fee);
        }

        escrow.status = EscrowStatus::Completed;
        env.storage().persistent().set(&DataKey::Escrow(id), &escrow);
    }

    pub fn cancel_escrow(env: Env, id: u64) {
        let mut escrow: Escrow = env
            .storage()
            .persistent()
            .get(&DataKey::Escrow(id))
            .unwrap_or_else(|| panic!("escrow not found"));

        if escrow.status != EscrowStatus::Pending {
            panic!("escrow is not pending");
        }

        // Require sender signature
        escrow.sender.require_auth();

        // Refund full amount to sender
        let token_client = token::Client::new(&env, &escrow.token);
        token_client.transfer(&env.current_contract_address(), &escrow.sender, &escrow.amount);

        escrow.status = EscrowStatus::Cancelled;
        env.storage().persistent().set(&DataKey::Escrow(id), &escrow);
    }

    pub fn update_fee(env: Env, fee_bps: u32, fee_wallet: Address) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        if fee_bps > 10000 {
            panic!("fee cannot exceed 100%");
        }

        env.storage().instance().set(&DataKey::FeeBps, &fee_bps);
        env.storage().instance().set(&DataKey::FeeWallet, &fee_wallet);
    }

    pub fn get_escrow(env: Env, id: u64) -> Escrow {
        env.storage()
            .persistent()
            .get(&DataKey::Escrow(id))
            .unwrap_or_else(|| panic!("escrow not found"))
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{Env};

    #[test]
    fn test_escrow_flow() {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let sender = Address::generate(&env);
        let agent = Address::generate(&env);
        let fee_wallet = Address::generate(&env);

        // Register contract
        let contract_id = env.register_contract(None, KoraPayEscrow);
        let client = KoraPayEscrowClient::new(&env, &contract_id);

        // Register token contract (mock native/token)
        let token_admin = Address::generate(&env);
        let token_id = env.register_stellar_asset_contract(token_admin.clone());
        let token_client = token::Client::new(&env, &token_id);
        let token_admin_client = token::StellarAssetClient::new(&env, &token_id);

        // Mint token to sender
        token_admin_client.mint(&sender, &10000);
        assert_eq!(token_client.balance(&sender), 10000);

        // Initialize Escrow (2.5% Platform fee = 250 bps)
        client.initialize(&admin, &250, &fee_wallet);

        // Create escrow
        client.create_escrow(&1, &sender, &agent, &5000, &token_id);
        assert_eq!(token_client.balance(&sender), 5000);
        assert_eq!(token_client.balance(&contract_id), 5000);

        // Verify status
        let escrow = client.get_escrow(&1);
        assert_eq!(escrow.amount, 5000);
        assert_eq!(escrow.status, EscrowStatus::Pending);

        // Confirm payout
        client.confirm_payout(&1);
        
        // Check distributions
        assert_eq!(token_client.balance(&agent), 4875);
        assert_eq!(token_client.balance(&fee_wallet), 125);
        assert_eq!(token_client.balance(&contract_id), 0);

        let completed_escrow = client.get_escrow(&1);
        assert_eq!(completed_escrow.status, EscrowStatus::Completed);
    }

    #[test]
    fn test_cancel_flow() {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let sender = Address::generate(&env);
        let agent = Address::generate(&env);
        let fee_wallet = Address::generate(&env);

        let contract_id = env.register_contract(None, KoraPayEscrow);
        let client = KoraPayEscrowClient::new(&env, &contract_id);

        let token_admin = Address::generate(&env);
        let token_id = env.register_stellar_asset_contract(token_admin.clone());
        let token_client = token::Client::new(&env, &token_id);
        let token_admin_client = token::StellarAssetClient::new(&env, &token_id);

        token_admin_client.mint(&sender, &10000);

        client.initialize(&admin, &250, &fee_wallet);
        client.create_escrow(&1, &sender, &agent, &5000, &token_id);

        // Cancel escrow
        client.cancel_escrow(&1);

        assert_eq!(token_client.balance(&sender), 10000);
        assert_eq!(token_client.balance(&contract_id), 0);

        let cancelled_escrow = client.get_escrow(&1);
        assert_eq!(cancelled_escrow.status, EscrowStatus::Cancelled);
    }
}
