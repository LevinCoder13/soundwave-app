#!/usr/bin/env bash
# Ralph Autonomous Loop (Bash / macOS / Linux / WSL)

MAX_ITERATIONS=${1:-10}
iteration=0

echo "=========================================================="
echo "  Starting Ralph Autonomous Loop (Geoff Huntley Pattern)"
echo "=========================================================="

while [ $iteration -lt $MAX_ITERATIONS ]; do
    iteration=$((iteration + 1))
    echo ""
    echo "[Ralph] === Iteration $iteration / $MAX_ITERATIONS ==="

    prompt_output=$(node scripts/ralph-manager.js next-prompt)
    if [[ "$prompt_output" == *"ALL_TASKS_COMPLETED"* ]]; then
        echo "🎉 [Ralph] All tasks completed! Ready for review & merge."
        break
    fi

    echo "$prompt_output"
    echo ""
    echo "[Ralph] Running deterministic backpressure check..."

    node scripts/ralph-manager.js verify
    if [ $? -eq 0 ]; then
        echo "[Ralph] ✓ Backpressure tests passed!"
        node scripts/ralph-manager.js complete
    else
        echo "[Ralph] ✗ Backpressure test failed! Backpressure applied."
        echo "[Ralph] Halting loop to prevent thrashing."
        break
    fi

    sleep 2
done

node scripts/ralph-manager.js status

