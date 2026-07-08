use soroban_sdk::{contracttype, Address, Symbol, Vec};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Admin,
    Issuer(Address),
    PatientRecords(Address),
    Record(u64), // token_id -> VaccinationRecord
    NextTokenId,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VaccinationRecord {
    pub token_id: u64,
    pub vaccine_name: Symbol,
    pub date: u64,
    pub issuer: Address,
    pub timestamp: u64,
}
