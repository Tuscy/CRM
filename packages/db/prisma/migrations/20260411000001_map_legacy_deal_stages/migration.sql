-- Map older short stage labels to canonical pipeline stages (no-op if empty)
UPDATE "Deal" SET stage = 'NEW_LEAD' WHERE stage = 'NEW';
UPDATE "Deal" SET stage = 'PROPOSAL_SENT' WHERE stage = 'PROPOSAL';
