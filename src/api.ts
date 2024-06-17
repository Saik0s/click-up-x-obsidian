import { TAllLists, TCreateTask, TMember } from "src/interfaces/api.types";
import { Notice, requestUrl } from "obsidian";

const fetcher = (url: string, options: RequestInit = {}) => {
	const token = localStorage.getItem("click_up_token") as string;
	const request = requestUrl({
		url: `https://app.clickup.com/api/v2/${url}`,
		headers: {
			Authorization: token,
			"Content-Type": "application/json",
		},
		method: options.method,
		body: options.body as string,
	});
	return request;
};

export const getToken = async (code: string, clientId: string, clientSecret: string) => {
	if (!code) return "MISSING_CODE";
	const query = new URLSearchParams({
		client_id: clientId,
		client_secret: clientSecret,
		code: code,
	}).toString();

	try {
		console.log("Starting getToken request with query:", query);
		const resp = await fetcher(`oauth/token?${query}`, {
			method: "POST",
		});
		console.log("Received response from getToken request:", resp);
		const data = (await resp.json) as {
			access_token: string;
			type: string;
		};
		console.log("Parsed response data:", data);
		localStorage.setItem("click_up_token", data.access_token);
		console.log("Stored access token in localStorage");
		return data.access_token;
	} catch (error: any) {
		console.error("Error during getToken()", error);
		throw new Error(`Failed to get token: ${error.message}`);
	}
};

export const getAuthorizedUser = async () => {
	const resp = await fetcher(`user`);
	const data = await resp.json;
	return data.user;
};
export const getTeams = async () => {
	const resp = await fetcher(`team`);
	const data = await resp.json;

	return data.teams;
};

export const getSpaces = async (team_id: string) => {
	const response = await fetcher(`team/${team_id}/space`);
	const data = await response.json;
	return data.spaces;
};

export const getFolders = async (space_id: string) => {
	const response = await fetcher(`space/${space_id}/folder`);
	const data = await response.json;
	return data.folders;
};

export const getList = async (folder_id: string) => {
	const response = await fetcher(`folder/${folder_id}/list`);
	const data = await response.json;
	return data.lists;
};

export const getFolderlessList = async (space_id: string) => {
	const response = await fetcher(`space/${space_id}/list`);
	const data = await response.json;
	return data.lists;
};

export const getTasks = async (list_id: string) => {
	const response = await fetcher(`list/${list_id}/task`);
	const data = await response.json;
	return data.tasks;
};

export const getClickupLists = async (
	folderId: string
): Promise<TAllLists[]> => {
	const response = await fetcher(`folder/${folderId}/list`);
	const data = await response.json;
	return data.lists;
};

export const getWorkspaceUser = async (teamId: string, userId: string) => {
	const response = await fetcher(`team/${teamId}/user/${userId}`);
	const data = await response.json;
	return data;
};

export const getAllFolders = async (space_id: string) => {
	const response = await fetcher(`space/${space_id}/folder`);
	const data = await response.json;
	return data.folders;
};

export const getListMembers = async (list_id: string): Promise<TMember[]> => {
	const response = await fetcher(`list/${list_id}/member`);
	const data = await response.json;
	return data.members;
};

export const createTask = async ({
	listId,
	data,
}: {
	listId: string;
	data: TCreateTask;
}) => {
	const response = await fetcher(`list/${listId}/task`, {
		method: "POST",
		body: JSON.stringify(data),
		headers: {
			"Content-Type": "application/json",
		},
	});
	const responseData = await response.json;
	return responseData;
};
interface ErrorResponse {
	isAuth: boolean;
	message: string;
}
export const showError = async (e: Error): Promise<ErrorResponse> => {
	console.log(e);
	if (e.message.includes("Oauth token not found")) {
		new Notice("Error related to authorization,please re-login", 10000);
		console.log("Error related to authorization,please re-login");
		return { isAuth: false, message: "no auth" };
	} else {
		new Notice(`Error:${e.message}`, 5000);
		return { isAuth: true, message: e.message };
	}
};
