import { useState } from 'react'
import Model from 'react-body-highlighter'

function App() {
  const [activeMuscle, setActiveMuscle] = useState(null)

  function handleClick(data) {
    setActiveMuscle(data.muscle)
  }

  return (
    <div style={{ display: 'flex', gap: '40px', padding: '40px', fontFamily: 'sans-serif' }}>
      
      {/* Body Map */}
      <div style={{ width: '400px' }}>
        <h1 style={{ marginBottom: '20px' }}>Myodex</h1>
        <Model
          data={[
            { name: 'Bench Press', muscles: ['chest', 'triceps', 'front-deltoids'] },
            { name: 'Bicep Curl', muscles: ['biceps'] },
            { name: 'Squat', muscles: ['quadriceps', 'gluteal'] },
          ]}
          onClick={handleClick}
        />
      </div>

      {/* Sidebar */}
      <div style={{ paddingTop: '80px' }}>
        {activeMuscle ? (
          <>
            <h2>Selected: {activeMuscle}</h2>
            <p style={{ color: '#666' }}>Exercises will load here from your API</p>
          </>
        ) : (
          <p style={{ color: '#666' }}>Click a muscle to see exercises</p>
        )}
      </div>

    </div>
  )
}

export default App