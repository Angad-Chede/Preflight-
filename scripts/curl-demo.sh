#!/usr/bin/env bash
set -e

# ==============================================================================
# Preflight Full Flow Demo Script (Replay Mode)
# Proves: Health -> Hash -> Start Run -> Plan Ready -> High Risk ->
#         Revise Plan -> Medium Risk -> Approve -> Apply -> Undo -> Hash Match
# ==============================================================================

PORT="${PORT:-3001}"
BASE_URL="http://localhost:${PORT}"

echo "=================================================================="
echo "Preflight Replay Flow Verification Demo"
echo "Target Server: ${BASE_URL}"
echo "=================================================================="

# 1. Health check
echo -e "\n1. Checking Server Health..."
HEALTH_RESP=$(curl -s -f "${BASE_URL}/api/health")
echo "Health Response: ${HEALTH_RESP}"

# 2. Initial base database hash
echo -e "\n2. Fetching Initial Base Database Hash..."
HASH_RESP=$(curl -s -f "${BASE_URL}/api/db/hash")
INITIAL_HASH=$(node -e "console.log(JSON.parse(process.argv[1]).hash)" "${HASH_RESP}")
echo "Initial Base Hash: ${INITIAL_HASH}"

# 3. Start Scenario A run in Replay mode
echo -e "\n3. Creating Run for Scenario A (Replay Mode)..."
CREATE_PAYLOAD='{"task": "Clean up the test orders from the database.", "scenario": "A", "mode": "replay"}'
CREATE_RESP=$(curl -s -f -X POST "${BASE_URL}/api/runs" \
  -H "Content-Type: application/json" \
  -d "${CREATE_PAYLOAD}")
RUN_ID=$(node -e "console.log(JSON.parse(process.argv[1]).runId)" "${CREATE_RESP}")
echo "Created Run ID: ${RUN_ID}"

# 4. Wait for plan to be ready
echo -e "\n4. Waiting for Plan Execution..."
for i in {1..30}; do
  STATUS_RESP=$(curl -s -f "${BASE_URL}/api/runs/${RUN_ID}")
  STATUS=$(node -e "console.log(JSON.parse(process.argv[1]).status)" "${STATUS_RESP}")
  if [ "${STATUS}" == "planned" ]; then
    echo "Plan ready! Status: ${STATUS}"
    break
  fi
  sleep 0.5
done

# 5. Inspect proposed changes and risk level
echo -e "\n5. Inspecting Proposed Changes (Plan Version 1)..."
node -e '
  const run = JSON.parse(process.argv[1]);
  console.log("Plan Version:", run.planVersion);
  console.log("Steps executed:", run.steps.length);
  console.log("Changes proposed:", run.changes.length);
  for (const c of run.changes) {
    console.log(`- Change: [${c.id}] ${c.summary}`);
    console.log(`  Target: ${c.target} | Rows: ${c.rowsAffected} | Risk: ${c.risk.level} (Score: ${c.risk.score}/100)`);
    console.log(`  Reasons: ${c.risk.reasons.join("; ")}`);
  }
' "${STATUS_RESP}"

# 6. Revise the plan with feedback
echo -e "\n6. Requesting Plan Revision..."
REVISE_PAYLOAD='{"notes": "Only delete test orders where paid is 0."}'
REVISE_RESP=$(curl -s -f -X POST "${BASE_URL}/api/runs/${RUN_ID}/revise" \
  -H "Content-Type: application/json" \
  -d "${REVISE_PAYLOAD}")
NEW_VERSION=$(node -e "console.log(JSON.parse(process.argv[1]).planVersion)" "${REVISE_RESP}")
echo "Revision requested. New plan version target: ${NEW_VERSION}"

# 7. Wait for revised plan
echo -e "\n7. Waiting for Revised Plan Execution..."
for i in {1..30}; do
  STATUS_RESP=$(curl -s -f "${BASE_URL}/api/runs/${RUN_ID}")
  STATUS=$(node -e "console.log(JSON.parse(process.argv[1]).status)" "${STATUS_RESP}")
  VERSION=$(node -e "console.log(JSON.parse(process.argv[1]).planVersion)" "${STATUS_RESP}")
  if [ "${STATUS}" == "planned" ] && [ "${VERSION}" -eq "${NEW_VERSION}" ]; then
    echo "Revised plan ready! Status: ${STATUS}, Version: ${VERSION}"
    break
  fi
  sleep 0.5
done

node -e '
  const run = JSON.parse(process.argv[1]);
  for (const c of run.changes) {
    console.log(`- Revised Change: [${c.id}] ${c.summary}`);
    console.log(`  Target: ${c.target} | Rows: ${c.rowsAffected} | Risk: ${c.risk.level} (Score: ${c.risk.score}/100)`);
  }
' "${STATUS_RESP}"

CHANGE_ID=$(node -e "console.log(JSON.parse(process.argv[1]).changes[0].id)" "${STATUS_RESP}")

# 8. Approve the revised change
echo -e "\n8. Approving Revised Change (${CHANGE_ID})..."
DECISION_PAYLOAD=$(node -e 'console.log(JSON.stringify({ changeId: process.argv[1], decision: "approved" }))' "${CHANGE_ID}")
DECISION_RESP=$(curl -s -f -X POST "${BASE_URL}/api/runs/${RUN_ID}/decisions" \
  -H "Content-Type: application/json" \
  -d "${DECISION_PAYLOAD}")
DECISION_STATE=$(node -e "console.log(JSON.parse(process.argv[1]).decision)" "${DECISION_RESP}")
echo "Decision recorded: ${DECISION_STATE}"

# 9. Apply the approved changes
echo -e "\n9. Applying Approved Changes to Base Database..."
APPLY_RESP=$(curl -s -f -X POST "${BASE_URL}/api/runs/${RUN_ID}/apply")
echo "Apply Response: ${APPLY_RESP}"
AFTER_APPLY_HASH=$(node -e "console.log(JSON.parse(process.argv[1]).hashes.afterApply)" "${APPLY_RESP}")
echo "After Apply Hash: ${AFTER_APPLY_HASH}"

# 10. Undo the changes
echo -e "\n10. Undoing Applied Changes (Restoring Snapshot)..."
UNDO_RESP=$(curl -s -f -X POST "${BASE_URL}/api/runs/${RUN_ID}/undo")
echo "Undo Response: ${UNDO_RESP}"
MATCH=$(node -e "console.log(JSON.parse(process.argv[1]).match)" "${UNDO_RESP}")
AFTER_UNDO_HASH=$(node -e "console.log(JSON.parse(process.argv[1]).hashes.afterUndo)" "${UNDO_RESP}")

echo "Undo Match: ${MATCH}"
echo "After Undo Hash: ${AFTER_UNDO_HASH}"

# 11. Final base hash check
echo -e "\n11. Verifying Database Hash Restoration..."
FINAL_HASH_RESP=$(curl -s -f "${BASE_URL}/api/db/hash")
FINAL_HASH=$(node -e "console.log(JSON.parse(process.argv[1]).hash)" "${FINAL_HASH_RESP}")

if [ "${FINAL_HASH}" == "${INITIAL_HASH}" ] && [ "${MATCH}" == "true" ]; then
  echo "SUCCESS! Base database hash was completely restored to initial state."
  echo "Initial: ${INITIAL_HASH}"
  echo "Final:   ${FINAL_HASH}"
  echo "=================================================================="
  echo "Demo completed successfully!"
else
  echo "ERROR: Hash mismatch! Expected ${INITIAL_HASH}, got ${FINAL_HASH}"
  exit 1
fi
