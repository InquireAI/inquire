import { Body } from "@react-email/body";
import { Container } from "@react-email/container";
import { Head } from "@react-email/head";
import { Heading } from "@react-email/heading";
import { Html } from "@react-email/html";
import { Img } from "@react-email/img";
import { Link } from "@react-email/link";
import { Preview } from "@react-email/preview";
import { Text } from "@react-email/text";
import * as React from "react";

interface EmailProps {
  magicLink: string;
}

export default function Email({ magicLink: url }: EmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Log in with this magic link</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src={`https://inquire.run/inquire_logo.png`}
            width="64"
            height="64"
            alt="Notion's Logo"
          />
          <Heading style={h1}>Sign In</Heading>
          <Link
            href={url}
            target="_blank"
            style={{
              ...link,
              display: "block",
              marginBottom: "16px",
            }}
          >
            Click here to sign in
          </Link>
          <Text
            style={{
              ...text,
              color: "#ababab",
              marginTop: "14px",
              marginBottom: "16px",
            }}
          >
            If you didn&apos;t try to sign in, you can safely ignore this email.
          </Text>
          <Img
            src={`https://inquire.run/inquire_logo.png`}
            width="32"
            height="32"
            alt="Notion's Logo"
          />
          <Text style={footer}>
            <Link
              href="https://inquire.run"
              target="_blank"
              style={{ ...link, color: "#898989" }}
            >
              inquire.run
            </Link>
            , solve any problem with a variety of ai personas
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#ffffff",
};

const container = {
  paddingTop: "24px",
  paddingLeft: "12px",
  paddingRight: "12px",
  margin: "0 auto",
};

const h1 = {
  color: "#333",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "40px 0",
  padding: "0",
};

const link = {
  color: "#2754C5",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: "14px",
  textDecoration: "underline",
};

const text = {
  color: "#333",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: "14px",
  margin: "24px 0",
};

const footer = {
  color: "#898989",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: "12px",
  lineHeight: "22px",
  marginTop: "12px",
  marginBottom: "24px",
};
