import { Plugin, TFolder } from "obsidian";

// Internal (untyped) Obsidian APIs used below.
interface PatchableFileManager {
	getNewFileParent(sourcePath: string, newFilePath?: string): TFolder;
	createNewFolder(parent: TFolder | null): Promise<TFolder>;
}

// New notes (Ctrl/Cmd+N, the "New note" button, ...) are created inside the
// folder you last clicked or created in the file explorer.
export default class NewNoteInFolderPlugin extends Plugin {
	private selected: TFolder | null = null;

	onload() {
		const fileManager = this.app.fileManager as unknown as PatchableFileManager;
		const { getNewFileParent, createNewFolder } = fileManager;

		fileManager.getNewFileParent = (sourcePath, newFilePath) =>
			this.selectedFolder() ??
			getNewFileParent.call(fileManager, sourcePath, newFilePath);

		fileManager.createNewFolder = async (parent) => {
			const folder = await createNewFolder.call(fileManager, parent);
			this.selected = folder;
			return folder;
		};

		this.register(() => {
			fileManager.getNewFileParent = getNewFileParent;
			fileManager.createNewFolder = createNewFolder;
		});

		// Clicking a folder selects it; clicking anything else in the explorer clears it.
		this.registerDomEvent(document, "click", (evt) => {
			const target = evt.target as HTMLElement;
			if (!target.closest('.workspace-leaf-content[data-type="file-explorer"]')) return;
			if (target.closest(".nav-header")) return; // toolbar buttons (New note, ...)

			const path = target.closest(".nav-folder-title")?.getAttribute("data-path");
			const folder = path != null ? this.app.vault.getAbstractFileByPath(path) : null;
			this.selected = folder instanceof TFolder ? folder : null;
		}, true);

		// Opening a note (including the one just created) ends the selection.
		this.registerEvent(this.app.workspace.on("file-open", () => (this.selected = null)));
	}

	private selectedFolder(): TFolder | null {
		// Ignore a folder that has since been deleted.
		const folder = this.selected;
		return folder && this.app.vault.getAbstractFileByPath(folder.path) === folder ? folder : null;
	}
}
