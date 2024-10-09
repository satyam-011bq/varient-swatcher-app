// app/routes/products.jsx
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react"; // Import this
import { Page, Card, Layout, Text, BlockStack } from "@shopify/polaris"; // Import necessary components
import {arr} from "./app";
import { TitleBar } from "@shopify/app-bridge-react";

export const loader = async () => {
  const accessToken = arr[0]; // Ensure 'arr' is defined and contains access token
  const shopifyDomain = "testing-wishlist-inject.myshopify.com"; // Apni store ki details yahan daalein

  try {
    const response = await fetch(`https://${shopifyDomain}/admin/api/2023-04/products.json`, {
      method: "GET",
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Products fetch karne mein problem: ${response.statusText}`);
    }

    const data = await response.json();
    return json(data.products);
  } catch (error) {
    console.error("Products fetch karne mein error:", error);
    throw new Response("Products fetch karne mein error", { status: 500 });
  }
};

export default function ProductListPage() {
  const products = useLoaderData(); // Fetch products using useLoaderData

  return (
    <Page>
      <TitleBar title="Product List" />
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <Text as="h1" variant="headingLg">Product List</Text>
              {products.length > 0 ? (
                <ul>
                  {products.map(product => (
                    <li key={product.id}>
                      <Text as="p"><strong>Title:</strong> {product.title}</Text>
                      <Text as="p"><strong>Body HTML:</strong> {product.body_html}</Text>
                      <Text as="p"><strong>Vendor:</strong> {product.vendor}</Text>
                      <Text as="p"><strong>Product Type:</strong> {product.product_type}</Text>
                      <Text as="p"><strong>Status:</strong> {product.status}</Text>
                      <Text as="p"><strong>Created At:</strong> {new Date(product.created_at).toLocaleString()}</Text>
                      <Text as="p"><strong>Updated At:</strong> {new Date(product.updated_at).toLocaleString()}</Text>
                      <Text as="p"><strong>Handle:</strong> {product.handle}</Text>
                      <Text as="p"><strong>Variants:</strong></Text>
                      <ul>
                        {product.variants.map(variant => (
                          <li key={variant.id}>
                            <Text as="p">Variant ID: {variant.id}, Price: {variant.price}, SKU: {variant.sku}</Text>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              ) : (
                <Text as="p">Koi products nahi mile.</Text>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

