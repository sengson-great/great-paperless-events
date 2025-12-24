import Logo from "@/public/logo.png";
import Link from "next/link";

export default function Footer() {
    return (
        <footer>
            <div className="flex bg-blue-400 text-white flex-col md:flex-row px-4 md:px-0">
        <div className="w-full md:w-2/6 py-10 px-4 md:px-20">
            <img src={Logo.src} alt="Logo" className=" w-full"/>
        </div>
        
        <div className=" ps-5 py-10 md:text-2xl text-lg">
            <p className=" font-bold">Service</p>
            <div className=" flex flex-col gap-2">
                <Link href="/faq" className="text-white no-underline!">FAQ</Link>
                <a>Contact Us</a>
                <a>Our Policy</a>
                <a>Subscribe Our Newsletters</a>
                <a>Send Report</a>
            </div>
        </div>
                <div className="ps-5 md:w-1/6 py-10 md:text-2xl text-lg">
            <p className=" font-bold">Learn</p>
            <div className=" flex flex-col gap-2">
                <a>Tutorials</a>
                <a>Our Blog</a>
            <div className=" w-full text-lg md:text-2xl mt-10">
            <p className=" font-bold">Contact Us</p>
            <div className=" flex gap-2">
                <a>YT</a>
                <a>FB</a>
                <a>IG</a>
            </div>
        </div>
            </div>
        </div>
             <div className="ps-5 md:w-2/6 px-10 py-10 md:text-2xl text-lg">
                <p className=" font-bold">About Us</p>
                <p>We are third-year Information Technology Engineering students who are acquiring knowledge to improve our professional skills. We are eager to learn more about web technology. Click on our avatars to be redirected to our Facebook profiles</p>
            </div>
      </div>
      <div className=" text-center py-2">
        © Copyrighted Reserved by Group 5 Generation 10 Information Technology Engineering
      </div>
        </footer>
    )
}