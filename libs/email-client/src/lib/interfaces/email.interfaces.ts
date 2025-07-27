export interface SendEmailOptions {
  to: string;
  from: string;
  subject: string;
  html: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  content: any;
  contentType?: string;
  path?: string;
}

export interface EmailClient {
  sendEmail(options: SendEmailOptions): Promise<any>;
}
