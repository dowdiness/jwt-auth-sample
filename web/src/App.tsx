import React from 'react';
import { useQuery } from '@apollo/react-hooks'
import { gql } from 'apollo-boost'

const App: React.FC = () => {
  const { data, loading } = useQuery(gql`
    {
      hello
    }
  `)

  if(loading) return <div>Loading...</div>

  return (
    <div className="App">
      <header className="App-header">
        <h1>{JSON.stringify(data)}</h1>
      </header>
    </div>
  );
}

export default App;
