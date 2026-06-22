import { ProductDetailPdp } from "@/components/product/ProductDetailPdp";
import { mockProductDetail } from "@/hooks/useProductDetail";

export default function ProductPdpDemoPage() {
  return <ProductDetailPdp product={mockProductDetail} />;
}
