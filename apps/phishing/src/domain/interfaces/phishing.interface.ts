export enum PhishingStatus {
  PENDING = 'PENDING',
  SCAMMED = 'SCAMMED',
  EXPIRED = 'EXPIRED',
  FAILED = 'FAILED',
}

export interface Phishing {
  id: string;
  userId: string;
  email: string;
  userName: string;
  token: string;
  status: PhishingStatus;
  createdAt: Date;
  updatedAt?: Date;
}
