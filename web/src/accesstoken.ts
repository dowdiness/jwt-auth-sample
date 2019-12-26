// eslint-disable-next-line prefer-const
export let accessToken = ''

export const setAccessToken = (s: string) => {
  accessToken = s
}

export const getAccessToken = () => {
  return accessToken
}
