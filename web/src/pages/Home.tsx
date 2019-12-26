import React from 'react'
import { useUsersQuery } from '../generated/graphql'
export type HomeProps = {}
export const Home: React.FC<HomeProps> = () => {
  const { data } = useUsersQuery({ fetchPolicy: 'network-only' })

  if (!data) {
    return (
      <div>Home loading...</div>
    )
  }

  return (
    <div>
      <div>users:</div>
      <ul>
        {data.users.map(user => {
          return (
            <li key={user.id}>{user.email}, {user.id}</li>
          )
        })}
      </ul>
    </div>
  )
}

export default Home
