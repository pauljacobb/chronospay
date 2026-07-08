#![no_std]
use soroban_sdk::{contract, contractimpl, Address, Env, Symbol, Vec};

mod storage;
mod events;
mod mint;
mod verify;

pub use crate::storage::{DataKey, VaccinationRecord};
use crate::mint::{mint_vaccination_record, is_issuer_authorized};
use crate::verify::verify_vaccination_records;
use crate::events::{emit_issuer_added, emit_issuer_revoked};

#[contract]
pub struct StellarVaxContract;

#[contractimpl]
impl StellarVaxContract {
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    pub fn add_issuer(env: Env, issuer: Address) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        env.storage().persistent().set(&DataKey::Issuer(issuer.clone()), &true);
        emit_issuer_added(&env, &admin, &issuer);
    }

    pub fn revoke_issuer(env: Env, issuer: Address) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        env.storage().persistent().set(&DataKey::Issuer(issuer.clone()), &false);
        emit_issuer_revoked(&env, &admin, &issuer);
    }

    pub fn mint_vaccination(
        env: Env,
        patient: Address,
        vaccine: Symbol,
        date: u64,
        issuer: Address,
    ) -> u64 {
        mint_vaccination_record(&env, patient, vaccine, date, issuer)
    }

    pub fn verify_vaccination(env: Env, wallet: Address) -> Vec<VaccinationRecord> {
        verify_vaccination_records(&env, wallet)
    }

    pub fn is_issuer(env: Env, issuer: Address) -> bool {
        is_issuer_authorized(&env, &issuer)
    }

    pub fn get_admin(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Admin).unwrap()
    }

    // Explicitly block token transfer to enforce soulbound behavior
    pub fn transfer(env: Env, _from: Address, _to: Address, _token_id: u64) {
        panic!("transfer is blocked: StellarVax tokens are soulbound and non-transferable.");
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{Env, Address, Symbol, vec, IntoVal, TryFromVal};

    #[test]
    fn test_flow() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, StellarVaxContract);
        let client = StellarVaxContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let issuer = Address::generate(&env);
        let patient = Address::generate(&env);

        client.initialize(&admin);
        assert_eq!(client.get_admin(), admin);

        // Verify issuer is not yet authorized
        assert!(!client.is_issuer(&issuer));

        // Add issuer
        client.add_issuer(&issuer);
        assert!(client.is_issuer(&issuer));

        // Mint vaccination
        let vaccine = Symbol::new(&env, "COVID-19");
        let date = 1717171717;
        let token_id = client.mint_vaccination(&patient, &vaccine, &date, &issuer);
        assert_eq!(token_id, 1);

        // Verify vaccination
        let records = client.verify_vaccination(&patient);
        assert_eq!(records.len(), 1);
        let record = records.get(0).unwrap();
        assert_eq!(record.token_id, 1);
        assert_eq!(record.vaccine_name, vaccine);
        assert_eq!(record.date, date);
        assert_eq!(record.issuer, issuer);

        // Verify duplicate check reverts
        let result = env.try_invoke_contract_as_address::<u64>(
            &issuer,
            &contract_id,
            &Symbol::new(&env, "mint_vaccination"),
            vec![
                &env,
                patient.clone().into_val(&env),
                vaccine.clone().into_val(&env),
                date.into_val(&env),
                issuer.clone().into_val(&env),
            ],
        );
        assert!(result.is_err());

        // Revoke issuer
        client.revoke_issuer(&issuer);
        assert!(!client.is_issuer(&issuer));

        // Attempting to transfer must panic
        let to = Address::generate(&env);
        let transfer_result = env.try_invoke_contract_as_address::<()>(
            &patient,
            &contract_id,
            &Symbol::new(&env, "transfer"),
            vec![
                &env,
                patient.clone().into_val(&env),
                to.clone().into_val(&env),
                1u64.into_val(&env),
            ],
        );
        assert!(transfer_result.is_err());
    }
}
