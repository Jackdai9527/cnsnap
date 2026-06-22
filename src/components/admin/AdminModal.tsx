import { AdminModalClient } from "./AdminModalClient";

type AdminModalProps = {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  widthClass?: string;
};

export function AdminModal({
  id,
  title,
  description,
  children,
  widthClass = ""
}: AdminModalProps) {
  return <AdminModalClient id={id} title={title} description={description} widthClass={widthClass}>{children}</AdminModalClient>;
}
