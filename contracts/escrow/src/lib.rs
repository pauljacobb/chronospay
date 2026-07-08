#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, token, Address, Env, Symbol};

#[derive(Clone, Debug, PartialEq)]
#[contracttype]
pub struct Job {
    pub client: Address,
    pub freelancer: Option<Address>,
    pub budget: i128,
    pub status: u32, // 0 = Created, 1 = Assigned, 2 = Completed, 3 = Refunded
}

#[contract]
pub struct GigFlowEscrow;

#[contractimpl]
impl GigFlowEscrow {
    // Save token contract address in storage
    pub fn initialize(env: Env, admin: Address, token: Address) {
        if env.storage().instance().has(&Symbol::new(&env, "token")) {
            panic!("already initialized");
        }
        env.storage().instance().set(&Symbol::new(&env, "admin"), &admin);
        env.storage().instance().set(&Symbol::new(&env, "token"), &token);
    }

    // Client creates a job and locks budget in contract
    pub fn create_job(env: Env, job_id: u64, client: Address, budget: i128) {
        client.require_auth();

        if budget <= 0 {
            panic!("budget must be positive");
        }

        let job_key = Symbol::new(&env, "job");
        // Check if job already exists
        if env.storage().persistent().has(&(job_key.clone(), job_id)) {
            panic!("job already exists");
        }

        // Get token client and transfer budget to contract
        let token_addr: Address = env.storage().instance().get(&Symbol::new(&env, "token")).unwrap();
        let token_client = token::Client::new(&env, &token_addr);
        token_client.transfer(&client, &env.current_contract_address(), &budget);

        // Store job details
        let job = Job {
            client,
            freelancer: None,
            budget,
            status: 0, // Created
        };

        env.storage().persistent().set(&(job_key, job_id), &job);
    }

    // Client assigns a freelancer to a job
    pub fn assign_freelancer(env: Env, job_id: u64, client: Address, freelancer: Address) {
        client.require_auth();

        let job_key = Symbol::new(&env, "job");
        let mut job: Job = env.storage().persistent().get(&(job_key.clone(), job_id)).expect("job not found");

        if job.client != client {
            panic!("unauthorized client");
        }

        if job.status != 0 {
            panic!("job not in created state");
        }

        job.freelancer = Some(freelancer);
        job.status = 1; // Assigned

        env.storage().persistent().set(&(job_key, job_id), &job);
    }

    // Client approves work and releases locked budget to freelancer
    pub fn release_payout(env: Env, job_id: u64, client: Address) {
        client.require_auth();

        let job_key = Symbol::new(&env, "job");
        let mut job: Job = env.storage().persistent().get(&(job_key.clone(), job_id)).expect("job not found");

        if job.client != client {
            panic!("unauthorized client");
        }

        if job.status != 1 {
            panic!("job not in assigned state");
        }

        let freelancer = job.freelancer.clone().expect("freelancer not assigned");

        // Transfer funds from contract to freelancer
        let token_addr: Address = env.storage().instance().get(&Symbol::new(&env, "token")).unwrap();
        let token_client = token::Client::new(&env, &token_addr);
        token_client.transfer(&env.current_contract_address(), &freelancer, &job.budget);

        job.status = 2; // Completed

        env.storage().persistent().set(&(job_key, job_id), &job);
    }

    // Client refunds job budget (only if not completed/refunded already)
    pub fn refund_job(env: Env, job_id: u64, client: Address) {
        client.require_auth();

        let job_key = Symbol::new(&env, "job");
        let mut job: Job = env.storage().persistent().get(&(job_key.clone(), job_id)).expect("job not found");

        if job.client != client {
            panic!("unauthorized client");
        }

        if job.status >= 2 {
            panic!("job already finalized");
        }

        // Refund funds back to client
        let token_addr: Address = env.storage().instance().get(&Symbol::new(&env, "token")).unwrap();
        let token_client = token::Client::new(&env, &token_addr);
        token_client.transfer(&env.current_contract_address(), &client, &job.budget);

        job.status = 3; // Refunded

        env.storage().persistent().set(&(job_key, job_id), &job);
    }

    // Fetch details of a job
    pub fn get_job(env: Env, job_id: u64) -> Option<Job> {
        let job_key = Symbol::new(&env, "job");
        env.storage().persistent().get(&(job_key, job_id))
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::Address as _;
    use soroban_sdk::{Env, IntoVal};

    #[test]
    fn test_gig_escrow_flow() {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let client = Address::generate(&env);
        let freelancer = Address::generate(&env);

        // Register token contract
        let token_admin = Address::generate(&env);
        let token_contract_id = env.register_stellar_asset_contract(token_admin.clone());
        let token_client = token::Client::new(&env, &token_contract_id);

        // Mint some test tokens to the client
        token_client.mint(&client, &5000);
        assert_eq!(token_client.balance(&client), 5000);

        // Register escrow contract
        let escrow_id = env.register_contract(None, GigFlowEscrow);
        let escrow_client = GigFlowEscrowClient::new(&env, &escrow_id);

        // Initialize contract
        escrow_client.initialize(&admin, &token_contract_id);

        // 1. Create Job (Lock budget)
        let job_id: u64 = 101;
        escrow_client.create_job(&job_id, &client, &2000);

        // Client balance should decrease, contract balance should increase
        assert_eq!(token_client.balance(&client), 3000);
        assert_eq!(token_client.balance(&escrow_id), 2000);

        let job = escrow_client.get_job(&job_id).unwrap();
        assert_eq!(job.client, client);
        assert_eq!(job.freelancer, None);
        assert_eq!(job.budget, 2000);
        assert_eq!(job.status, 0); // Created

        // 2. Assign Freelancer
        escrow_client.assign_freelancer(&job_id, &client, &freelancer);
        let job_assigned = escrow_client.get_job(&job_id).unwrap();
        assert_eq!(job_assigned.freelancer, Some(freelancer.clone()));
        assert_eq!(job_assigned.status, 1); // Assigned

        // 3. Release Payout
        escrow_client.release_payout(&job_id, &client);
        assert_eq!(token_client.balance(&escrow_id), 0);
        assert_eq!(token_client.balance(&freelancer), 2000);

        let job_completed = escrow_client.get_job(&job_id).unwrap();
        assert_eq!(job_completed.status, 2); // Completed
    }

    #[test]
    fn test_gig_escrow_refund() {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let client = Address::generate(&env);

        let token_admin = Address::generate(&env);
        let token_contract_id = env.register_stellar_asset_contract(token_admin.clone());
        let token_client = token::Client::new(&env, &token_contract_id);

        token_client.mint(&client, &3000);

        let escrow_id = env.register_contract(None, GigFlowEscrow);
        let escrow_client = GigFlowEscrowClient::new(&env, &escrow_id);
        escrow_client.initialize(&admin, &token_contract_id);

        let job_id: u64 = 102;
        escrow_client.create_job(&job_id, &client, &1500);
        assert_eq!(token_client.balance(&client), 1500);

        // Refund job
        escrow_client.refund_job(&job_id, &client);
        assert_eq!(token_client.balance(&client), 3000);
        assert_eq!(token_client.balance(&escrow_id), 0);

        let job = escrow_client.get_job(&job_id).unwrap();
        assert_eq!(job.status, 3); // Refunded
    }
}
