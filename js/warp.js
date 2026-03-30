import arrayUnique from "array-uniq";
import zip from "just-zip-it";
import fs from "fs";
import { expand } from "brace-expansion";
import yaml from "js-yaml";
import os from "os";
import path from "path";
import { tap } from "chord";
//#region src/js/utils/keybinds.ts
function generateSyntheticKeybinds(commands, keybinds) {
	const sortedKeybinds = arrayUnique(keybinds).sort();
	const sortedCommands = arrayUnique(commands).sort();
	return Object.fromEntries(zip(sortedCommands, sortedKeybinds));
}
//#endregion
//#region src/js/utils/file.ts
function exists(path) {
	try {
		fs.statSync(path);
		return true;
	} catch (err) {
		return false;
	}
}
//#endregion
//#region src/js/warp.ts
function extractCommands(chords) {
	const result = [];
	for (const chord of Object.values(chords ?? {})) if (chord?.args?.[0] && !chord.shortcut) result.push(chord.args[0]);
	return result;
}
function buildWarpHandler() {
	const syntheticKeybinds = generateSyntheticKeybinds(extractCommands(this.chords), [
		"alt+shift+cmd+{0..9}",
		"ctrl+cmd+shift+{0..9}",
		"ctrl+alt+shift+{0..9}"
	].flatMap((pattern) => expand(pattern)));
	const sortedCommands = Object.keys(syntheticKeybinds).sort();
	const keybindingsPath = path.join(os.homedir(), ".warp", "keybindings.yaml");
	let keybindings = {};
	if (exists(keybindingsPath)) {
		const yml = yaml.load(fs.readFileSync(keybindingsPath, "utf8"));
		if (typeof yml === "object" && yml !== null) keybindings = yml;
	}
	for (const cmd of sortedCommands) {
		const keybind = syntheticKeybinds[cmd].replaceAll("+", "-");
		keybindings[cmd] = keybind;
	}
	fs.writeFileSync(keybindingsPath, "---\n" + yaml.dump(keybindings));
	return function command(cmd) {
		const keybind = keybindings[cmd];
		if (!keybind) return false;
		tap(keybind.replaceAll("-", "+"));
		return true;
	};
}
//#endregion
export { buildWarpHandler as default };
