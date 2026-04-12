import Sidebar from "@/components/Sidebar";

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#FBFBFF]">
      {/* Sidebar - Fixed width on Desktop */}
      <Sidebar />
      
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col md:ml-72 min-w-0 transition-all duration-500">
        <div className="flex-1 p-6 md:p-12 mt-16 md:mt-0">
          {children}
        </div>
      </main>
    </div>
  );
}
