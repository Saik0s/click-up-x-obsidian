import { CreateTaskModal } from "./components/CreateTaskModal";
import { Editor, MarkdownView, Notice, Plugin } from "obsidian";
import { MainAppModal, createTable } from "./signIn";
import "./styles.css";
import { createTask, getAuthorizedUser, getTasks, getTeams } from "./api";

import * as dotenv from "dotenv";
import { SigninRequiredModal } from "components/SigninRequired";

const configDir = app.vault.configDir;

// dotenv.config({
// 	path: `${configDir}/plugins/click-up-x-obsidian/.env`,
// 	debug: true,
// });
dotenv.config({
	// path: `${basePath}/.obsidian/plugins/click-up-x-obsidian/.env`,
	debug: false,
});
// Remember to rename these classes and interfaces!

type TClickUpRedirectParams = {
	action: string;
	code: string;
};

interface ClickUpPluginSettings {
	user: any;
	teams: any[];
	token: string;
	teamId: string;
}

const DEFAULT_SETTINGS: ClickUpPluginSettings = {
	user: null,
	teamId: "",
	teams: [],
	token: "",
};

export default class ClickUpPlugin extends Plugin {
	settings: ClickUpPluginSettings;

	async onload() {
		console.log("loaded?");
		console.log(process.env);
		// Returns ClickUp code
		this.registerObsidianProtocolHandler("plugin", async (e) => {
			const parameters = e as TClickUpRedirectParams;
			localStorage.setItem("CLICK_UP_CODE", parameters.code);
		});

		await this.loadSettings();

		// This creates an icon in the left ribbon.
		this.addRibbonIcon(
			"refresh-ccw-dot",
			"x ClickUp",
			(evt: MouseEvent) => {
				// Called when the user clicks the icon.
				new MainAppModal(this, (result) => {
					new Notice(`Hello, ${result}!`);
				}).open();
			}
		);

		this.addCommand({
			id: "manual-create-task",
			name: "Create ClickUp task",
			callback: async () => {
				if (!this.settings.token) {
					new SigninRequiredModal(this.app).open();
				} else {
					new CreateTaskModal(this).open();
				}
			},
		});

		this.addCommand({
			id: "create-task",
			name: "Create ClickUp task from selection",
			hotkeys: [{ modifiers: ["Mod" || "Ctrl", "Shift"], key: "c" }],
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				const sel = editor.getSelection();
				const defaultList = localStorage.getItem("selectedList");

				if (!sel) {
					return;
				}
				if (!defaultList) {
					return;
				}
				const list = JSON.parse(defaultList);
				try {
					const task = await createTask({
						data: {
							name: sel,
							description: "",
							assignees: [],
							priority: 3,
						},
						listId: list.id,
					});
					if (task.err) {
						throw new Error(task.err);
					}
					setTimeout(() => {
						editor.replaceRange(
							` [task](${task.url})`,
							editor.getCursor("to")
						);
						new Notice("Created new task!", 3000);
						this.syncronizeListNote(list.id);
					}, 100);
				} catch (e) {
					//alert on error
					console.log(e);
				}
			},
		});
	}

	onunload() {}

	async fetchUser(token: string) {
		const user = await getAuthorizedUser();
		const teams = await getTeams();
		await this.saveData({ user, token, teams });

		await this.loadSettings();
	}

	async clearUser() {
		localStorage.removeItem("token");
		await this.saveData({ token: "", user: null, teams: [] });
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async syncronizeListNote(id: string) {
		// console.log(app.vault)
		const note = app.vault
			.getFiles()
			.filter((f) => f.path.startsWith("ClickUp"))
			.find((f) => f.path.includes(`[${id}]`));

		if (!note) {
			console.log("could not find note to sync");
			return;
		}

		const vault = this.app.vault;
		const tasks = await getTasks(id);
		const rows = tasks.map((task: any, index: any) => {
			return {
				id: task.id,
				order: index + 1,
				name: task.name,
				status: task.status.status,
				date_created: new Date(
					Number(task.date_created)
				).toLocaleString("en-US"),
				creator: task.creator.username,
				assignees: task.assignees.map((u: any) => u.username),
				priority: ["Low", "Medium", "High", "Critical"],
			};
		});
		const tableHTML = createTable(rows);
		const filePath = note!.path.toString();

		vault.delete(note!);
		vault.create(filePath, tableHTML);
	}
}
