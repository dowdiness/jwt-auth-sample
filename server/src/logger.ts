export const logSanitizedError = (message: string, err: unknown) => {
  if (err instanceof Error) {
    console.error(`${message}: ${err.name}: ${err.message}`)
    return
  }

  console.error(`${message}: non-error thrown`)
}
