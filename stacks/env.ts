export const env = {
  staging: {
    AWS_IAM_WEB_BACKEND_USER_ARN:
      "arn:aws:iam::475216627762:user/schema-hell-web-backend-user-staging",
    INQUIRE_URL: "https://staging.inquire.run",
  },
  prod: {
    AWS_IAM_WEB_BACKEND_USER_ARN:
      "arn:aws:iam::475216627762:user/schema-hell-web-backend-user-prod",
    INQUIRE_URL: "https://inquire.run",
  },
};
