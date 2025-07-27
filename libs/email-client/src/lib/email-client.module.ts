/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Module, Global } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { EMAIL_CLIENT, EMAIL_TRANSPORTER } from './constants';
import { EmailClient, SendEmailOptions } from './interfaces/email.interfaces';

@Global()
@Module({
  providers: [
    {
      provide: EMAIL_TRANSPORTER,
      useFactory: async () => {
        // Log configuration for debugging
        console.log('Email configuration:', {
          host: process.env.EMAIL_HOST!,
          port: process.env.EMAIL_PORT!,
          secure: process.env.EMAIL_SECURE!,
          user: process.env.EMAIL_USER!,
        });

        const transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST!,
          port: parseInt(process.env.EMAIL_PORT!, 10),
          secure: false,
          auth: {
            user: process.env.EMAIL_USER!,
            pass: process.env.EMAIL_PASSWORD!,
          },
          tls: {
            rejectUnauthorized: true, // Verify TLS certificates
          },
        });

        // Verify the connection with better error handling
        try {
          await transporter.verify();
          console.log('Email transporter initialized successfully');
          return transporter;
        } catch (error) {
          console.error('Failed to initialize email transporter:', error);
          // Return the transporter anyway to not block application startup
          // Applications should handle email sending errors gracefully
          return transporter;
        }
      },
    },
    {
      provide: EMAIL_CLIENT,
      useFactory: (transporter: nodemailer.Transporter): EmailClient => {
        return {
          sendEmail: async (options: SendEmailOptions) => {
            try {
              const result = await transporter.sendMail(options);
              console.log(`Email sent successfully to ${options.to}`);
              return result;
            } catch (error) {
              console.error(`Failed to send email to ${options.to}`, error);
              throw error;
            }
          },
        };
      },
      inject: [EMAIL_TRANSPORTER],
    },
  ],
  exports: [EMAIL_CLIENT, EMAIL_TRANSPORTER],
})
export class EmailClientModule {}
