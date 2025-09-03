// app/user/layout.tsx
export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container mx-auto px-4 pt-16 pb-20"> {/* Added pt-16 for header and pb-20 for navigation */}
      {children}
    </div>
  );
}