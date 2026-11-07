import { chmodSync, cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
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

const installer = resolve(release, "oxxa-studio-installer");
mkdirSync(installer, { recursive: true });
for (const archive of ["oxxa-studio.zip", "oxxa-studio-theme.zip"]) {
  cpSync(resolve(release, archive), resolve(installer, archive));
}
cpSync(
  resolve(root, "scripts/self-install.sh"),
  resolve(installer, "install.sh"),
);
chmodSync(resolve(installer, "install.sh"), 0o755);
cpSync(
  resolve(root, "SELF-INSTALLATION.md"),
  resolve(installer, "SELF-INSTALLATION.md"),
);
const installerResult = spawnSync(
  "zip",
  ["-qr", "oxxa-studio-self-installer.zip", "oxxa-studio-installer"],
  { cwd: release, stdio: "inherit" },
);
if (installerResult.status !== 0) {
  throw new Error("Could not package oxxa-studio-self-installer.zip");
}
console.log("Created release/oxxa-studio-self-installer.zip");
