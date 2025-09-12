export const getSellingPriceByStock = (
  saleType: "retail" | "wholesale",
  stock: any
) =>
  saleType === "retail" && stock ? stock.sellingPrice : stock!.wholesalePrice!;
