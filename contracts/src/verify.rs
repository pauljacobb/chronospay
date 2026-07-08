use crate::storage::{DataKey, VaccinationRecord};
use soroban_sdk::{Address, Env, Vec};

pub fn verify_vaccination_records(env: &Env, wallet: Address) -> Vec<VaccinationRecord> {
    let patient_tokens: Vec<u64> = env
        .storage()
        .persistent()
        .get(&DataKey::PatientRecords(wallet))
        .unwrap_or_else(|| Vec::new(env));

    let mut records = Vec::new(env);
    for token_id in patient_tokens.iter() {
        if let Some(record) = env
            .storage()
            .persistent()
            .get::<_, VaccinationRecord>(&DataKey::Record(token_id))
        {
            records.push_back(record);
        }
    }
    records
}
