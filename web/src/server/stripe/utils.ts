import {
  CheckoutSessionMode,
  CheckoutSessionStatus,
  SubscriptionStatus,
} from "../db/client";

export const CheckoutSessionModeMap = {
  subscription: CheckoutSessionMode.SUBSCRIPTION,
  payment: CheckoutSessionMode.PAYMENT,
  setup: CheckoutSessionMode.SETUP,
};

export const CheckoutSessionStatusMap = {
  complete: CheckoutSessionStatus.COMPLETE,
  expired: CheckoutSessionStatus.EXPIRED,
  open: CheckoutSessionStatus.OPEN,
};

export const SubscriptionStatusMap = {
  incomplete: SubscriptionStatus.INCOMPLETE,
  incomplete_expired: SubscriptionStatus.INCOMPLETE_EXPIRED,
  trialing: SubscriptionStatus.TRIALING,
  active: SubscriptionStatus.ACTIVE,
  past_due: SubscriptionStatus.PAST_DUE,
  canceled: SubscriptionStatus.CANCELED,
  unpaid: SubscriptionStatus.UNPAID,
};
