/**
 * helper function to organize classess
 * @param classes list of classes
 * @returns
 */
export function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}
