import { EbcSidebar } from "@/components/ebc-dutys/ebc-sidebar";

export default function EbcDutysAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 w-full h-full -m-8">
      {/* 
        Negative margin (-m-8) is used here to offset the padding of the main HRMS layout,
        so the secondary sidebar can attach directly to the edge.
      */}
      <EbcSidebar />
      <div className="flex-1 p-8 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
