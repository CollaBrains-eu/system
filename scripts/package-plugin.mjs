import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const release = resolve(root, "release");
const dist = resolve(root, "dist");
if (!existsSync(resolve(dist, "assets/studio.js"))) {
  throw new Error("Missing production assets. Run npm run build first.");
}

rmSync(release, { recursive: true, force: true });
mkdirSync(release, { recursive: true });
const plugin = resolve(release, "oxxa-studio");
cpSync(resolve(root, "wordpress/oxxa-studio"), plugin, { recursive: true });
mkdirSync(resolve(plugin, "assets"), { recursive: true });
cpSync(resolve(dist, "assets"), resolve(plugin, "assets"), { recursive: true });
cpSync(resolve(dist, ".vite"), resolve(plugin, "assets/.vite"), {
  recursive: true,
});
cpSync(
  resolve(root, "wordpress/oxxa-studio-theme"),
  resolve(release, "oxxa-studio-theme"),
  { recursive: true },
);

for (const folder of ["oxxa-studio", "oxxa-studio-theme"]) {
  const result = spawnSync("zip", ["-qr", `${folder}.zip`, folder], {
    cwd: release,
    stdio: "inherit",
  });
  if (result.status !== 0) throw new Error(`Could not package ${folder}.zip`);
  console.log(`Created release/${folder}.zip`);
}
