import { Response } from 'express'
export const sendRefreshToken = (res: Response, token: string) => {
  res.cookie('jit', token, {
    httpOnly: true
  })
}
