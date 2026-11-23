# Interview preparation

This implementation was AI-authored under explicit authorization. Do not claim that auth, stock, analytics, AI validators or design docs were hand-written. Explain what you reviewed, tested, changed or rejected using actual evidence.

| Topic | Decision | Evidence | Learning / real bug |
|---|---|---|---|
| Atomic orders | ADR 0002/0005 | AC15–AC19 | _Rajat to fill_ |
| Tenant security | ADR 0003 | AC8–AC11, AC20 | _Rajat to fill_ |
| Optional retry keys | ADR 0008 | AC14, AC18 | _Rajat to fill_ |
| IST analytics | ADR 0004 and data model | AC22–AC23 | _Rajat to fill_ |
| AI grounding and cache | ADR 0006 | AC24–AC27 | _Rajat to fill_ |
| Delivery and operations | ADR 0007 | CI configuration, runbook; actual deployment pending | _Rajat to fill_ |

Practise: Which writes must commit in the same Postgres transaction? What happens on a write conflict? Which rows participate in the partial unique retry index? How does a retry with different content behave? Where do roles come from? Which local day contains 19:00 UTC? What can output-number validation prove, and what can it not prove? What fails when a phone uses localhost for the API?

Accepted/rejected suggestions, personal explanations and learning notes must come from Rajat, not a generated answer represented as personal experience.
