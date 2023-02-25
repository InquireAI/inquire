import { render } from "@react-email/render";
import Email from "emails/magic-link";
import { createTransport } from "nodemailer";

type Args = {
  server: string;
  magicLink: string;
  host: string;
  to: string;
  from: string;
};

export async function sendVerificationRequest(args: Args) {
  const transport = createTransport(args.server);

  const text = render(Email({ magicLink: args.magicLink }), {
    plainText: true,
  });

  const html = render(Email({ magicLink: args.magicLink }));

  const result = await transport.sendMail({
    to: args.to,
    from: args.from,
    subject: `Sign in to ${args.host}`,
    text,
    html,
  });

  const failed = result.rejected.concat(result.pending).filter(Boolean);
  if (failed.length) {
    throw new Error(`Email(s) (${failed.join(", ")}) could not be sent`);
  }
}
