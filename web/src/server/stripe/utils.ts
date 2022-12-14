import {
  CheckoutSessionMode,
  CheckoutSessionStatus,
  SubscriptionStatus,
  PriceType,
  RecurringPriceDataInterval,
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

export const PriceTypeMap = {
  one_time: PriceType.ONE_TIME,
  recurring: PriceType.RECURRING,
};

export const RecurringPriceDataIntervalMap = {
  month: RecurringPriceDataInterval.MONTH,
  year: RecurringPriceDataInterval.YEAR,
  day: RecurringPriceDataInterval.DAY,
  week: RecurringPriceDataInterval.WEEK,
};
