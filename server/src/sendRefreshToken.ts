import { Response } from 'express'
export const sendRefreshToken = (res: Response, token: string) => {
  res.cookie('jid', token, {
    httpOnly: true
    // domain: '.a-yo.jp'
    // path: '/refresh_token'
  })
}
