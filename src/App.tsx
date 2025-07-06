
import Drawing from './component/Drawing'
import { Route, Routes } from 'react-router-dom'

function App() {


  return (
    <>
      <Routes>
        <Route path="/" element={<Drawing />} />
      </Routes>
    </>
  )
}

export default App
