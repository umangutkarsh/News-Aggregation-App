import {
	IAppAccessors,
	IAppInstallationContext,
	IConfigurationExtend,
	IEnvironmentRead,
	IHttp,
	ILogger,
	IModify,
	IPersistence,
	IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import { sendDirectMessageOnInstall } from './utils/message';
import { NewsCommand } from './commands/NewsCommand';
import {
	IUIKitInteractionHandler,
	UIKitBlockInteractionContext,
} from '@rocket.chat/apps-engine/definition/uikit';
import { ExecuteBlockActionHandler } from './handlers/ExecuteBlockActionHandler';

export class NewsAggregationApp extends App {
	// implements IUIKitInteractionHandler
	constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
		super(info, logger, accessors);
	}

	public async onInstall(
		context: IAppInstallationContext,
		read: IRead,
		http: IHttp,
		persistence: IPersistence,
		modify: IModify
	): Promise<void> {
		console.log('news app installed');

		const user = context.user;
		await sendDirectMessageOnInstall(read, modify, user, persistence);
	}

	public async extendConfiguration(
		configuration: IConfigurationExtend,
		environmentRead: IEnvironmentRead
	): Promise<void> {
		const newsCommand: NewsCommand = new NewsCommand(this);

		await Promise.all([
			configuration.slashCommands.provideSlashCommand(newsCommand),
		]);
	}

	// public async executeBlockActionHandler(
	// 	context: UIKitBlockInteractionContext,
	// 	read: IRead,
	// 	http: IHttp,
	// 	persis: IPersistence,
	// 	modify: IModify
	// ): Promise<IUIKitResponse> {
	// 	const handler = new ExecuteBlockActionHandler(
	// 		this,
	// 		read,
	// 		modify,
	// 		http,
	// 		persis,
	// 		context
	// 	);
	// 	return await handler.handleActions();
	// }
}
