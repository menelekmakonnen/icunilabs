import Navbar from './Navbar';
import Footer from './Footer';
import ScrollBackground from './ScrollBackground';
import ScrollNavigation from './ScrollNavigation';

interface MainLayoutProps {
    children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
    return (
        <div className="flex flex-col min-h-screen bg-neutral-950 text-neutral-50 selection:bg-neutral-800 selection:text-white relative">
            <ScrollBackground />
            <Navbar />
            <main className="flex-grow z-10 relative">
                {children}
            </main>
            <ScrollNavigation />
            <Footer />
        </div>
    );
}
