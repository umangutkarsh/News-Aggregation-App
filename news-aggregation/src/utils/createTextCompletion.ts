import {
	IHttp,
	IModify,
	IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { sendNotification } from './message';
import {
	convertToStringifiedFormat,
	systemPrompt,
	techCrunchSystemPrompt,
} from './prompts';

/**
 * Creates a text completion by sending a request to the specified AI model API.
 *
 * @param read - Provides read access to environment and settings.
 * @param room - The room where the command was executed.
 * @param user - The user who invoked the command.
 * @param modify - Provides access to modify the state of the app.
 * @param http - Provides HTTP client for making API requests.
 * @param prompts - An array of prompts or a single prompt object to be processed.
 * @returns A promise that resolves to an array of key-value pairs or an empty array if no valid response is received.
 */
export async function createTextCompletion(
	read: IRead,
	room: IRoom,
	user: IUser,
	modify: IModify,
	http: IHttp,
	prompts: { id: string; prompt: string }[] | string[]
): Promise<{ [key: string]: string }[] | []> {
	// Retrieve model and API key from environment settings
	const model = await read
		.getEnvironmentReader()
		.getSettings()
		.getValueById('llm-model');
	const mistralApiKey = await read
		.getEnvironmentReader()
		.getSettings()
		.getValueById('mistral-api-key');

	console.log('model: ', model);
	console.log('apikey-new: ', mistralApiKey);

	// Determine the API endpoint based on the selected model
	let endpoint = ``;
	if (model === 'mistral-small-latest') {
		endpoint = `https://api.mistral.ai/v1`;
	} else if (model === 'llama3-70b') {
		endpoint = `https://api.llama-api.com`;
	} else {
		throw new Error(`Model settings doesn't exist.`);
	}
	console.log('testing1: ', model);

	console.log('incomingprompot: ', prompts);

	let stringifiedPrompt = '';
	if (typeof prompts === 'object' && !Array.isArray(prompts)) {
		stringifiedPrompt = convertToStringifiedFormat(prompts);
		console.log('strifiedPrompt: ', stringifiedPrompt);
	} else if (
		Array.isArray(prompts)
		// prompts.every((item: any) => typeof item === 'string')
	) {
		stringifiedPrompt = prompts
			.map((prompt) => JSON.stringify(prompt))
			.join(' ');
	}
	console.log('stringifyfyis: ', stringifiedPrompt);
	console.log('isarray?', Array.isArray(prompts));

	// Prepare the request body for the AI API
	const body = {
		model,
		messages: [
			{
				role: 'system',
				content: systemPrompt(),
			},
			{
				role: 'user',
				content: stringifiedPrompt,
			},
		],
		temperature: 0.7,
		top_p: 1,
		max_tokens: 1000,
		stream: false,
		safe_prompt: false,
		random_seed: 1337,
	};
	console.log('testing2: ', model);
	console.log('bodaye: ', body);

	// Send the request to the AI API
	const response = await http.post(endpoint + `/chat/completions`, {
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${mistralApiKey}`, // Add the API key here
		},
		content: JSON.stringify(body),
	});
	console.log('testing3: ', model);

	if (!response?.content) {
		await sendNotification(
			read,
			modify,
			user,
			room,
			'Something is wrong with the AI to classify news. Please try again.'
		);
		throw new Error(
			'Something is wrong with the AI to classify news. Please try again.'
		);
	}
	console.log('testing4: ', model);

	console.log('modelRes: ', response.data);
	console.log('resllm: ', response);

	const parsedResponse = JSON.parse(response?.content);
	console.log('parsed: ', parsedResponse);

	// const resultObject: { [key: string]: string } = parsedResponse?.choices.map(
	// 	(choice: any, index: number) => {
	// 		return choice.message.content.trim();
	// 	}
	// );
	const resultObject = parsedResponse?.choices[0].message.content.trim();
	console.log('resansss: ', resultObject);

	// const result = Object.entries(resultObject).map(([key, value]) => ({
	// 	[key]: value,
	// }));
	// console.log('obj:', Object.entries(resultObject));

	// type KeyValuePair = { [key: string]: string };

	// const result: KeyValuePair[] = Object.entries(resultObject).map(
	// 	([key, value]) => ({ [key]: value })
	// );

	// Extract the completion text from the response
	return resultObject;
}
