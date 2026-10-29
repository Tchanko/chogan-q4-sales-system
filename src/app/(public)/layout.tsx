import { SiteFooter } from "@/components/layout/SiteFooter";

export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      {children}
      <SiteFooter />
    </>
  );
}
