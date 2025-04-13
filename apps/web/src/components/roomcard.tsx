import react, { FC } from "react";
import { Inter_Tight, VT323, Poppins } from "next/font/google";

const inter = Inter_Tight({
    subsets: ['latin'],
    display: 'swap',
  })

const vt = VT323({
    subsets: ['latin'],
    weight: "400",
    style: "normal",
  })

const pop = Poppins({
subsets: ['latin'],
weight: "500",
style: "normal",
})

const poplight = Poppins({
    subsets: ['latin'],
    weight: "400",
    style: "normal",
    })

function Roomcard() {
    return(
        <div className="flex flex-row gap-2 bg-black rounded-sm p-2 w-70/100 h-full outline-1 outline-white/10">
            <div className={`${inter.className} relative w-[50%] rounded-md bg-center bg-cover flex flex-col justify-center items-center text-4xl gap-2 p-8 font-bold tracking-wider`} style={{backgroundImage: `url("./gdbgimg(1).jpg")`}}>
                    <p className="z-20">Smooth.</p>
                    <p className="z-20">Secure.</p>
                    <p className="z-20">Streamlined.</p>
                    <p className="z-20">Playful.</p>
                    <p className="z-20">Fast.</p>
                <div className="bg-black/50 blur-3xl w-[100%] h-[100%] absolute z-0 bottom-0 left-0">
                </div>
            </div>
            <div className="rounded-md flex flex-col p-4 justify-start items-center text-white gap-4">
                <p className={`${inter.className} text-4xl font-medium tracking-wider mb-4`}>Experience <span className={`${vt.className} text-5xl font-bold text-green-400`}>VOXEL</span></p>
                <form className="flex flex-col gap-2 items-center">
                    <div className="flex flex-row gap-3">
                        <div className="flex flex-col gap-2 items-start">
                            <label htmlFor="" className={`${poplight.className} text-xl text-center align-center`}><span className="text-4xl">🙆🏻</span> Room Name</label>
                            <input type="text" name="" id="" placeholder="Enter Room Name" className="pl-4 outline-2 outline-white/20 h-[40px] rounded-md "/>
                        </div>
                        <div className="flex flex-col gap-2 items-start">
                            <label htmlFor="" className={`${poplight.className} text-xl text-center align-center`}><span className="text-4xl">👱🏻</span> Room Size</label>
                            <input type="text" name="" id="" placeholder="Enter Room Size" className="pl-4 outline-2 outline-white/20 h-[40px] rounded-md "/>
                        </div>
                    </div>
                    <div className={`${pop.className} bg-yellow-400 h-[40px] w-40/100 hover:w-50/100 hover:bg-purple-700 transition-all duration-500  text-black flex justify-center items-center rounded-md text-xl mt-2`}><p>Create</p></div>
                    <div className="flex flex-row justify-center items-center">
                        <div className="h-[2px] border-b border-white/30  w-[200px]"></div>
                        <p className="mx-2">or</p>
                        <div className="h-[2px] border-b border-white/30 w-[200px]"></div>
                    </div>
                </form>
                <form>
                    <div className="flex flex-col gap-2 items-center">
                        <label htmlFor="" className={`${poplight.className} text-xl text-center align-center`}><span className="text-4xl">🔑</span> Room ID</label>
                        <input type="text" name="" id="" placeholder="Enter Room ID" className="pl-4 outline-2 outline-white/20 h-[40px] rounded-md"/>
                        <div className={`${pop.className} bg-yellow-400 h-[40px] w-90/100 hover:w-110/100 hover:bg-purple-700 transition-all duration-500  text-black flex justify-center items-center rounded-md text-xl mt-2`}>Join</div>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default Roomcard;
