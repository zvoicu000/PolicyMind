import nodemailer from "nodemailer";

export type SendMailInput = {
  to: string[];
  subject: string;
  text: string;
  html?: string;
};

export type SendMailResult = {
  messageId: string;
  transport: "smtp" | "ethereal";
  previewUrl?: string;
};

type MailerContext = {
  transporter: nodemailer.Transporter;
  transport: SendMailResult["transport"];
};

let cachedMailer: Promise<MailerContext> | null = null;

export async function sendMail(input: SendMailInput): Promise<SendMailResult> {
  if (!input.to.length) {
    throw new Error("At least one recipient is required");
  }

  const { transporter, transport } = await loadMailer();
  const info = await transporter.sendMail({
    from: process.env.MAIL_FROM ?? "PolicyMind <no-reply@policymind.test>",
    to: input.to.join(", "),
    subject: input.subject,
    text: input.text,
    html: input.html,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);

  return {
    messageId: info.messageId,
    transport,
    previewUrl: typeof previewUrl === "string" ? previewUrl : undefined,
  };
}

async function loadMailer(): Promise<MailerContext> {
  if (!cachedMailer) {
    cachedMailer = createMailer();
  }
  return cachedMailer;
}

async function createMailer(): Promise<MailerContext> {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return {
      transporter: nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: process.env.SMTP_SECURE === "true" || Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      }),
      transport: "smtp",
    };
  }

  const testAccount = await nodemailer.createTestAccount();
  return {
    transporter: nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    }),
    transport: "ethereal",
  };
}
