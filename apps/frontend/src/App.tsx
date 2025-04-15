import './App.css'
import { useNavigate } from 'react-router-dom'
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react'


function App() {
   const navigate = useNavigate()
   function signUp() {
      navigate("/game/meet")
   }
   return (
      <div className="h-screen w-full antialiased p-8 flex flex-col bg-center" style={{ backgroundImage: `url("/pxeljungle.gif")`, backgroundSize: 'cover', backgroundRepeat: 'no-repeat', backgroundColor: '#000' }}>
         <nav>
            <ul className="flex items-center justify-between flex-row text-white font-bold text-2xl font-['VT323']">
               <li>VOXEL</li>
                <SignedOut>
               <SignInButton />
               </SignedOut>
               <SignedIn>
               <UserButton />
               </SignedIn>
            </ul>
         </nav>

         <header className='flex flex-col items-center justify-center mt-20 gap-4'>
            <h1 className="text-white text-6xl font-bold flex flex-col font-['Inter_Tight']"><span className='text-[6rem] font-bold text-violet-400'>The Ultimate</span>Voice Chat Platform</h1>
            <p className="text-white font-bold text-2xl font-['Inter_Tight']">Leave the boring voice calls and start chatting with your friends today!</p>
            <h1 className="text-2xl md:text-5xl lg:text-7xl font-bold text-center text-white relative z-2 font-sans">

            </h1>
         </header>
      </div>
   )
}

export default App
