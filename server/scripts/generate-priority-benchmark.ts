import fs from "fs";
import path from "path";
import { runAllBenchmarks } from "../src/__tests__/priority/powerBenchmarks";

async function generate() {
    console.log("🚀 Starting Priority Mail Power Benchmark Generation...");

    try {
        const results = await runAllBenchmarks();

        const outputDir = path.join(__dirname, "../../client/public/data");
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const outputPath = path.join(outputDir, "benchmark-results.json");
        fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

        console.log(`✅ Benchmark results generated and saved to: ${outputPath}`);
        console.table(results.map(r => ({
            Scenario: r.scenario,
            Normal: r.normalScore,
            Priority: r.priorityScore,
            Improvement: r.improvement
        })));
    } catch (error) {
        console.error("❌ Failed to generate benchmarks:", error);
        process.exit(1);
    }
}

generate();
