import { json } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate } from "../shopify.server";
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid'; // Import UUID generator
import { log } from "console";

const prisma = new PrismaClient();
const arr = []; // Access token array

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];


export const loader = async ({ request }) => {
  await authenticate.admin(request);

  const shop = "testing-wishlist-inject.myshopify.com"; // Replace with your store name

  // Fetch the access token from the session table
  const session = await prisma.session.findUnique({
    where: { shop: shop }, // Ensure to check by shop now
    select: { accessToken: true },
  });

  if (!session) {
    throw new Response("Session not found", { status: 404 });
  }

  const accessToken = session.accessToken;

  // Check if products for this store are already stored in the database
  const existingProducts = await prisma.products.findMany({
    where: { store_id: session.id }, // Use session ID for store_id
  });

  if (existingProducts.length > 0) {
    return json(existingProducts);
  }

  // API call to fetch products if not found in DB
  try {
    const response = await fetch(`https://${shop}/admin/api/2023-04/products.json`, {
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
    const sessionId = "c6cb7f1e-c3d0-4743-8404-e4d24b075a66"; // Replace with the actual session ID

    // Store fetched products in the database
  // Store fetched products in the database
await Promise.all(
  data.products.map((product) =>
    prisma.products.upsert({
      where: {
        id: product.id.toString(), // Use the product ID from API as the unique identifier
      },
      update: {
        product_sku: product.sku, // Assuming product.sku is available
        product_name: product.name, // Assuming product.name is available
        featuredImage: product.featuredImage, // Assuming product.featuredImage is available
        handle: product.handle, // Assuming product.handle is available
        status: product.status, // Assuming product.status is available
        title: product.title, // Assuming product.title is available
        store_id: sessionId, // Link the product to the correct session/store
      },
      create: {
        id: product.id.toString(), // Use product ID as the primary key
        product_sku: product.sku,
        product_name: product.name,
        featuredImage: product.featuredImage,
        handle: product.handle,
        status: product.status,
        title: product.title,
        store_id: sessionId, // Link the product to the correct session/store
      },
    })
  )
);

  
    return json(data.products);
  } catch (error) {
    console.error("Error fetching products:", error);
    throw new Response("Failed to fetch products", { status: 500 });
  }
}
;


// Insert or update group products
async function insertGroupProductsToDB(productData, groupId) {
  try {
    const existingGroup = await prisma.groups.findUnique({
      where: { id: groupId },
    });

    if (!existingGroup) {
      throw new Error("Group does not exist");
    }

    const groupProductsPromises = productData.variants.map(async (variant) => {
      return await prisma.groupproducts.upsert({
        where: { id: variant.id.toString() }, // Using variant ID as unique identifier
        update: {
          group_id: groupId, // Use the provided group ID
          product_name: productData.title,
          swatch_title: variant.option1 || "No Option",
          swatch_color: variant.option2 || "No Color",
          swatch_image: productData.image?.src || null,
          sort_order: variant.position,
        },
        create: {
          id: uuidv4(), // Generate a new UUID for the group product
          group_id: groupId, // Use the provided group ID
          product_name: productData.title,
          swatch_title: variant.option1 || "No Option",
          swatch_color: variant.option2 || "No Color",
          swatch_image: productData.image?.src || null,
          sort_order: variant.position,
        },
      });
    });

    const results = await Promise.all(groupProductsPromises);
    console.log("Group products inserted/updated successfully:", results);
  } catch (error) {
    console.error("Error inserting group products:", error);
  }
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};

export default function App() {
  const { apiKey } = useLoaderData();

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <NavMenu>
        <Link to="/app" rel="home">Home</Link>
        <Link to="/app/additional">Product page</Link>
        <Link to="/app/count">Count page</Link>
      </NavMenu>
      <Outlet />
    </AppProvider>
  );
}
