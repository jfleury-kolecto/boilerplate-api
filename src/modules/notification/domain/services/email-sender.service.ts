export interface IEmailMessage {
	to: string;
	subject: string;
	body: string;
}

export abstract class EmailSenderService {
	public abstract send(message: IEmailMessage): Promise<void>;
}
