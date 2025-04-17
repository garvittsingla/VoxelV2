import { useEffect, useState } from 'react'
import './App.css'
import {useAuth} from "@clerk/clerk-react"
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'


function App() {
   const {isSignedIn,isLoaded} = useAuth()
   const navigate = useNavigate()
   const [loggedin,setloggedin] = useState(false)

   useEffect(()=>{
      if (isLoaded && isSignedIn){
         setloggedin(true)
      }
   },[isSignedIn])
   
   return (
      <div className="h-screen w-full antialiased p-8 flex flex-col bg-center" style={{ backgroundImage: `url("/pxeljungle.gif")`, backgroundSize: 'cover', backgroundRepeat: 'no-repeat', backgroundColor: '#000' }}>
         <nav>
            <ul className="flex items-center justify-between flex-row text-white font-bold text-2xl font-['VT323']">
               <li>VOXEL</li>
                <SignedOut>
               <SignInButton forceRedirectUrl="/dashboard"/>
               </SignedOut>
               <SignedIn>
               <UserButton />
               </SignedIn>
            </ul>
         </nav>

         <header className='flex flex-col items-center justify-center mt-20 gap-4'>
            <h1 className="text-white text-6xl font-bold flex flex-col font-['Inter_Tight']"><span className='text-[6rem] font-bold text-violet-400'>The Ultimate</span>Voice Chat Platform</h1>
            <p className="text-white font-bold text-2xl font-['Inter_Tight']">Leave the boring voice calls and start chatting with your friends today!</p>
            {loggedin == true ? (<button onClick={()=>{navigate("/dashboard")}} className='bg-purple-500 text-white px-3 py-2 rounded-md cursor-pointer hover:bg-purple-700 transition-all'>Go To Dashboard</button>):(null)}
            <h1 className="text-2xl md:text-5xl lg:text-7xl font-bold text-center text-white relative z-2 font-sans">

            </h1>
         </header>
      </div>
   )
}

export default App
