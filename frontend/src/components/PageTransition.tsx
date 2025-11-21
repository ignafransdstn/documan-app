import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

interface PageTransitionProps {
  children: React.ReactNode
}

const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  const location = useLocation()
  const [displayLocation, setDisplayLocation] = useState(location)
  const [transitionStage, setTransitionStage] = useState<'fade-in' | 'fade-out'>('fade-in')

  useEffect(() => {
    if (location !== displayLocation) {
      setTransitionStage('fade-out')
    }
  }, [location, displayLocation])

  return (
    <div
      className={`page-transition ${transitionStage}`}
      onAnimationEnd={() => {
        if (transitionStage === 'fade-out') {
          setTransitionStage('fade-in')
          setDisplayLocation(location)
        }
      }}
    >
      {transitionStage === 'fade-in' ? children : displayLocation.pathname === location.pathname ? children : null}
    </div>
  )
}

export default PageTransition
