import Footer from "../components/footer";
import Motivation from "../components/motivation";
import Navbar from "../components/navbar";

export default function ReadMorePage() {
    return (
        <div>
            <Navbar />
            <Motivation />
            <div className="px-20 py-10 text-lg text-justify gap-3 flex flex-col">
                <p>At the heart of our mission is the belief that technology should simplify life—not complicate it. That’s why our paperless event platform is built to streamline every stage of event planning, from sending invitations to managing guest responses.</p>
                <p>By replacing traditional printed invitations with smart digital tools, we empower both organizers and guests to interact more efficiently. Guests receive instant notifications, updates, and reminders, while organizers gain real-time insights and complete control over attendance, logistics, and event communication.</p>
                <p>But our vision doesn’t stop at convenience. We are committed to driving positive environmental change. Every digital invitation represents fewer trees cut down, less paper waste created, and a meaningful step toward a greener future. Together, we can transform events into experiences that are not only memorable—but sustainable.</p>
                <p>We continue to innovate, creating features that adapt to the needs of modern event planners—ensuring every event is smoother, smarter, and more environmentally responsible.</p>
            </div>
            <Footer />
        </div>
    )
}