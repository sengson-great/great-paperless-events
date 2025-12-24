import Footer from "../components/footer";
import Navbar from "../components/navbar";

export default function FaqPage() {
    return <div>
        <Navbar />
        <div className="w-full min-h-screen lg:pt-10 md:pt-10 pt-32 flex flex-col justify-center items-center lg:gap- px-10 md:px-20">
            <h2 className=" mx-auto mb-5 font-bold!">Frequently asked questions</h2>
            <ol className="items-start">
                <li>
                    <p>1. What is a paperless event?</p>
                    <p className=" ps-3"> A paperless event uses digital tools—such as e-invitations and online event management—to reduce or
eliminate physical paper.</p>
                </li>
                <li>
                    <p>2. How do I send electronic invitations?</p>
                    <p className=" ps-3">You can create and send invitations directly through our platform. Guests receive them instantly via email 
or message.</p>
                </li>
                <li>
                    <p>3. Do guests need to download an app?</p>
                    <p className=" ps-3">No. Guests can view the invitation and respond through their browser.</p>
                </li>
                <li>
                    <p>4. Can I track who has opened or accepted the invitation?</p>
                    <p className=" ps-3">Absolutely. All information is protected with secure technology and privacy standards.</p>
                </li>
                <li>
                    <p>6. Does using this platform help the environment?</p>
                    <p className=" ps-3">Yes. Switching to digital invitations reduces paper waste and supports a more eco-friendly event process.</p>
                </li>
            </ol>
        </div>
       <Footer />
    </div>
}