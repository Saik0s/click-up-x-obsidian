import { Vault } from "obsidian";

export function applyStylesToContainer(
	container: HTMLDivElement,
	child: {
		element: HTMLSelectElement | HTMLInputElement;
		textContent: string;
	}
) {
	container.classList.add("applyStylesToContainer");
	const textContent = document.createElement("span");
	textContent.textContent = child.textContent;

	container.appendChild(textContent);
	container.appendChild(child.element);
}

export function createSelectWithOptions(
	options: { value: string | number; text: string }[],
	textContent: string,
	largeSelect: boolean = false
) {
	const select = document.createElement("select");
	select.required = true;
	select.classList.add("createSelectWithOptions");
	select.toggleClass("largeSelect", largeSelect);
	options.forEach((optionData, index) => {
		const option = document.createElement("option");
		option.value = String(optionData.value);
		option.text = optionData.text;

		if (index === 0) {
			option.disabled = true;
			option.selected = true;
		}
		select.appendChild(option);
	});

	return { element: select, textContent };
}

export function createInputWithPlaceholder(
	placeholderText: string,
	textContent: string,
	largeInput: boolean = false,
	inputType: "input" | "textarea" = "input"
) {
	const input = document.createElement(inputType);
	input.required = true;
	input.classList.add("createInputWithPlaceholder");
	input.toggleClass("largeInput", largeInput);

	input.placeholder = placeholderText;

	return { element: input, textContent };
}

export function getElementValue(element: {
	element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
	textContent: string;
}) {
	return element.element.value;
}

export function validateForm(container: HTMLDivElement): boolean {
	const requiredFields = container.querySelectorAll("[required]");

	for (const field of Array.from(requiredFields)) {
		if (
			!(field instanceof HTMLInputElement) &&
			!(field instanceof HTMLSelectElement)
		) {
			continue;
		}

		if (!field.value.trim()) {
			return false;
		}
	}

	return true;
}
export function getElementHTML(element: any) {
	const tagName = element.tagName.toLowerCase();
	let html = "<" + tagName;

	// Attributes
	for (let i = 0; i < element.attributes.length; i++) {
		let attr = element.attributes[i];
		html += " " + attr.name + '="' + attr.value + '"';
	}

	// Close opening tag
	html += ">";

	// Children
	if (element.childNodes.length > 0) {
		for (var i = 0; i < element.childNodes.length; i++) {
			let child = element.childNodes[i];
			if (child.nodeType === Node.TEXT_NODE) {
				// Text node
				html += child.textContent;
			} else if (child.nodeType === Node.ELEMENT_NODE) {
				// Element node
				html += getElementHTML(child);
			}
		}
	}

	// Closing tag
	html += "</" + tagName + ">";

	return html;
}
export const createTable = (data: any) => {
  const headers = [
    "Order",
    "Name",
    "Status",
    "Date Created",
    "Creator",
    "Assignee",
    "Priority"
  ];

  // Create the header row
  let markdownTable = `| ${headers.join(" | ")} |\n`;
  markdownTable += `| ${headers.map(() => "---").join(" | ")} |\n`;

  // Create the data rows
  data.forEach((task) => {
    const row = headers.map((header) => {
      const value = task[header.toLowerCase().replace(" ", "_")];
      if (Array.isArray(value)) {
        return value.join(", ");
      }
      return String(value);
    });
    markdownTable += `| ${row.join(" | ")} |\n`;
  });

  return markdownTable;
};
export const createFolder = ({
	folder,
	vault,
}: {
	folder: string;
	vault: Vault;
}) => {
	const fs = vault;

	function createPath(folder: string) {
		fs.createFolder(folder)
			.then(() => {
				// console.log(`Folder created: ${folder}`);
				return true;
			})
			.catch((err: { message: string }) => {
				if (
					err.message === "Folder already exists." ||
					err.message === "File already exists."
				) {
					return true;
				} else {
					// console.error("failed create folder/file" + folder);

					return false;
				}
			});
	}

	createPath(`${folder}`);
};
