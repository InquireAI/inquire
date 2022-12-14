// not to be exposed in appRouter and only used in the stripe webhook api route
import {router, protectedProcedure, publicProcedure, middleware} from '../trpc'

const isCallerStripe = middleware(({ ctx, next }) => {
  if ()
}) 