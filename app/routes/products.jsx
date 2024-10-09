// app/routes/products.jsx
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Page, Card, Layout, Text, BlockStack } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { arr } from "./app"; // Ensure correct path for 'arr'
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid'; // Import UUID generator

const prisma = new PrismaClient();

export const loader = async () => {
  const accessToken = arr?.[0]; // Ensure 'arr' is defined and contains access token
  const shopifyDomain = "testing-wishlist-inject.myshopify.com"; // Replace with your store details

  if (!accessToken) {
    throw new Response("Access token missing", { status: 400 });
  }

  try {
    const response = await fetch(`https://${shopifyDomain}/admin/api/2023-04/products.json`, {
      method: "GET",
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.statusText}`);
    }

    const data = await response.json();

    // Insert products into the database (outside component)
    await Promise.all(data.products.map(insertProductToDB));

    return json(data.products);
  } catch (error) {
    console.error("Error fetching products:", error);
    throw new Response("Failed to fetch products", { status: 500 });
  }
};

async function insertProductToDB(productData) {
    try {
      const newProduct = await prisma.products.upsert({
        where: { id: productData.id.toString() }, // Use Shopify product ID as the unique identifier
        update: {
          featuredImage: productData.image?.src || null,
          handle: productData.handle,
          status: productData.status,
          title: productData.title,
        },
        create: {
          id: uuidv4(), // Generate a new UUID for the product ID
          featuredImage: productData.image?.src || null,
          handle: productData.handle,
          status: productData.status,
          title: productData.title,
          store_id: productData.id.toString(), // Use the Shopify product ID for store_id
        }
      });
  
      console.log("Product inserted/updated successfully:", newProduct);
    } catch (error) {
      console.error("Error inserting product:", error);
    }
  }

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
                <Text as="p">No products found.</Text>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
